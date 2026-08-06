import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * Apple-style menu picker (custom, not native <select>).
 * Frosted panel, soft shadow, checkmark selection, click-outside / Escape.
 * The option list is portaled to <body> and positioned with `fixed` coordinates
 * so it always floats above everything — same as a native <select> popup —
 * instead of being clipped by a scrollable ancestor (e.g. a modal body).
 */
const AppleSelect = ({
  value = "",
  onChange,
  options = [],
  placeholder = "Chọn…",
  icon: Icon,
  disabled = false,
  className = "",
  size = "default",
}) => {
  const isCompact = size === "compact";
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const selected = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value]
  );

  const updateMenuRect = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
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

    const onPointerDown = (event) => {
      const insideButton = rootRef.current && rootRef.current.contains(event.target);
      const insideMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!insideButton && !insideMenu) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const list = listRef.current;
    const active = list.querySelector('[aria-selected="true"]');
    if (!active) return;
    // Scroll only the list itself — scrollIntoView() would walk up the ancestor
    // chain and can drag a scrollable ancestor (e.g. modal body) along with it.
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    if (activeRect.top < listRect.top) {
      list.scrollTop -= listRect.top - activeRect.top;
    } else if (activeRect.bottom > listRect.bottom) {
      list.scrollTop += activeRect.bottom - listRect.bottom;
    }
  }, [open, value]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`group flex w-full items-center text-left transition-all duration-200 outline-none
          ${isCompact ? "gap-2 rounded-lg px-3 py-2" : "gap-3 rounded-[14px] px-3.5 py-3"}
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${
            isCompact
              ? open
                ? "border border-red-500 bg-white dark:bg-gray-800/60 shadow-[0_0_0_2px_rgba(239,68,68,0.35)]"
                : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600"
              : open
              ? "border border-black/10 dark:border-white/20 bg-white dark:bg-white/10 shadow-[0_0_0_3px_rgba(0,122,255,0.18)]"
              : "border border-black/[0.08] dark:border-white/10 bg-[#F2F2F7]/90 dark:bg-white/[0.07] hover:bg-[#EBEBF0] dark:hover:bg-white/[0.11] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] dark:shadow-none"
          }
        `}
      >
        {Icon && (
          isCompact ? (
            <Icon size={15} strokeWidth={2} className="shrink-0 text-gray-400 dark:text-gray-500" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white dark:bg-white/10 text-[#E50914] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/10">
              <Icon size={15} strokeWidth={2.2} />
            </span>
          )
        )}

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-semibold tracking-[-0.01em] ${isCompact ? "text-sm" : "text-[15px]"} ${
              isCompact
                ? selected
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
                : selected
                ? "text-[#1C1C1E] dark:text-white"
                : "text-[#8E8E93] dark:text-white/40"
            }`}
          >
            {selected?.label || placeholder}
          </span>
          {selected?.secondary ? (
            <span className="mt-0.5 block truncate text-[12px] font-medium text-[#8E8E93] dark:text-white/40">
              {selected.secondary}
            </span>
          ) : null}
        </span>

        <ChevronDown
          size={16}
          strokeWidth={2.4}
          className={`shrink-0 transition-transform duration-200 ${isCompact ? "text-gray-400 dark:text-gray-500" : "text-[#8E8E93] dark:text-white/45"} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] origin-top animate-[appleMenuIn_160ms_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            role="presentation"
          >
            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              aria-label={placeholder}
              className="max-h-72 overflow-y-auto overscroll-contain no-scrollbar rounded-[14px] border border-black/[0.06] dark:border-white/12
                bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-2xl backdrop-saturate-150
                p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]
                dark:shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
            >
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <li key={String(opt.value)} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150
                        ${
                          isSelected
                            ? "bg-[#007AFF]/12 dark:bg-[#0A84FF]/22"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                        }
                      `}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold tracking-[-0.01em] text-[#1C1C1E] dark:text-white">
                          {opt.label}
                        </span>
                        {opt.secondary ? (
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-[#8E8E93] dark:text-white/40">
                            {opt.secondary}
                          </span>
                        ) : null}
                      </span>
                      <Check
                        size={16}
                        strokeWidth={2.6}
                        className={`shrink-0 transition-opacity ${
                          isSelected
                            ? "opacity-100 text-[#007AFF] dark:text-[#0A84FF]"
                            : "opacity-0"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AppleSelect;
