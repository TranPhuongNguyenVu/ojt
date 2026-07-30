import React, { useState } from "react";
import ScheduleService from "../../../../services/ScheduleService";
import ModalShell from "../../../../components/ModalShell";
import ScheduleModalFooter from "../shared/ScheduleModalFooter";
import ScheduleFormFields from "../shared/ScheduleFormFields";
import {
  emptyScheduleForm,
  buildSchedulePayload,
  mapScheduleApiError,
} from "../shared/scheduleFormConstants";
import { validateScheduleForm } from "../shared/scheduleValidation";

const AddScheduleModal = ({
  onClose,
  onSuccess,
  movies,
  rooms,
  prefillRoomId,
  prefillStartTime,
}) => {
  const [formData, setFormData] = useState({
    ...emptyScheduleForm,
    cinemaRoomId: prefillRoomId ? String(prefillRoomId) : "",
    startTime: prefillStartTime || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Reset versionId when movie changes to avoid sending stale version
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
      await ScheduleService.createSchedule(buildSchedulePayload(formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(mapScheduleApiError(error, "Không thể tạo suất chiếu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Thêm suất chiếu mới" onClose={onClose} maxWidth="max-w-2xl">
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
          submitLabel="Thêm suất chiếu"
          isSubmitting={isSubmitting}
        />
      </form>
    </ModalShell>
  );
};

export default AddScheduleModal;
