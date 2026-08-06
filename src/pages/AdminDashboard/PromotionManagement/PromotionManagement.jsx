import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search, Tag, Power, PowerOff, RotateCcw } from "lucide-react";
import PromotionService from "../../../services/PromotionService";
import { getApiErrorMessage } from "../../../services/ApiErrorUtils";
import Pagination from "../../../components/Pagination";
import PromotionDetailModal from "./detail/PromotionDetailModal";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDiscount = (type, level) => {
  if (level == null) return "—";
  return type === "PERCENT" ? `${level}%` : `${Number(level).toLocaleString("vi-VN")}đ`;
};

const STATUS_BADGE = {
  ACTIVE: { label: "Đang hoạt động", cls: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" },
  INACTIVE: { label: "Tạm ngừng", cls: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400" },
  DELETED: { label: "Đã xóa", cls: "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200" },
};

const getCurrentRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("USER_LOGIN") || "null");
    return (user?.roleName || user?.role?.roleName || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

const PAGE_SIZE = 10;

const PromotionManagement = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingPromotion, setViewingPromotion] = useState(null);
  const canReactivate = ["admin", "systemadmin"].includes(getCurrentRole());

  const fetchPromotions = async (searchKeyword = keyword) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await PromotionService.getAllAdmin(searchKeyword);
      setPromotions(response.data.data || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tải danh sách khuyến mãi."));
      setPromotions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(promotions.length / PAGE_SIZE));
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return promotions.slice(start, start + PAGE_SIZE);
  }, [promotions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchPromotions(keyword);
  };

  const handleDelete = async (promo) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa khuyến mãi "${promo.title}"?`);
    if (!confirmed) return;

    try {
      await PromotionService.delete(promo.promotionId);
      await fetchPromotions();
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể xóa khuyến mãi."));
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      if (promo.status === "ACTIVE") {
        await PromotionService.deactivate(promo.promotionId);
      } else if (promo.status === "INACTIVE") {
        await PromotionService.activate(promo.promotionId);
      }
      await fetchPromotions();
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể đổi trạng thái khuyến mãi."));
    }
  };

  const handleReactivate = async (promo) => {
    const confirmed = window.confirm(`Khôi phục khuyến mãi "${promo.title}"?`);
    if (!confirmed) return;

    try {
      await PromotionService.reactivate(promo.promotionId);
      await fetchPromotions();
    } catch (error) {
      alert(getApiErrorMessage(error, "Không thể khôi phục khuyến mãi."));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      <header className="min-h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quản lý khuyến mãi</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative sm:w-72">
            <label className="block">
              <span className="sr-only">Tìm kiếm khuyến mãi</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tiêu đề hoặc nội dung..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#C00000] focus:ring-2 focus:ring-[#C00000]/20"
              />
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </label>
          </form>
          <button type="button" onClick={() => navigate("/admin/promotions/add")} className="flex items-center justify-center gap-2 rounded-lg bg-[#C00000] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#a00000]">
            <Plus size={16} />Thêm khuyến mãi
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-bold">
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Giảm giá</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Lượt dùng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center text-[#C00000] dark:text-red-400 font-black text-2xl tracking-widest uppercase"
                  >
                    Danh sách trống!
                  </td>
                </tr>
              ) : (
                paginatedPromotions.map((promo) => (
                  <tr
                    key={promo.promotionId}
                    onClick={() => setViewingPromotion(promo)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#FFF0F2] dark:bg-red-950/40 rounded-lg flex items-center justify-center text-[#C00000] dark:text-red-300 shrink-0 overflow-hidden">
                          {promo.image ? (
                            <img src={promo.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Tag size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{promo.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
                            {promo.detail || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatDiscount(promo.discountType, promo.discountLevel)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(promo.startTime)} → {formatDate(promo.endTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {promo.usedCount ?? 0} / {promo.usageLimit ?? "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${(STATUS_BADGE[promo.status] || STATUS_BADGE.INACTIVE).cls}`}>
                        {(STATUS_BADGE[promo.status] || STATUS_BADGE.INACTIVE).label}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-3">
                        {promo.status === "DELETED" ? (
                          canReactivate && (
                            <button
                              type="button"
                              onClick={() => handleReactivate(promo)}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors"
                              title="Khôi phục"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(promo)}
                              className={promo.status === "ACTIVE"
                                ? "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 p-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                                : "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"}
                              title={promo.status === "ACTIVE" ? "Tạm ngừng" : "Kích hoạt"}
                            >
                              {promo.status === "ACTIVE" ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/promotions/edit/${promo.promotionId}`)}
                              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(promo)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && promotions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={promotions.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="khuyến mãi"
            />
          )}
        </div>
      </main>

      {viewingPromotion && (
        <PromotionDetailModal
          promotion={viewingPromotion}
          onClose={() => setViewingPromotion(null)}
          onEdit={() => {
            const id = viewingPromotion.promotionId;
            setViewingPromotion(null);
            navigate(`/admin/promotions/edit/${id}`);
          }}
        />
      )}
    </div>
  );
};

export default PromotionManagement;
