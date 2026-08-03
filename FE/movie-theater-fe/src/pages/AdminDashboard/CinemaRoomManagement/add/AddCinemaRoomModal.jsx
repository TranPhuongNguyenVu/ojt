import React, { useState, useMemo } from "react";
import ModalShell from "../../../../components/ModalShell";
import CinemaRoomService from "../../../../services/CinemaRoomService";
import { CINEMA_ROOM_LABELS, COMMON_LABELS } from "../../../../constants/labels";
import NumberStepper from "../shared/NumberStepper";
import {
  MAX_GRID_SIZE,
  buildFormatOptions,
  findSelectedOptionValue,
  getApiErrorMessage,
} from "../shared/cinemaRoomFormConstants";

const getColumnLetter = (index) => String(index + 1);

const RequiredMark = () => <span className="text-red-600">{COMMON_LABELS.requiredMark}</span>;

const AddCinemaRoomModal = ({ onClose, onSuccess, versions }) => {
  const [form, setForm] = useState({
    cinemaRoomName: "",
    rows: 10,
    columns: 10,
    formatIds: [],
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatOptions = useMemo(() => buildFormatOptions(versions), [versions]);

  const hasFormat = form.formatIds.length > 0;
  const canSubmit = !isSubmitting && hasFormat;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { cinemaRoomName, rows, columns, formatIds } = form;

    if (!cinemaRoomName.trim()) {
      setError("Vui lòng nhập tên phòng chiếu.");
      return;
    }
    if (!rows || rows <= 0 || !columns || columns <= 0) {
      setError("Số hàng và số cột phải lớn hơn 0.");
      return;
    }
    if (rows > MAX_GRID_SIZE || columns > MAX_GRID_SIZE) {
      setError(CINEMA_ROOM_LABELS.maxGridError);
      return;
    }
    if (!hasFormat) {
      setError(CINEMA_ROOM_LABELS.formatRequiredError);
      return;
    }

    setIsSubmitting(true);

    const generatedSeats = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= columns; c++) {
        generatedSeats.push({
          seatRow: r,
          seatColumn: getColumnLetter(c - 1),
          seatType: 0,
        });
      }
    }

    const payload = {
      cinemaRoomName: cinemaRoomName.trim(),
      columns,
      rows,
      seats: generatedSeats,
      formatIds,
    };

    try {
      await CinemaRoomService.create(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tạo phòng chiếu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title={CINEMA_ROOM_LABELS.createModalTitle} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">
              {CINEMA_ROOM_LABELS.fieldRoomName} <RequiredMark />
            </label>
            <input
              type="text"
              required
              value={form.cinemaRoomName}
              onChange={(e) => setForm({ ...form, cinemaRoomName: e.target.value })}
              placeholder={CINEMA_ROOM_LABELS.roomNamePlaceholder}
              className="w-full bg-slate-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-gray-600"
            />
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">
              {CINEMA_ROOM_LABELS.fieldFormats} <RequiredMark />
            </label>
            <select
              value={findSelectedOptionValue(formatOptions, form.formatIds)}
              onChange={(e) => {
                if (e.target.value === "") {
                  setForm((prev) => ({ ...prev, formatIds: [] }));
                  return;
                }
                const selected = formatOptions[Number(e.target.value)];
                setForm((prev) => ({ ...prev, formatIds: selected.formatIds }));
              }}
              className="w-full bg-slate-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-gray-600"
            >
              <option value="">Chưa chọn định dạng</option>
              {formatOptions.map((opt, idx) => (
                <option key={idx} value={idx}>{opt.label}</option>
              ))}
            </select>
            {!hasFormat && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400">{CINEMA_ROOM_LABELS.formatRequiredError}</p>
            )}
          </div>

          <p className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 px-4 py-2.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
            {CINEMA_ROOM_LABELS.createInactiveHint}
          </p>
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
            className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? COMMON_LABELS.saving : CINEMA_ROOM_LABELS.submitCreate}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default AddCinemaRoomModal;
