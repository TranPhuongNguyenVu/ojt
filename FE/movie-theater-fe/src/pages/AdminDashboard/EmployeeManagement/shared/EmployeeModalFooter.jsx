import React from "react";

const EmployeeModalFooter = ({
  onCancel,
  submitLabel,
  isSubmitting = false,
  disabled = false,
}) => (
  <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
    <button
      type="button"
      onClick={onCancel}
      disabled={isSubmitting}
      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
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
);

export default EmployeeModalFooter;
