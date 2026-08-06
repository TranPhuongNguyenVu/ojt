import React from "react";
import {
  Edit,
  Tag,
  Calendar,
  Percent,
  Hash,
  Clock,
  Link as LinkIcon,
  Gift,
  Users,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import ModalShell from "../../../../components/ModalShell";

const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

const STATUS_BADGE = {
  ACTIVE: { label: "Đang hoạt động", cls: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" },
  INACTIVE: { label: "Tạm ngừng", cls: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400" },
  DELETED: { label: "Đã xóa", cls: "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200" },
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDiscount = (type, level) => {
  if (level == null) return "—";
  return type === "PERCENT"
    ? `${level}%`
    : `${Number(level).toLocaleString("vi-VN")}đ`;
};

const formatTime = (value) => {
  if (!value) return null;
  return String(value).slice(0, 5);
};

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon size={15} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="text-sm text-gray-800 dark:text-gray-200 break-words">
        {children ?? "—"}
      </div>
    </div>
  </div>
);

const resolveAudience = (promo) => {
  if (promo.birthdayOnly) return "Khách hàng sinh nhật";
  if (promo.applicableDayOfWeek) return "Theo ngày trong tuần";
  return "Tất cả khách hàng";
};

const PromotionDetailModal = ({ promotion, onClose, onEdit }) => {
  const statusBadge = STATUS_BADGE[promotion.status] || STATUS_BADGE.INACTIVE;
  const dayLabel =
    promotion.applicableDayOfWeek != null
      ? DAYS[promotion.applicableDayOfWeek - 1] || `Thứ ${promotion.applicableDayOfWeek}`
      : null;
  const timeRange =
    promotion.applicableStartTime || promotion.applicableEndTime
      ? `${formatTime(promotion.applicableStartTime) || "—"} → ${formatTime(promotion.applicableEndTime) || "—"}`
      : null;

  return (
    <ModalShell title={promotion.title} onClose={onClose}>
      <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
            {promotion.image ? (
              <img
                src={promotion.image}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <Tag size={32} />
              </div>
            )}
          </div>
          <span
            className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Tag} label="Tiêu đề">{promotion.title}</InfoRow>
            <InfoRow icon={Users} label="Đối tượng">{resolveAudience(promotion)}</InfoRow>
            <InfoRow icon={Percent} label="Loại giảm giá">
              {promotion.discountType === "PERCENT" ? "Phần trăm (%)" : "Số tiền cố định (VND)"}
            </InfoRow>
            <InfoRow icon={Gift} label="Mức giảm">
              {formatDiscount(promotion.discountType, promotion.discountLevel ?? promotion.promotionValue)}
            </InfoRow>
            <InfoRow icon={Calendar} label="Thời gian bắt đầu">
              {formatDateTime(promotion.startTime)}
            </InfoRow>
            <InfoRow icon={Calendar} label="Thời gian kết thúc">
              {formatDateTime(promotion.endTime)}
            </InfoRow>
            <InfoRow icon={Hash} label="Lượt dùng">
              {promotion.usedCount ?? 0} / {promotion.usageLimit ?? "Không giới hạn"}
            </InfoRow>
            <InfoRow icon={Users} label="Dùng nhiều lần / khách">
              {promotion.allowMultipleUsePerCustomer === false ? "Không (mỗi khách 1 lần)" : "Có"}
            </InfoRow>
            {dayLabel && (
              <InfoRow icon={Calendar} label="Ngày áp dụng">{dayLabel}</InfoRow>
            )}
            {timeRange && (
              <InfoRow icon={Clock} label="Khung giờ áp dụng">{timeRange}</InfoRow>
            )}
          </div>

          {promotion.content && (
            <InfoRow icon={FileText} label="Nội dung khuyến mãi">
              {promotion.content}
            </InfoRow>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Mô tả chi tiết
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {promotion.detail || "—"}
            </p>
          </div>

          {promotion.bookingUrl && (
            <InfoRow icon={LinkIcon} label="URL đặt vé">
              <a
                href={promotion.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C00000] hover:underline break-all"
              >
                {promotion.bookingUrl}
              </a>
            </InfoRow>
          )}

          {promotion.image && (
            <InfoRow icon={ImageIcon} label="URL hình ảnh">
              <a
                href={promotion.image}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C00000] hover:underline break-all"
              >
                {promotion.image}
              </a>
            </InfoRow>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Đóng
        </button>
        {promotion.status !== "DELETED" && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={15} />
            Chỉnh sửa
          </button>
        )}
      </div>
    </ModalShell>
  );
};

export default PromotionDetailModal;
