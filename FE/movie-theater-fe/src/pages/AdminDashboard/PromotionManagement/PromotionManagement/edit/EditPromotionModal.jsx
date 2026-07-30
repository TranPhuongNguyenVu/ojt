import React, { useState } from "react";
import PromotionService from "../../../../../services/PromotionService";
import PromotionModalLayout from "../shared/PromotionModalLayout";
import PromotionModalFooter from "../shared/PromotionModalFooter";
import PromotionFormFields from "../shared/PromotionFormFields";
import {
  buildPromotionPayload,
  getApiErrorMessage,
  toDateTimeLocal,
} from "../shared/promotionFormConstants";

const EditPromotionModal = ({ promotion, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: promotion.title || "",
    detail: promotion.detail || "",
    discountType: promotion.discountType || "FIXED",
    discountLevel:
      promotion.discountLevel ?? promotion.promotionValue ?? "",
    usageLimit: promotion.usageLimit ?? "",
    startTime: toDateTimeLocal(promotion.startTime),
    endTime: toDateTimeLocal(promotion.endTime),
    image: promotion.image || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    if (!formData.discountLevel || Number(formData.discountLevel) <= 0) {
      setErrorMessage("Mức giảm phải lớn hơn 0.");
      return;
    }

    if (
      formData.discountType === "PERCENT" &&
      Number(formData.discountLevel) > 100
    ) {
      setErrorMessage("Mức giảm phần trăm không được vượt quá 100%.");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setErrorMessage("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setErrorMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await PromotionService.update(
        promotion.promotionId,
        buildPromotionPayload(formData)
      );
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật khuyến mãi.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PromotionModalLayout title="Chỉnh sửa khuyến mãi" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <PromotionFormFields formData={formData} onChange={handleChange} />
        </div>

        <PromotionModalFooter
          onCancel={onClose}
          submitLabel="Lưu thay đổi"
          isSubmitting={isSubmitting}
        />
      </form>
    </PromotionModalLayout>
  );
};

export default EditPromotionModal;
