import { CINEMA_ROOM_LABELS } from "../../../../constants/labels";

export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 10;

export const ROOM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const buildFormatOptions = (versions) => {
  const twoD = versions.find((v) => v.versionName === "2D");
  const threeD = versions.find((v) => v.versionName === "3D");
  const options = [];

  if (twoD && threeD) {
    options.push({ label: "2D/3D", formatIds: [twoD.versionId, threeD.versionId] });
  }

  versions
    .filter((v) => v.versionName !== "2D" && v.versionName !== "3D")
    .forEach((v) => {
      options.push({ label: v.versionName, formatIds: [v.versionId] });
    });

  return options;
};

export const findSelectedOptionValue = (options, formatIds) => {
  const sorted = [...(formatIds || [])].sort((a, b) => a - b);
  const index = options.findIndex((opt) => {
    const optSorted = [...opt.formatIds].sort((a, b) => a - b);
    return optSorted.length === sorted.length && optSorted.every((id, i) => id === sorted[i]);
  });
  return index === -1 ? "" : String(index);
};

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const formatVndShort = (value) => {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (isNaN(n)) return "";
  const thousands = n / 1000;
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
};

export const getRoomStatusBadge = (status) =>
  status === ROOM_STATUS.INACTIVE
    ? { label: CINEMA_ROOM_LABELS.statusInactive, cls: "bg-red-50 border-red-200 text-red-700" }
    : { label: CINEMA_ROOM_LABELS.statusActive, cls: "bg-green-50 border-green-200 text-green-700" };

export const SEAT_LEGEND_ITEMS = [
  { key: "normal", label: CINEMA_ROOM_LABELS.seatTypeNormal, swatchCls: "bg-slate-100 border border-slate-300" },
  { key: "vip", label: CINEMA_ROOM_LABELS.seatTypeVip, swatchCls: "bg-amber-50 border-2 border-amber-500" },
  { key: "couple", label: CINEMA_ROOM_LABELS.seatTypeCouple, swatchCls: "bg-gradient-to-r from-pink-500 to-rose-500", wide: true },
  { key: "booked", label: "Đã đặt", swatchCls: "bg-slate-500" },
  { key: "inactive", label: CINEMA_ROOM_LABELS.seatStatusInactive, swatchCls: "bg-slate-300 border border-slate-400" },
  { key: "aisle", label: CINEMA_ROOM_LABELS.seatAisle, swatchCls: "border border-dashed border-slate-400 bg-slate-50" },
  { key: "selected", label: CINEMA_ROOM_LABELS.seatSelected, swatchCls: "bg-sky-500 border-2 border-sky-600" },
];
