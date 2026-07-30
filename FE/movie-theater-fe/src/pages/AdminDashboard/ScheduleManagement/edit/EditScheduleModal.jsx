import React, { useState } from "react";
import ScheduleService from "../../../../services/ScheduleService";
import ModalShell from "../../../../components/ModalShell";
import ScheduleModalFooter from "../shared/ScheduleModalFooter";
import ScheduleFormFields from "../shared/ScheduleFormFields";
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
          />
        </div>
        <ScheduleModalFooter
          onCancel={onClose}
          submitLabel="Lưu thay đổi"
          isSubmitting={isSubmitting}
        />
      </form>
    </ModalShell>
  );
};

export default EditScheduleModal;
