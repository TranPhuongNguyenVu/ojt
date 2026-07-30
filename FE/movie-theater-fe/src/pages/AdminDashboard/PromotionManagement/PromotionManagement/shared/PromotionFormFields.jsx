import React from "react";
import {
  Tag,
  FileText,
  Percent,
  Hash,
  Calendar,
  Image,
} from "lucide-react";
import {
  fieldInputClass,
  fieldSelectClass,
  fieldTextareaClass,
  fieldLabelClass,
} from "./promotionFormConstants";

const RequiredMark = () => <span className="text-red-500">*</span>;

const Field = ({ label, required, icon: Icon, colSpan = false, children }) => (
  <div className={colSpan ? "md:col-span-2" : ""}>
    <label className={fieldLabelClass}>
      {label} {required && <RequiredMark />}
    </label>
    {Icon ? (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Icon size={16} />
        </span>
        {children}
      </div>
    ) : (
      children
    )}
  </div>
);

const PromotionFormFields = ({ formData, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
    <Field label="Tiêu đề" required icon={Tag} colSpan>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={onChange}
        required
        maxLength={150}
        placeholder="Nhập tiêu đề khuyến mãi..."
        className={fieldInputClass}
      />
    </Field>

    <Field label="Mô tả chi tiết" icon={FileText} colSpan>
      <textarea
        name="detail"
        value={formData.detail}
        onChange={onChange}
        rows={3}
        maxLength={500}
        placeholder="Mô tả điều kiện, phạm vi áp dụng..."
        className={fieldTextareaClass}
      />
    </Field>

    <Field label="Loại giảm giá" required icon={Percent}>
      <select
        name="discountType"
        value={formData.discountType}
        onChange={onChange}
        required
        className={fieldSelectClass}
      >
        <option value="FIXED">Số tiền cố định (FIXED)</option>
        <option value="PERCENT">Phần trăm (PERCENT)</option>
      </select>
    </Field>

    <Field label="Mức giảm" required icon={Hash}>
      <input
        type="number"
        name="discountLevel"
        value={formData.discountLevel}
        onChange={onChange}
        required
        min="0"
        step="0.01"
        placeholder={formData.discountType === "PERCENT" ? "20" : "50000"}
        className={fieldInputClass}
      />
    </Field>

    <Field label="Giới hạn lượt dùng" icon={Hash}>
      <input
        type="number"
        name="usageLimit"
        value={formData.usageLimit}
        onChange={onChange}
        min="0"
        placeholder="Để trống = không giới hạn"
        className={fieldInputClass}
      />
    </Field>

    <Field label="URL hình ảnh" icon={Image}>
      <input
        type="text"
        name="image"
        value={formData.image}
        onChange={onChange}
        maxLength={500}
        placeholder="https://..."
        className={fieldInputClass}
      />
    </Field>

    <Field label="Thời gian bắt đầu" required icon={Calendar}>
      <input
        type="datetime-local"
        name="startTime"
        value={formData.startTime}
        onChange={onChange}
        required
        className={fieldInputClass}
      />
    </Field>

    <Field label="Thời gian kết thúc" required icon={Calendar}>
      <input
        type="datetime-local"
        name="endTime"
        value={formData.endTime}
        onChange={onChange}
        required
        className={fieldInputClass}
      />
    </Field>
  </div>
);

export default PromotionFormFields;
