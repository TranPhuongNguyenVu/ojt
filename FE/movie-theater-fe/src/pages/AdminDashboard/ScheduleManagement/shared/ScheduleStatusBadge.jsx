import React from "react";
import { SCHEDULE_LABELS } from "../../../../constants/labels";
import { DISPLAY_STATUS_META } from "./scheduleFormConstants";

const ScheduleStatusBadge = ({ displayStatus, className = "" }) => {
  const meta = DISPLAY_STATUS_META[displayStatus];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold rounded ${meta.badgeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.dotVar }} />
      {SCHEDULE_LABELS[meta.labelKey]}
    </span>
  );
};

export default ScheduleStatusBadge;
