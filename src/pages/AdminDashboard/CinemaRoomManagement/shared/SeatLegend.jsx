import React from "react";
import { SEAT_LEGEND_ITEMS } from "./cinemaRoomFormConstants";

const SeatLegend = ({ extra, excludeKeys = [], compact = false }) => (
  <div className={`flex flex-wrap items-center justify-center text-xs font-bold text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-gray-800 ${compact ? "gap-4 pt-3" : "gap-6 pt-6"}`}>
    {SEAT_LEGEND_ITEMS.filter((item) => !excludeKeys.includes(item.key)).map((item) => (
      <div key={item.key} className="flex items-center gap-2">
        <div className={`${item.wide ? "w-8" : "w-4"} h-4 rounded ${item.swatchCls}`}></div>
        <span>{item.label}{item.key === "selected" && extra ? ` (${extra})` : ""}</span>
      </div>
    ))}
  </div>
);

export default SeatLegend;
