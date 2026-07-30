import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ScheduleService from "../../../../services/ScheduleService";
import ScheduleModalLayout from "../shared/ScheduleModalLayout";
import { getApiErrorMessage, formatDateTime } from "../shared/scheduleFormConstants";

const DeleteScheduleModal = ({ schedule, movieName, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    setErrorMessage("");
    setIsDeleting(true);
    try {
      await ScheduleService.deleteSchedule(schedule.scheduleId);
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể xóa suất chiếu này."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScheduleModalLayout title="Xóa suất chiếu" onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa suất chiếu{" "}
            <span className="font-bold text-gray-900">
              #{schedule.scheduleId}
            </span>
            ?
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-3 text-left w-full space-y-1">
            <p><span className="font-semibold">Phim:</span> {movieName || "—"}</p>
            <p><span className="font-semibold">Giờ bắt đầu:</span> {formatDateTime(schedule.startTime)}</p>
          </div>
          <p className="text-xs text-red-500">Hành động này không thể hoàn tác.</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60"
        >
          {isDeleting ? "Đang xóa..." : "Xóa suất chiếu"}
        </button>
      </div>
    </ScheduleModalLayout>
  );
};

export default DeleteScheduleModal;
