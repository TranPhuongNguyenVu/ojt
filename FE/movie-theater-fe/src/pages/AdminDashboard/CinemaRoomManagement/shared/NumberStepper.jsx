import React from "react";
import { Minus, Plus } from "lucide-react";
import { COMMON_LABELS } from "../../../../constants/labels";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "./cinemaRoomFormConstants";

const clamp = (value) => Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, value));

const NumberStepper = ({ label, value, onChange, disabled = false, required = false }) => {
  const numericValue = value === "" ? "" : Number(value);
  const canDecrease = !disabled && numericValue !== "" && numericValue > MIN_GRID_SIZE;
  const canIncrease = !disabled && (numericValue === "" || numericValue < MAX_GRID_SIZE);

  const handleTextChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (digitsOnly === "") {
      onChange("");
      return;
    }
    onChange(clamp(parseInt(digitsOnly, 10)));
  };

  const step = (delta) => {
    const base = numericValue === "" ? MIN_GRID_SIZE : numericValue;
    onChange(clamp(base + delta));
  };

  const buttonCls =
    "flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer";

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label} {required && <span className="text-red-600">{COMMON_LABELS.requiredMark}</span>}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canDecrease}
          aria-label={`${label} -1`}
          className={buttonCls}
        >
          <Minus size={16} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          disabled={disabled}
          value={value}
          onChange={handleTextChange}
          className="w-full bg-slate-100 border-none rounded-lg px-3 py-2.5 text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canIncrease}
          aria-label={`${label} +1`}
          className={buttonCls}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default NumberStepper;
