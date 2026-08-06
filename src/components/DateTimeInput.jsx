import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";

const pad2 = (n) => String(n).padStart(2, "0");

const isoToDisplay = (iso) => {
  if (!iso) return "";
  const datePart = iso.split("T")[0];
  if (!datePart) return "";
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

const displayToIso = (display) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!match) return null;
  const [, dStr, mStr, yStr] = match;
  const day = Number(dStr);
  const month = Number(mStr);
  const year = Number(yStr);
  if (month < 1 || month > 12) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${yStr}-${mStr}-${dStr}`;
};

const maskInput = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += "/" + digits.slice(2, 4);
  if (digits.length > 4) out += "/" + digits.slice(4, 8);
  return out;
};

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const DateTimeInput = ({
  name,
  value,
  onChange,
  min,
  max,
  className,
  placeholder = "dd/mm/yyyy",
}) => {
  const [text, setText] = useState(isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const [viewDate, setViewDate] = useState(() => {
    const datePart = value ? value.split("T")[0] : null;
    return datePart ? new Date(`${datePart}T00:00:00`) : new Date();
  });
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);

  const minDate = min ? min.split("T")[0] : null;
  const maxDate = max ? max.split("T")[0] : null;

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const updateMenuRect = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuRect();
    const handleReposition = () => updateMenuRect();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      const insideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const insideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!insideWrapper && !insideMenu) setOpen(false);
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
    if (masked.length === 10) {
      const iso = displayToIso(masked);
      if (iso) emit(iso);
    } else if (masked.length === 0) {
      emit("");
    }
  };

  const handleBlur = () => {
    if (text.length > 0 && text.length < 10) {
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
    emit(dateIso);
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
        maxLength={10}
        className={className}
      />
      {open && menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
            style={{ top: menuRect.top, left: menuRect.left }}
          >
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default DateTimeInput;
