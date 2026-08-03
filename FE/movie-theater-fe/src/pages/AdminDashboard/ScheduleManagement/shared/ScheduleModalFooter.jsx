import React from "react";

const ScheduleModalFooter = ({
  onCancel,
  submitLabel,
  isSubmitting = false,
  disabled = false,
  extraLeft = null,
}) => (
  <div className={`bg-gray-50 dark:bg-white/5 px-6 py-4 flex items-center gap-3 border-t border-gray-100 dark:border-white/10 shrink-0 ${extraLeft ? "justify-between" : "justify-end"}`}>
    {extraLeft}
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 bg-white dark:bg-[#10131A]/90 border border-gray-300 dark:border-white/15 text-[#374151] dark:text-white/75 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/8 transition-colors shadow-sm disabled:opacity-60"
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm disabled:opacity-60"
      >
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </div>
  </div>
);

export default ScheduleModalFooter;
