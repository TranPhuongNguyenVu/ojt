// Constants & helper utilities for the Movie Management module
import { MOVIE_LABELS } from "../../../../constants/labels";

export const emptyMovieForm = {
  movieNameEnglish: "",
  movieNameVn: "",
  director: "",
  actor: "",
  movieProductionCompany: "",
  duration: "",
  trailer: "",
  fromDate: "",
  toDate: "",
  content: "",
  largeImage: "",
  smallImage: "",
  typeIds: [],
  versionIds: [],
};

export const fieldInputClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldInputIconClass =
  "block w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldSelectClass =
  "block w-full rounded-lg border border-gray-200 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white";

export const fieldTextareaClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm resize-none";

export const fieldLabelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getStatusBadge = (status) => {
  if (status === "INACTIVE") return { label: MOVIE_LABELS.statusInactive, cls: "bg-gray-100 text-gray-500" };
  if (status === "UPCOMING") return { label: MOVIE_LABELS.statusUpcoming, cls: "bg-blue-100 text-blue-700" };
  if (status === "SHOWING") return { label: MOVIE_LABELS.statusShowing, cls: "bg-green-100 text-green-700" };
  if (status === "DELETED") return { label: MOVIE_LABELS.statusDeleted, cls: "bg-red-100 text-red-500" };
  return { label: MOVIE_LABELS.statusEnded, cls: "bg-amber-100 text-amber-700" };
};

const STATUS_SORT_ORDER = {
  UPCOMING: 0,
  SHOWING: 1,
  INACTIVE: 2,
  ENDED: 3,
  DELETED: 4,
};

/** Default list sort: status priority (upcoming, showing, inactive, ended, deleted) then movie name. */
export const compareMoviesByStatusThenName = (a, b) => {
  const orderA = STATUS_SORT_ORDER[a.status] ?? 99;
  const orderB = STATUS_SORT_ORDER[b.status] ?? 99;
  if (orderA !== orderB) return orderA - orderB;
  return (a.movieNameVn || "").localeCompare(b.movieNameVn || "", "vi");
};

/** Build payload for POST/PUT /api/movies */
export const buildMoviePayload = (formData) => ({
  movieNameEnglish: formData.movieNameEnglish?.trim() || null,
  movieNameVn: formData.movieNameVn?.trim() || null,
  director: formData.director?.trim() || null,
  actor: formData.actor?.trim() || null,
  movieProductionCompany: formData.movieProductionCompany?.trim() || null,
  duration: formData.duration ? Number(formData.duration) : null,
  trailer: formData.trailer?.trim() || null,
  fromDate: formData.fromDate || null,
  toDate: formData.toDate || null,
  content: formData.content?.trim() || null,
  largeImage: formData.largeImage?.trim() || null,
  smallImage: formData.smallImage?.trim() || null,
  typeIds: formData.typeIds || [],
  versionIds: formData.versionIds || [],
});

/** Specific error messages for known BE error patterns */
export const mapMovieApiError = (error, fallback) => {
  const msg = error?.response?.data?.message || error?.message || "";
  if (msg.toLowerCase().includes("schedule") || msg.toLowerCase().includes("suất chiếu")) {
    return "Không thể thực hiện thao tác vì phim đang có suất chiếu liên quan.";
  }
  return msg || fallback;
};
