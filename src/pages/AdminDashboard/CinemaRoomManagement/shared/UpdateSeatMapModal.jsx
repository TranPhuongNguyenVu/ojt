import React, { useMemo, useState } from "react";
import ModalShell from "../../../../components/ModalShell";
import CinemaRoomService from "../../../../services/CinemaRoomService";
import { CINEMA_ROOM_LABELS, COMMON_LABELS } from "../../../../constants/labels";
import NumberStepper from "./NumberStepper";
import { MAX_GRID_SIZE, getApiErrorMessage } from "./cinemaRoomFormConstants";
import { SEAT_STATUS } from "../../../../utils/seatUtils";

const getColumnIndex = (column) => {
  if (!column) return 0;
  const num = parseInt(column, 10);
  return isNaN(num) ? 0 : num - 1;
};

const UpdateSeatMapModal = ({ room, onClose, onSuccess }) => {
  const seats = useMemo(() => room.seats || [], [room.seats]);

  const currentRows = seats.length > 0 ? Math.max(...seats.map((s) => s.seatRow)) : 10;
  const currentColumns =
    seats.length > 0 ? Math.max(...seats.map((s) => getColumnIndex(s.seatColumn) + 1)) : 10;

  const [form, setForm] = useState({ rows: currentRows, columns: currentColumns });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customizedSeatCount = useMemo(
    () => seats.filter((s) => s.seatType !== 0 || s.status !== SEAT_STATUS.ACTIVE).length,
    [seats]
  );

  const couplePairCount = useMemo(
    () => seats.filter((s) => s.seatType === 2 && s.pairSeatId).length / 2,
    [seats]
  );

  const isDestructive = customizedSeatCount > 0 || couplePairCount > 0;
  const canSubmit = !isSubmitting && (!isDestructive || isConfirmed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { rows, columns } = form;
    if (!rows || rows <= 0 || !columns || columns <= 0) {
      setError("Số hàng và số cột phải lớn hơn 0.");
      return;
    }
    if (rows > MAX_GRID_SIZE || columns > MAX_GRID_SIZE) {
      setError(CINEMA_ROOM_LABELS.maxGridError);
      return;
    }
    if (isDestructive && !isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      await CinemaRoomService.recreateSeats(room.cinemaRoomId, { rows, columns });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể cập nhật sơ đồ ghế."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title={CINEMA_ROOM_LABELS.updateSeatMapModalTitle} onClose={onClose} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-bold">
            ⚠ {CINEMA_ROOM_LABELS.recreateWarning}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberStepper
              label={CINEMA_ROOM_LABELS.fieldRows}
              value={form.rows}
              onChange={(value) => setForm((prev) => ({ ...prev, rows: value }))}
              disabled={isSubmitting}
              required
            />
            <NumberStepper
              label={CINEMA_ROOM_LABELS.fieldColumns}
              value={form.columns}
              onChange={(value) => setForm((prev) => ({ ...prev, columns: value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">{CINEMA_ROOM_LABELS.fieldTotalCapacity}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {(form.rows || 0) * (form.columns || 0)} {CINEMA_ROOM_LABELS.seatsSuffix}
            </span>
          </div>

          {isDestructive && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 space-y-2">
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                {CINEMA_ROOM_LABELS.resizeDestructiveWarning(customizedSeatCount, couplePairCount)}
              </p>
              <label className="flex items-start gap-2 text-xs font-bold text-red-800 dark:text-red-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 accent-[#C00000] cursor-pointer"
                />
                {CINEMA_ROOM_LABELS.resizeConfirmCheckbox}
              </label>
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
          >
            {COMMON_LABELS.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang tạo lại..." : "Tạo lại sơ đồ ghế"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default UpdateSeatMapModal;
