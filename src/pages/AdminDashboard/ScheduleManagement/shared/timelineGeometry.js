// Shared time-axis and block-geometry math for the two independent timeline
// renderers (ScheduleManagement's calendar and AutoGenerateSchedulePage's
// preview). Both used to compute minutes-from-axis-start by re-parsing only
// the hour/minute of an ISO string, which silently discarded the calendar
// date — any schedule crossing midnight produced an end offset smaller than
// its start offset, collapsed into a negative-width block that got clamped
// to a misleadingly-placed 48px box. Fixing the root cause here once means
// both renderers inherit the fix instead of one getting patched and the
// other left with the same bug.

/**
 * Minutes elapsed between `referenceDate` and `datetimeStr`, as a true
 * millisecond difference — not a same-day hour/minute subtraction. This is
 * what makes midnight-crossing schedules resolve to a positive, correctly
 * ordered offset instead of wrapping negative.
 */
export const minutesFromReference = (datetimeStr, referenceDate) => {
  if (!datetimeStr || !referenceDate) return null;
  const d = new Date(datetimeStr);
  if (isNaN(d.getTime())) return null;
  return (d.getTime() - referenceDate.getTime()) / 60000;
};

/**
 * Extends a base axis length (minutes) to cover the furthest data point,
 * rounded up to the next full hour so the last gridline lands cleanly.
 * Never shrinks below `baseMinutes` — the axis always shows at least the
 * normal operating window even on a day with no late-running shows.
 */
export const extendAxisMinutes = (baseMinutes, dataEndMinutesList) => {
  const maxDataEnd = (dataEndMinutesList || [])
    .filter((m) => m != null && Number.isFinite(m))
    .reduce((max, m) => Math.max(max, m), 0);
  const target = Math.max(baseMinutes, maxDataEnd);
  return Math.ceil(target / 60) * 60;
};

/**
 * Hour gridline marks for an axis that starts at `startOffsetMin` minutes
 * past midnight and spans `totalMinutes`. Labels wrap the hour-of-day past
 * 24:00 (00:00, 01:00, ...) instead of showing "24:00", "25:00". Each mark
 * also carries `isMidnight` so callers can draw a distinct divider where the
 * calendar day actually rolls over.
 */
export const buildHourMarks = (startOffsetMin, totalMinutes, pxPerMin) => {
  const count = Math.floor(totalMinutes / 60) + 1;
  return Array.from({ length: count }, (_, i) => {
    const absoluteMin = startOffsetMin + i * 60;
    const hourOfDay = Math.floor(absoluteMin / 60) % 24;
    return {
      label: `${String(hourOfDay).padStart(2, "0")}:00`,
      left: i * 60 * pxPerMin,
      isMidnight: absoluteMin % 1440 === 0 && absoluteMin !== startOffsetMin,
    };
  });
};

/**
 * Pixel geometry for one block. `startMin`/`endMin` are minutes-from-axis-
 * start (already date-aware, via minutesFromReference). Width is never
 * silently clamped to hide an invalid (non-positive) span — callers must
 * check `isInvalid` and render an explicit error state instead of a
 * misleadingly-placed minimum-width box.
 */
export const computeBlockGeometry = (startMin, endMin, totalMinutes, pxPerMin, minWidthPx = 20) => {
  if (startMin == null) return null;
  const resolvedEnd = endMin != null ? endMin : startMin + 30;
  const clampedStart = Math.max(0, startMin);
  const clampedEnd = Math.min(resolvedEnd, totalMinutes);
  const spanMin = clampedEnd - clampedStart;
  const isInvalid = spanMin <= 0;
  const widthMin = isInvalid ? 15 : spanMin;
  return {
    left: clampedStart * pxPerMin + 2,
    width: Math.max(minWidthPx, widthMin * pxPerMin - 4),
    isInvalid,
  };
};

/**
 * Which ids in `items` ([{ id, startMin, endMin }]) overlap at least one
 * other item's [start, end) range. Pure interval-intersection check — no
 * lane layout, just enough to flag the blocks that need a visible warning
 * instead of silently stacking under `hover:z-20`.
 */
export const computeOverlapIds = (items) => {
  const overlapping = new Set();
  const list = (items || []).filter((it) => it.startMin != null && it.endMin != null);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (a.startMin < b.endMin && b.startMin < a.endMin) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  return overlapping;
};
