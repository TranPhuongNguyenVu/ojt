import React, { useState } from "react";
import CinemaRoomService from "../../../../services/CinemaRoomService";
import { CINEMA_ROOM_LABELS, COMMON_LABELS } from "../../../../constants/labels";
import { getApiErrorMessage } from "../shared/cinemaRoomFormConstants";

const DeactivateCinemaRoomModal = ({ room, onClose, onSuccess }) => {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await CinemaRoomService.deactivate(room.cinemaRoomId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể ngừng hoạt động phòng chiếu."));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
        <h3 className="font-bold text-lg text-slate-900">{CINEMA_ROOM_LABELS.confirmDeactivateTitle}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {CINEMA_ROOM_LABELS.confirmDeactivateMessage} (<strong>{room.cinemaRoomName}</strong>)
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {COMMON_LABELS.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            {isSubmitting ? COMMON_LABELS.saving : COMMON_LABELS.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateCinemaRoomModal;
