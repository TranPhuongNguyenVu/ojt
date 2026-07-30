import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import PromotionService from "../../../services/PromotionService";
import { getApiErrorMessage } from "../../../services/ApiErrorUtils";


const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyForm = {
  title: "",
  detail: "",
  discountType: "FIXED",
  discountLevel: "",
  usageLimit: "",
  startTime: "",
  endTime: "",
  image: "",
};

const PromotionForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const loadPromotion = async () => {
      try {
        const response = await PromotionService.getById(id);
        const promo = response.data.data;
        setFormData({
          title: promo.title || "",
          detail: promo.detail || "",
          discountType: promo.discountType || "FIXED",
          discountLevel: promo.discountLevel ?? "",
          usageLimit: promo.usageLimit ?? "",
          startTime: toDateTimeLocal(promo.startTime),
          endTime: toDateTimeLocal(promo.endTime),
          image: promo.image || "",
        });
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Không thể tải khuyến mãi."));
      } finally {
        setIsLoading(false);
      }
    };

    loadPromotion();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề khuyến mãi.");
      return;
    }

    const payload = {
      title: formData.title,
      detail: formData.detail,
      discountType: formData.discountType,
      discountLevel: formData.discountLevel ? Number(formData.discountLevel) : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      image: formData.image || null,
    };

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await PromotionService.update(id, payload);
      } else {
        await PromotionService.create(payload);
      }
      navigate("/admin/promotions");
    } catch (error) {
      setErrorMessage(
getApiErrorMessage(error, isEdit ? "Không thể cập nhật khuyến mãi." : "Không thể thêm khuyến mãi.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 font-sans -m-8 md:-m-10">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-8">
        <button
          type="button"
          onClick={() => navigate("/admin/promotions")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {isEdit ? "Chỉnh sửa Khuyến mãi" : "Thêm Khuyến mãi mới"}
        </h2>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6"
        >
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Tiêu đề *
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={255}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Mô tả
            </label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Loại giảm giá
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
>
                <option value="FIXED">Số tiền cố định (FIXED)</option>
                <option value="PERCENT">Phần trăm (PERCENT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Mức giảm
              </label>
              <input
                type="number"
                name="discountLevel"
                value={formData.discountLevel}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">git 
                Giới hạn lượt dùng
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                URL hình ảnh
              </label>
              <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Bắt đầu
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Kết thúc
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
/>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/promotions")}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-lg"
            >
              <Save size={16} />
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PromotionForm;
