export const emptyPromotionForm = {
  title: "",
  detail: "",
  discountType: "FIXED",
  discountLevel: "",
  usageLimit: "",
  startTime: "",
  endTime: "",
  image: "",
};

export const fieldInputClass =
  "block w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldSelectClass =
  "block w-full rounded-lg border border-gray-200 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white";

export const fieldTextareaClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm resize-none";

export const fieldLabelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";

export const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

export const formatDiscount = (type, level) => {
  const value = level ?? "";
  if (value === "" || value == null) return "—";
  return type === "PERCENT"
    ? `${value}%`
    : `${Number(value).toLocaleString("vi-VN")}đ`;
};

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

/** Normalize datetime-local (yyyy-MM-ddThh:mm) to LocalDateTime-friendly ISO. */
const toApiDateTime = (value) => {
  if (!value) return null;
  // Already has seconds
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return value;
  // datetime-local → add seconds
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
};

export const buildPromotionPayload = (formData) => {
  const discountLevel = Number(formData.discountLevel);
  return {
    title: formData.title.trim(),
    detail: formData.detail?.trim() || null,
    content: formData.detail?.trim() || null,
    discountType: formData.discountType,
    discountLevel,
    promotionValue: discountLevel, 
    usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
    startTime: toApiDateTime(formData.startTime),
    endTime: toApiDateTime(formData.endTime),
    image: formData.image?.trim() || null,
  };
};
