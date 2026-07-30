import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Tag } from "lucide-react";
import PromotionService from "../../../services/PromotionService";
import { getApiErrorMessage } from "../../../services/ApiErrorUtils";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDiscount = (type, level) => {
  if (level == null) return "—";
  return type === "PERCENT" ? `${level}%` : `${Number(level).toLocaleString("vi-VN")}đ`;
};

const PromotionManagement = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPromotions = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await PromotionService.getAll();
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
  }, []);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans -m-8 md:-m-10">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <h2 className="text-xl font-bold text-gray-800">Quản lý khuyến mãi</h2>
        <button
          type="button"
          onClick={() => navigate("/admin/promotions/add")}
          className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2.5 rounded-lg"
        >
          <Plus size={16} />
          Thêm khuyến mãi
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-bold">
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Giảm giá</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Lượt dùng</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase"
                  >
                    Danh sách trống!
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.promotionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#FFF0F2] rounded-lg flex items-center justify-center text-[#C00000] shrink-0">
                          <Tag size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{promo.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[240px]">
                            {promo.detail || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {formatDiscount(promo.discountType, promo.discountLevel)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(promo.startTime)} → {formatDate(promo.endTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {promo.usedCount ?? 0} / {promo.usageLimit ?? "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/promotions/edit/${promo.promotionId}`)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
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
      </main>
    </div>
  );
};

export default PromotionManagement;
