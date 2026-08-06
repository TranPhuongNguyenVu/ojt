import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Loader2,
  ZoomIn,
} from "lucide-react";
import PromotionService from "../../../services/PromotionService";
import { getApiErrorMessage } from "../../../services/ApiErrorUtils";
import ImageLightbox from "../../../components/ImageLightbox";

const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
const baseInput =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 outline-none focus:border-[#C00000] focus:ring-2 focus:ring-[#C00000]/20 dark:focus:ring-red-500/20 transition-colors";
const emptyForm = {
  audience: "STANDARD",
  title: "",
  content: "",
  detail: "",
  discountType: "FIXED",
  promotionValue: "",
  usageLimit: "",
  startAt: "",
  endAt: "",
  image: "",
  bookingUrl: "",
  status: "ACTIVE",
  applicableDayOfWeek: "",
  applicableStartTime: "",
  applicableEndTime: "",
  allowMultipleUsePerCustomer: "true",
};
const toApiDateTime = (value) => (value ? `${value}:00` : null);
const minDateTimeLocal = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const Field = ({ label, required, error, children }) => (
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
    {label}
    {required && " *"}
    {children}
    {error && (
      <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
    )}
  </label>
);

const ImageUploadField = ({ value, onChange }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await PromotionService.uploadImage(file);
      const url = res.data?.data || res.data?.url || res.data;
      onChange({ target: { name: "image", value: url || "" } });
    } catch {
      setUploadError("Tải ảnh thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hình ảnh (không bắt buộc)</p>
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            className={baseInput + " !mt-0"}
            name="image"
            value={value}
            onChange={onChange}
            type="text"
            placeholder="https://... hoặc tải ảnh lên"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Tải lên
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {uploadError && <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>}
        {value && (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0"
            title="Xem ảnh lớn"
          >
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
              <ZoomIn
                size={18}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </span>
          </button>
        )}
      </div>
      <ImageLightbox src={zoomOpen ? value : null} onClose={() => setZoomOpen(false)} />
    </div>
  );
};

const PromotionForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvalid = (event) => {
    const { name, validity } = event.target;
    const messages = {
      title: "Tiêu đề ưu đãi không được để trống.",
      content: "Nội dung khuyến mãi không được để trống.",
      promotionValue: "Giá trị ưu đãi phải lớn hơn 0.",
      usageLimit: "Giới hạn lượt dùng phải lớn hơn hoặc bằng 1.",
      startAt: "Thời gian bắt đầu không được để trống hoặc không hợp lệ.",
      endAt: "Thời gian kết thúc không được để trống hoặc không hợp lệ.",
      applicableDayOfWeek: "Vui lòng chọn thứ áp dụng.",
      bookingUrl: "URL đặt vé không hợp lệ.",
    };
    if (validity.rangeUnderflow && name === "startAt") {
      event.target.setCustomValidity("Thời gian bắt đầu phải từ thời điểm hiện tại trở đi.");
    } else if (validity.rangeUnderflow && name === "endAt") {
      event.target.setCustomValidity("Thời gian kết thúc phải sau thời gian bắt đầu.");
    } else if (validity.rangeUnderflow && name === "usageLimit") {
      event.target.setCustomValidity("Giới hạn lượt dùng phải lớn hơn hoặc bằng 1.");
    } else if (validity.rangeUnderflow && name === "promotionValue") {
      event.target.setCustomValidity("Giá trị ưu đãi phải lớn hơn 0.");
    } else {
      event.target.setCustomValidity(messages[name] || "Vui lòng kiểm tra lại thông tin đã nhập.");
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    PromotionService.getByIdAdmin(id)
      .then(({ data }) => {
        const promo = data.data;
        setFormData({
          audience: promo.birthdayOnly
            ? "BIRTHDAY"
            : promo.applicableDayOfWeek
              ? "WEEKDAY"
              : "STANDARD",
          title: promo.title || "",
          content: promo.content || "",
          detail: promo.detail || "",
          discountType: promo.discountType || "FIXED",
          promotionValue: promo.promotionValue ?? promo.discountLevel ?? "",
          usageLimit: promo.usageLimit ?? "",
          startAt: promo.startTime?.slice(0, 16) || "",
          endAt: promo.endTime?.slice(0, 16) || "",
          image: promo.image || "",
          bookingUrl: promo.bookingUrl || "",
          status: promo.status || "ACTIVE",
          applicableDayOfWeek: promo.applicableDayOfWeek ?? "",
          applicableStartTime: promo.applicableStartTime?.slice(0, 5) || "",
          applicableEndTime: promo.applicableEndTime?.slice(0, 5) || "",
          allowMultipleUsePerCustomer:
            promo.allowMultipleUsePerCustomer === false ? "false" : "true",
        });
      })
      .catch((error) =>
        setErrors({ form: getApiErrorMessage(error, "Không thể tải thông tin khuyến mãi.") })
      )
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const change = (event) => {
    const { name, value } = event.target;
    event.target.setCustomValidity?.("");
    let nextValue = value;
    if (name === "promotionValue") {
      nextValue = String(value).replace(/[^\d.]/g, "");
      const [whole, ...decimals] = nextValue.split(".");
      nextValue = decimals.length > 0 ? `${whole}.${decimals.join("").slice(0, 2)}` : whole;
    }
    if (name === "usageLimit") {
      nextValue = String(value).replace(/\D/g, "");
    }
    setFormData((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
  };

  const blockNonNumericKey = (event) => {
    if (["e", "E", "+", "-", " "].includes(event.key)) {
      event.preventDefault();
    }
  };

  const validateBusinessRules = () => {
    const next = {};
    const minimumStart = minDateTimeLocal();
    const value = Number(formData.promotionValue);
    if (!(value > 0)) next.promotionValue = "Giá trị khuyến mãi phải lớn hơn 0.";
    if (formData.discountType === "PERCENT" && value > 100)
      next.promotionValue = "Phần trăm giảm giá không được vượt quá 100%.";
    if (formData.usageLimit && Number(formData.usageLimit) < 1)
      next.usageLimit = "Giới hạn lượt dùng phải từ 1 trở lên.";
    if (formData.audience === "WEEKDAY" && !formData.applicableDayOfWeek)
      next.applicableDayOfWeek = "Vui lòng chọn ngày áp dụng.";
    if (!isEdit && formData.startAt && formData.startAt < minimumStart)
      next.startAt = "Thời gian bắt đầu phải từ thời điểm hiện tại trở đi.";
    if (formData.startAt && formData.endAt && formData.endAt <= formData.startAt)
      next.endAt = "Thời gian kết thúc phải sau thời gian bắt đầu.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (!formRef.current?.reportValidity()) return;
    if (step === 3 && !validateBusinessRules()) return;
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!formRef.current?.reportValidity() || !validateBusinessRules()) return;
    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim() || null,
      detail: formData.detail.trim() || null,
      discountType: formData.discountType,
      promotionValue: Number(formData.promotionValue),
      discountLevel: Number(formData.promotionValue),
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      startTime: toApiDateTime(formData.startAt),
      endTime: toApiDateTime(formData.endAt),
      image: formData.image.trim() || null,
      bookingUrl: formData.bookingUrl.trim() || null,
      status: formData.status,
      birthdayOnly: formData.audience === "BIRTHDAY",
      applicableDayOfWeek:
        formData.audience === "WEEKDAY" ? Number(formData.applicableDayOfWeek) : null,
      applicableStartTime:
        formData.audience === "WEEKDAY" ? formData.applicableStartTime || null : null,
      applicableEndTime:
        formData.audience === "WEEKDAY" ? formData.applicableEndTime || null : null,
      allowMultipleUsePerCustomer: formData.allowMultipleUsePerCustomer === "true",
    };
    setIsSubmitting(true);
    try {
      if (isEdit) await PromotionService.update(id, payload);
      else await PromotionService.create(payload);
      navigate("/admin/promotions");
    } catch (error) {
      setErrors({ form: getApiErrorMessage(error, "Không thể lưu khuyến mãi. Vui lòng thử lại.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[400px] place-items-center text-gray-500 dark:text-gray-400">
        Đang tải khuyến mãi...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 font-sans -m-4 sm:-m-6 md:-m-8 lg:-m-10">
      <header className="flex min-h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => navigate("/admin/promotions")}
          className="rounded-lg p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          {isEdit ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi"}
        </h1>
      </header>

      <main className="p-4 sm:p-8">
        <form
          ref={formRef}
          onSubmit={submit}
          onInvalid={handleInvalid}
          className="mx-auto max-w-4xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm sm:p-8"
        >
          {!isEdit && (
            <div className="mb-8 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <span
                className={
                  step >= 1
                    ? "rounded-full bg-[#C00000] py-2 text-white"
                    : "rounded-full bg-gray-100 dark:bg-gray-800 py-2 text-gray-500 dark:text-gray-400"
                }
              >
                1. Đối tượng
              </span>
              <span
                className={
                  step >= 2
                    ? "rounded-full bg-[#C00000] py-2 text-white"
                    : "rounded-full bg-gray-100 dark:bg-gray-800 py-2 text-gray-500 dark:text-gray-400"
                }
              >
                2. Nội dung
              </span>
              <span
                className={
                  step >= 3
                    ? "rounded-full bg-[#C00000] py-2 text-white"
                    : "rounded-full bg-gray-100 dark:bg-gray-800 py-2 text-gray-500 dark:text-gray-400"
                }
              >
                3. Điều kiện
              </span>
            </div>
          )}

          {errors.form && (
            <div className="mb-5 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
              {errors.form}
            </div>
          )}

          {(isEdit || step === 1) && (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Khuyến mãi áp dụng cho ai?
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Lựa chọn này sẽ quyết định các điều kiện ở bước sau.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["STANDARD", "Tất cả khách hàng", "Khuyến mãi thông thường, không có điều kiện đối tượng."],
                  ["WEEKDAY", "Theo ngày trong tuần", "Áp dụng theo một ngày trong tuần và khung giờ tùy chọn."],
                  ["BIRTHDAY", "Khách hàng sinh nhật", "Áp dụng cho khách hàng vào ngày sinh nhật; không hiển thị điều kiện theo thứ."],
                ].map(([value, title, description]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                      formData.audience === value
                        ? "border-[#C00000] bg-red-50 dark:bg-red-900/30 dark:border-red-700"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="audience"
                      value={value}
                      checked={formData.audience === value}
                      onChange={change}
                    />
                    <span className="block font-bold text-gray-900 dark:text-white">{title}</span>
                    <span className="mt-2 block text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {(isEdit || step === 2) && (
            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Tiêu đề khuyến mãi" required error={errors.title}>
                <input
                  className={baseInput}
                  name="title"
                  value={formData.title}
                  onChange={change}
                  required
                  maxLength="150"
                />
              </Field>
              <Field label="Trạng thái">
                <select className={baseInput} name="status" value={formData.status} onChange={change}>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngừng</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Nội dung khuyến mãi" required>
                  <input
                    className={baseInput}
                    name="content"
                    value={formData.content}
                    onChange={change}
                    required
                    maxLength="255"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Mô tả chi tiết">
                  <textarea
                    className={baseInput}
                    name="detail"
                    value={formData.detail}
                    onChange={change}
                    rows="4"
                    maxLength="500"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField value={formData.image} onChange={change} />
              </div>
              <Field label="URL đặt vé (không bắt buộc)">
                <input
                  className={baseInput}
                  name="bookingUrl"
                  value={formData.bookingUrl}
                  onChange={change}
                  type="url"
                  placeholder="https://..."
                />
              </Field>
            </section>
          )}

          {(isEdit || step === 3) && (
            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Loại giảm giá" required>
                <select
                  className={baseInput}
                  name="discountType"
                  value={formData.discountType}
                  onChange={change}
                >
                  <option value="FIXED">Số tiền cố định (VND)</option>
                  <option value="PERCENT">Phần trăm</option>
                </select>
              </Field>
              <Field
                label={
                  formData.discountType === "PERCENT"
                    ? "Phần trăm giảm giá"
                    : "Số tiền giảm (VND)"
                }
                required
                error={errors.promotionValue}
              >
                <input
                  className={baseInput}
                  name="promotionValue"
                  value={formData.promotionValue}
                  onChange={change}
                  onKeyDown={blockNonNumericKey}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = (e.clipboardData.getData("text") || "").replace(/[^\d.]/g, "");
                    const [whole, ...decimals] = pasted.split(".");
                    const cleaned =
                      decimals.length > 0 ? `${whole}.${decimals.join("").slice(0, 2)}` : whole;
                    setFormData((current) => ({ ...current, promotionValue: cleaned }));
                    setErrors((current) => ({ ...current, promotionValue: "", form: "" }));
                  }}
                  required
                  inputMode="decimal"
                  type="text"
                  placeholder={formData.discountType === "PERCENT" ? "VD: 10" : "VD: 50000"}
                />
              </Field>
              <Field label="Giới hạn lượt dùng" error={errors.usageLimit}>
                <input
                  className={baseInput}
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={change}
                  onKeyDown={blockNonNumericKey}
                  inputMode="numeric"
                  type="text"
                  min="1"
                  placeholder="Để trống nếu không giới hạn"
                />
              </Field>
              <Field label="Cho phép 1 khách dùng nhiều lần">
                <select
                  className={baseInput}
                  name="allowMultipleUsePerCustomer"
                  value={formData.allowMultipleUsePerCustomer}
                  onChange={change}
                >
                  <option value="true">Có</option>
                  <option value="false">Không (mỗi khách chỉ 1 lần)</option>
                </select>
              </Field>
              <Field label="Thời gian bắt đầu" required error={errors.startAt}>
                <input
                  className={`${baseInput} datetime-control`}
                  name="startAt"
                  value={formData.startAt}
                  onChange={change}
                  required
                  min={isEdit ? undefined : minDateTimeLocal()}
                  type="datetime-local"
                />
              </Field>
              <Field label="Thời gian kết thúc" required error={errors.endAt}>
                <input
                  className={`${baseInput} datetime-control`}
                  name="endAt"
                  value={formData.endAt}
                  onChange={change}
                  required
                  min={formData.startAt || minDateTimeLocal()}
                  type="datetime-local"
                />
              </Field>
              {formData.audience === "WEEKDAY" && (
                <>
                  <Field label="Ngày áp dụng" required error={errors.applicableDayOfWeek}>
                    <select
                      className={baseInput}
                      name="applicableDayOfWeek"
                      value={formData.applicableDayOfWeek}
                      onChange={change}
                      required
                    >
                      <option value="">Chọn ngày</option>
                      {DAYS.map((day, index) => (
                        <option key={day} value={index + 1}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div />
                  <Field label="Áp dụng từ giờ">
                    <input
                      className={`${baseInput} datetime-control`}
                      name="applicableStartTime"
                      value={formData.applicableStartTime}
                      onChange={change}
                      type="time"
                    />
                  </Field>
                  <Field label="Áp dụng đến giờ">
                    <input
                      className={`${baseInput} datetime-control`}
                      name="applicableEndTime"
                      value={formData.applicableEndTime}
                      onChange={change}
                      type="time"
                    />
                  </Field>
                </>
              )}
            </section>
          )}

          <div className="mt-8 flex justify-between border-t border-gray-100 dark:border-gray-800 pt-5">
            <button
              type="button"
              onClick={() =>
                isEdit || step === 1
                  ? navigate("/admin/promotions")
                  : setStep((current) => current - 1)
              }
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} />
              {isEdit || step === 1 ? "Hủy" : "Quay lại"}
            </button>
            {!isEdit && step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C00000] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#a00000] transition-colors"
              >
                Tiếp theo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C00000] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#a00000] transition-colors disabled:opacity-60"
              >
                <Save size={16} />
                {isSubmitting ? "Đang lưu..." : "Lưu khuyến mãi"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default PromotionForm;
