import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

const pad2 = (n) => String(n).padStart(2, "0");

const isoToDisplay = (iso) => {
  if (!iso) return "";
  const [datePart, timePart] = iso.split("T");
  if (!datePart) return "";
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y} ${timePart || "00:00"}`;
};

const displayToIso = (display) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(display);
  if (!match) return null;
  const [, dStr, mStr, yStr, hhStr, mmStr] = match;
  const day = Number(dStr);
  const month = Number(mStr);
  const year = Number(yStr);
  const hour = Number(hhStr);
  const minute = Number(mmStr);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${yStr}-${mStr}-${dStr}T${hhStr}:${mmStr}`;
};

const maskInput = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += "/" + digits.slice(2, 4);
  if (digits.length > 4) out += "/" + digits.slice(4, 8);
  if (digits.length > 8) out += " " + digits.slice(8, 10);
  if (digits.length > 10) out += ":" + digits.slice(10, 12);
  return out;
};

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const DateTimeInput = ({ name, value, onChange, min, max, className, placeholder = "dd/mm/yyyy hh:mm" }) => {
  const [text, setText] = useState(isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const datePart = value ? value.split("T")[0] : null;
    return datePart ? new Date(`${datePart}T00:00:00`) : new Date();
  });
  const wrapperRef = useRef(null);

  const minDate = min ? min.split("T")[0] : null;
  const maxDate = max ? max.split("T")[0] : null;

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const emit = (iso) => {
    onChange({ target: { name, value: iso } });
  };

  const handleTextChange = (e) => {
    const masked = maskInput(e.target.value);
    setText(masked);
    if (masked.length === 16) {
      const iso = displayToIso(masked);
      if (iso) emit(iso);
    } else if (masked.length === 0) {
      emit("");
    }
  };

  const handleBlur = () => {
    if (text.length > 0 && text.length < 16) {
      setText(isoToDisplay(value));
    }
  };

  const toggleCalendar = () => {
    const datePart = value ? value.split("T")[0] : null;
    setViewDate(datePart ? new Date(`${datePart}T00:00:00`) : new Date());
    setOpen((prev) => !prev);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const currentDatePart = value ? value.split("T")[0] : null;

  const pickDay = (day) => {
    const dateIso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    if (minDate && dateIso < minDate) return;
    if (maxDate && dateIso > maxDate) return;
    const existingTime = value ? value.split("T")[1] : null;
    emit(`${dateIso}T${existingTime || "08:00"}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleCalendar}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        <Calendar size={15} />
      </button>
      <input
        type="text"
        name={name}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        maxLength={16}
        className={className}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              ‹
            </button>
            <span className="text-sm font-semibold capitalize text-gray-700">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const iso = `${year}-${pad2(month + 1)}-${pad2(day)}`;
              const isSelected = iso === currentDatePart;
              const isDisabled = (minDate && iso < minDate) || (maxDate && iso > maxDate);
              return (
                <button
                  type="button"
                  key={day}
                  disabled={isDisabled}
                  onClick={() => pickDay(day)}
                  className={`text-xs rounded-full w-7 h-7 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#C00000] text-white"
                      : isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Chỉnh giờ trực tiếp trong ô nhập (hh:mm).</p>
        </div>
      )}
    </div>
  );
};

export default DateTimeInput;
