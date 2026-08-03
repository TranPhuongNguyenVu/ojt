// Constants & helpers for Schedule Management module
import { SCHEDULE_LABELS } from "../../../../constants/labels";

export const emptyScheduleForm = {
  movieId: "",
  cinemaRoomId: "",
  startTime: "",
  versionId: "",
};

const SCHEDULE_STATUS_SORT_ORDER = {
  SCHEDULED: 0,
  SOLD_OUT: 1,
  CANCELLED: 2,
  DELETED: 3,
};

/** Default list sort: status priority (scheduled, sold out, cancelled, deleted) then start time. */
export const compareSchedulesByStatusThenStartTime = (a, b) => {
  const orderA = SCHEDULE_STATUS_SORT_ORDER[a.status] ?? 99;
  const orderB = SCHEDULE_STATUS_SORT_ORDER[b.status] ?? 99;
  if (orderA !== orderB) return orderA - orderB;
  return new Date(a.startTime) - new Date(b.startTime);
};

/**
 * Shared color set for Schedule.displayStatus (SCHEDULED/SHOWING/ENDED/CANCELLED/DELETED),
 * reused by the Timeline block fill, the Detail modal badge, and the Table view badge —
 * a single source of truth so the 3 surfaces never drift into different colors.
 */
export const DISPLAY_STATUS_META = {
  SCHEDULED: { labelKey: "statusScheduled", dotVar: "var(--cine-status-scheduled)", badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" },
  SHOWING: { labelKey: "statusShowing", dotVar: "var(--cine-status-showing)", badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
  ENDED: { labelKey: "statusEnded", dotVar: "var(--cine-status-ended)", badgeClass: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" },
  CANCELLED: { labelKey: "statusCancelled", dotVar: "#f59e0b", badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" },
  DELETED: { labelKey: "statusDeleted", dotVar: "#ef4444", badgeClass: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" },
};

/**
 * Generate time slot options (HH:MM strings) from EARLIEST_SCHEDULE_HOUR to
 * LATEST_SCHEDULE_HOUR with stepMinutes interval (default 30).
 */
export const generateTimeSlots = (stepMinutes = 30) => {
  const slots = [];
  const startH = EARLIEST_SCHEDULE_HOUR;
  const endH = LATEST_SCHEDULE_HOUR;
  for (let h = startH; h <= endH; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endH && m > 0) break;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
};

export const fieldInputClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldInputIconClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldSelectClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white";

export const fieldLabelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

/** Translates the backend's English validation reasons into UI Vietnamese; unknown messages pass through. */
export const translateScheduleReason = (msg) => {
  const lower = (msg || "").toLowerCase();
  if (lower.includes("overlapping showtime in another room")) return "Phim này có suất chiếu trùng khung giờ ở phòng khác.";
  if (lower.includes("overlap")) return "Trùng giờ với suất chiếu khác trong cùng phòng (đã tính thời gian nghỉ giữa 2 suất).";
  if (lower.includes("inactive room")) return "Phòng chiếu đã ngưng hoạt động.";
  if (lower.includes("inactive movie")) return "Phim đã ngưng chiếu.";
  if (lower.includes("within movie showing range")) return "Giờ chiếu nằm ngoài khoảng thời gian công chiếu của phim.";
  if (lower.includes("version is not supported")) return "Phiên bản đã chọn không thuộc phim này.";
  if (lower.includes("does not support the chosen format")) return "Phòng không hỗ trợ định dạng đã chọn.";
  if (lower.includes("at least from tomorrow")) return "Giờ chiếu phải từ ngày mai trở đi.";
  if (lower.includes("more than 10 days")) return "Chỉ được tạo lịch trước tối đa 10 ngày.";
  return msg || "Lỗi không xác định.";
};

export const mapScheduleApiError = (error, fallback) => {
  const msg = error?.response?.data?.message || error?.message || "";
  if (msg.toLowerCase().includes("overlap") || msg.toLowerCase().includes("trùng"))
    return "Suất chiếu bị trùng giờ (đã tính cả thời gian nghỉ giữa 2 suất) với suất khác trong cùng phòng.";
  if (msg.toLowerCase().includes("inactive") || msg.toLowerCase().includes("ngưng"))
    return "Phòng chiếu này đã ngưng hoạt động.";
  if (msg.toLowerCase().includes("version") || msg.toLowerCase().includes("supported"))
    return "Định dạng chiếu không hợp lệ với phim đã chọn.";
  return msg || fallback;
};

export const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("vi-VN") + " " + SCHEDULE_LABELS.currencyUnit;
};

/** Checks if a datetime value is on the same calendar day as dateStr (YYYY-MM-DD) */
export const isSameDay = (datetimeValue, dateStr) => {
  if (!datetimeValue || !dateStr) return false;
  const d = new Date(datetimeValue);
  if (isNaN(d.getTime())) return false;
  const pad = (n) => String(n).padStart(2, "0");
  const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dStr === dateStr;
};

/** Returns YYYY-MM-DD string for today */
export const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Min datetime for schedule: tomorrow at 00:00 */
export const minScheduleDateTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`;
};

/** Max scheduling horizon: cannot create a schedule more than 10 days ahead */
export const MAX_SCHEDULE_DAYS_AHEAD = 10;

/** Max datetime for schedule: today + MAX_SCHEDULE_DAYS_AHEAD at 23:59 */
export const maxScheduleDateTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + MAX_SCHEDULE_DAYS_AHEAD);
  d.setHours(23, 59, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Validate that a datetime-local value is no more than MAX_SCHEDULE_DAYS_AHEAD days out */
export const isWithinMaxDaysAhead = (startTimeValue) => {
  if (!startTimeValue) return false;
  const d = new Date(startTimeValue);
  if (isNaN(d.getTime())) return false;
  const max = new Date();
  max.setDate(max.getDate() + MAX_SCHEDULE_DAYS_AHEAD);
  max.setHours(23, 59, 59, 999);
  return d.getTime() <= max.getTime();
};

/** Given a startTime ISO string and duration minutes, compute end time string */
export const computeEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return "";
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
  return end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

/** Earliest and latest allowed start hour for schedules */
export const EARLIEST_SCHEDULE_HOUR = 8;   // 08:00
export const LATEST_SCHEDULE_HOUR = 23;    // 23:00

/** Parses an "HH:MM" string into minutes since midnight. */
export const hhmmToMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * Golden-hour rules (GoldenHourConfig, fetched live from PricingService.getGoldenHours())
 * are the single source of truth for both the main schedule calendar and the
 * auto-generate preview timeline — no hardcoded default band, so both views
 * always reflect whatever is currently configured in Pricing Config.
 */
export const GOLDEN_DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export const ruleMatchesDate = (rule, dateStr) =>
  (rule.daysOfWeek || []).includes(GOLDEN_DAY_NAMES[new Date(`${dateStr}T00:00:00`).getDay()]);

export const ruleStartMinutes = (rule) => hhmmToMinutes((rule.startTime || "").substring(0, 5));
export const ruleEndMinutes = (rule) => hhmmToMinutes((rule.endTime || "").substring(0, 5));

/** The active golden-hour rule (if any) covering dateStr+min, or null. */
export const findGoldenRule = (rules, dateStr, min) =>
  (rules || []).find((r) => ruleMatchesDate(r, dateStr) && min >= ruleStartMinutes(r) && min <= ruleEndMinutes(r)) || null;

/** Validate that a datetime-local value falls within the allowed hours (08:00–23:00) */
export const isWithinAllowedHours = (startTimeValue) => {
  if (!startTimeValue) return false;
  const d = new Date(startTimeValue);
  if (isNaN(d.getTime())) return false;
  const hour = d.getHours() + d.getMinutes() / 60;
  return hour >= EARLIEST_SCHEDULE_HOUR && hour <= LATEST_SCHEDULE_HOUR;
};

/** Whether a cinema room's formats include the given version id */
export const roomAcceptsVersion = (room, versionId) =>
  (room?.formats || []).some((f) => f.versionId === versionId);

/** Short badge label for a room's supported formats, e.g. "2D/3D" or "IMAX" */
export const roomFormatBadge = (room) =>
  (room?.formats || [])
    .map((f) => f.versionName)
    .sort()
    .join("/");

/** Build POST/PUT payload — movieId stays as string (UUID) */
export const buildSchedulePayload = (formData) => ({
  movieId: formData.movieId,
  cinemaRoomId: Number(formData.cinemaRoomId),
  startTime: formData.startTime || null,
  bufferTime: formData.bufferTime ? Number(formData.bufferTime) : 30,
  versionId: formData.versionId ? Number(formData.versionId) : null,
});
