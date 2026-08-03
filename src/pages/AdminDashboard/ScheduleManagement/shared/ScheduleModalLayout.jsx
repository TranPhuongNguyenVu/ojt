import React from "react";
import { X } from "lucide-react";

const ScheduleModalLayout = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full overflow-hidden my-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#C00000] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <h3 className="text-lg font-bold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-red-200 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ScheduleModalLayout;
