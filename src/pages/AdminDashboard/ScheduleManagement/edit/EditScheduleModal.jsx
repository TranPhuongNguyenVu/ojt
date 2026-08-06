import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import ScheduleService from "../../../../services/ScheduleService";
import ModalShell from "../../../../components/ModalShell";
import ScheduleModalFooter from "../shared/ScheduleModalFooter";
import ScheduleFormFields from "../shared/ScheduleFormFields";
import DeleteScheduleModal from "../delete/DeleteScheduleModal";
import { SCHEDULE_LABELS } from "../../../../constants/labels";
import {
  buildSchedulePayload,
  mapScheduleApiError,
} from "../shared/scheduleFormConstants";
import { validateScheduleForm } from "../shared/scheduleValidation";

const toDatetimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditScheduleModal = ({ schedule, onClose, onSuccess, movies, rooms }) => {
  const [formData, setFormData] = useState({
    movieId: String(schedule.movieId || ""),
    cinemaRoomId: String(schedule.cinemaRoomId || ""),
    startTime: toDatetimeLocal(schedule.startTime),
    bufferTime: schedule.bufferTime ?? 30,
    versionId: schedule.versionId ? String(schedule.versionId) : "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Reset versionId when movie changes to avoid invalid version-movie combos
      if (name === "movieId") next.versionId = "";
      return next;
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateScheduleForm(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await ScheduleService.updateSchedule(schedule.scheduleId, buildSchedulePayload(formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(mapScheduleApiError(error, "Không thể cập nhật suất chiếu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const movieName = movies.find((m) => String(m.movieId) === String(schedule.movieId))?.movieNameVn;

  return (
    <ModalShell title={`Sửa suất chiếu #${schedule.scheduleId}`} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <ScheduleFormFields
            formData={formData}
            onChange={handleChange}
            movies={movies}
            rooms={rooms}
            roomLocked
          />
        </div>
        <ScheduleModalFooter
          onCancel={onClose}
          submitLabel="Lưu thay đổi"
          isSubmitting={isSubmitting}
          extraLeft={
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#10131A]/90 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shadow-sm disabled:opacity-60"
            >
              <Trash2 size={15} />
              {SCHEDULE_LABELS.editDeleteButton}
            </button>
          }
        />
      </form>

      {isDeleteOpen && (
        <DeleteScheduleModal
          schedule={schedule}
          movieName={movieName}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      )}
    </ModalShell>
  );
};

export default EditScheduleModal;
