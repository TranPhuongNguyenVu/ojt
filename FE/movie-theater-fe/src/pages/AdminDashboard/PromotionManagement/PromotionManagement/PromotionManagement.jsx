import React, { useEffect, useMemo, useState, useRef } from "react";
import { Edit, Trash2, Search, Plus, Tag } from "lucide-react";
import Pagination from "../../../../components/Pagination";
import PromotionService from "../../../../services/PromotionService";
import AddPromotionModal from "./add/AddPromotionModal";
import EditPromotionModal from "./edit/EditPromotionModal";
import DeletePromotionModal from "./delete/DeletePromotionModal";
import {
  formatDate,
  formatDiscount,
  getApiErrorMessage,
} from "./shared/promotionFormConstants";

const PAGE_SIZE = 10;

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [deletingPromotion, setDeletingPromotion] = useState(null);

  // Backend returns full list (ApiResponse.data = List), paginate on client like EmployeeManagement
  const fetchPromotions = async (searchKeyword = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await PromotionService.getAll(searchKeyword);
      const items = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setPromotions(items);
      setCurrentPage(1);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải danh sách khuyến mãi.")
      );
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const totalItems = promotions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return promotions.slice(start, start + PAGE_SIZE);
  }, [promotions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const searchDebounceRef = useRef(null);
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPromotions(keyword);
  };

  const onKeywordChange = (value) => {
    setKeyword(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchPromotions(value);
    }, 500);
  };

  const handleRefresh = () => fetchPromotions(keyword);

  const thClass =
    "px-4 py-3 text-xs tracking-wider text-gray-500 font-bold whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-600";

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans -m-8 md:-m-10">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Khuyến mãi</h2>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              maxLength={100}
              placeholder="Tìm kiếm khuyến mãi..."
              className="bg-gray-100 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 w-56"
            />
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </form>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            Thêm khuyến mãi
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table view for md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className={`${thClass} w-[8%]`}>Mã KM</th>
                  <th className={`${thClass} w-[24%]`}>Tiêu đề</th>
                  <th className={`${thClass} w-[12%]`}>Giảm giá</th>
                  <th className={`${thClass} w-[22%]`}>Thời gian</th>
                  <th className={`${thClass} w-[12%]`}>Lượt dùng</th>
                  <th className={`${thClass} w-[12%]`}>Hình ảnh</th>
                  <th className={`${thClass} w-[10%] text-center`}>Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-16 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase"
                    >
                      Empty list!
                    </td>
                  </tr>
                ) : (
                  paginatedPromotions.map((promo) => (
                    <tr key={promo.promotionId} className="hover:bg-gray-50 transition-colors">
                      <td className={`${tdClass} text-xs font-mono text-gray-500`}>
                        #{promo.promotionId}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-[#FFF0F2] rounded-lg flex items-center justify-center text-[#C00000] shrink-0">
                            <Tag size={16} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold text-gray-900 truncate"
                              title={promo.title}
                            >
                              {promo.title}
                            </p>
                            <p
                              className="text-xs text-gray-500 truncate"
                              title={promo.detail || promo.content}
                            >
                              {promo.detail || promo.content || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} font-medium text-gray-700`}>
                        {formatDiscount(
                          promo.discountType,
                          promo.discountLevel ?? promo.promotionValue
                        )}
                      </td>
                      <td className={`${tdClass} text-gray-500 text-xs`}>
                        {formatDate(promo.startTime)} → {formatDate(promo.endTime)}
                      </td>
                      <td className={tdClass}>
                        {promo.usedCount ?? 0} / {promo.usageLimit ?? "∞"}
                      </td>
                      <td className={`${tdClass} truncate text-xs`} title={promo.image}>
                        {promo.image ? (
                          <img
                            src={promo.image}
                            alt={promo.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPromotion(promo)}
                            className="text-blue-500 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPromotion(promo)}
                            className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-md"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Card view for small screens */}
          <div className="md:hidden p-4">
            {isLoading ? null : promotions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Không có khuyến mãi.</div>
            ) : (
              <div className="space-y-4">
                {paginatedPromotions.map((promo) => (
                  <div key={promo.promotionId} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      {promo.image ? (
                        <img src={promo.image} alt={promo.title} className="w-20 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-50 rounded flex items-center justify-center text-gray-400">—</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{promo.title}</p>
                        <p className="text-xs text-gray-500 truncate">{promo.detail || promo.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(promo.startTime)} → {formatDate(promo.endTime)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditingPromotion(promo)} className="text-blue-500 text-sm">Sửa</button>
                        <button onClick={() => setDeletingPromotion(promo)} className="text-red-500 text-sm">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isLoading && totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="khuyến mãi"
            />
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <AddPromotionModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {editingPromotion && (
        <EditPromotionModal
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
          onSuccess={handleRefresh}
        />
      )}

      {deletingPromotion && (
        <DeletePromotionModal
          promotion={deletingPromotion}
          onClose={() => setDeletingPromotion(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default PromotionManagement;
