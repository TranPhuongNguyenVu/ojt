import React from "react";
import { SEAT_LEGEND_ITEMS } from "./cinemaRoomFormConstants";

const SeatLegend = ({ extra }) => (
  <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500 border-t border-slate-200 pt-6">
    {SEAT_LEGEND_ITEMS.map((item) => (
      <div key={item.key} className="flex items-center gap-2">
        <div className={`${item.wide ? "w-8" : "w-4"} h-4 rounded ${item.swatchCls}`}></div>
        <span>{item.label}{item.key === "selected" && extra ? ` (${extra})` : ""}</span>
      </div>
    ))}
  </div>
);

export default SeatLegend;
