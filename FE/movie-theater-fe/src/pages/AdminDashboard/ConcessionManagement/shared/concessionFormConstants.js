import { CONCESSION_LABELS } from "../../../../constants/labels";
import ConcessionService from "../../../../services/ConcessionService";

export const PAGE_SIZE = 10;

export const SIZE_OPTIONS = [
  { value: "NONE", label: CONCESSION_LABELS.sizeNone },
  { value: "S", label: CONCESSION_LABELS.sizeS },
  { value: "M", label: CONCESSION_LABELS.sizeM },
  { value: "L", label: CONCESSION_LABELS.sizeL },
];

export const ITEM_TYPE_META = {
  food: { nameKey: "foodName", idKey: "foodId", label: CONCESSION_LABELS.itemTypeFood },
  drink: { nameKey: "drinkName", idKey: "drinkId", label: CONCESSION_LABELS.itemTypeDrink },
  combo: { nameKey: "comboName", idKey: "comboId", label: CONCESSION_LABELS.itemTypeCombo },
};

export const CONCESSION_SERVICE_BY_TYPE = {
  food: {
    getAll: ConcessionService.getAllFoods,
    search: ConcessionService.searchFoods,
    create: ConcessionService.createFood,
    update: ConcessionService.updateFood,
    restore: ConcessionService.restoreFood,
    remove: ConcessionService.deleteFood,
  },
  drink: {
    getAll: ConcessionService.getAllDrinks,
    search: ConcessionService.searchDrinks,
    create: ConcessionService.createDrink,
    update: ConcessionService.updateDrink,
    restore: ConcessionService.restoreDrink,
    remove: ConcessionService.deleteDrink,
  },
  combo: {
    getAll: ConcessionService.getAllCombos,
    search: ConcessionService.searchCombos,
    create: ConcessionService.createCombo,
    update: ConcessionService.updateCombo,
    restore: ConcessionService.restoreCombo,
    remove: ConcessionService.deleteCombo,
  },
};

export const fieldInputClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldInputIconClass =
  "block w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldTextareaClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm resize-none";

export const fieldSelectClass =
  "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white";

export const fieldLabelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const mapConcessionApiError = (error, fallback) => {
  const msg = error?.response?.data?.message || error?.message || "";
  if (msg.toLowerCase().includes("already exists")) {
    return CONCESSION_LABELS.nameAlreadyExists;
  }
  return msg || fallback;
};

export const getConcessionStatusBadge = (status) => {
  if (status === "INACTIVE") return { label: CONCESSION_LABELS.statusInactive, cls: "bg-gray-100 text-gray-500" };
  if (status === "DELETED") return { label: CONCESSION_LABELS.statusDeleted, cls: "bg-red-100 text-red-500" };
  return { label: CONCESSION_LABELS.statusActive, cls: "bg-green-100 text-green-700" };
};

export const formatVnd = (value) =>
  value == null || value === "" ? "—" : `${Number(value).toLocaleString("vi-VN")} ${CONCESSION_LABELS.currencyUnit}`;

export const formatPriceSummary = (prices) => {
  if (!prices || prices.length === 0) return "—";
  if (prices.length === 1) return formatVnd(prices[0].price);
  const values = prices.map((p) => Number(p.price));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? formatVnd(min) : `${formatVnd(min)} – ${formatVnd(max)}`;
};

const EMPTY_PRICE_STATE = { NONE: "", S: "", M: "", L: "" };

export const emptyConcessionForm = () => ({
  name: "",
  description: "",
  image: "",
  status: "ACTIVE",
  enabledSizes: [],
  priceBySize: { ...EMPTY_PRICE_STATE },
});

export const toConcessionFormState = (itemType, item) => {
  const priceBySize = { ...EMPTY_PRICE_STATE };
  const enabledSizes = [];
  (item.prices || []).forEach((p) => {
    priceBySize[p.size] = p.price != null ? String(p.price) : "";
    enabledSizes.push(p.size);
  });
  return {
    name: item[ITEM_TYPE_META[itemType].nameKey] || "",
    description: item.description || "",
    image: item.image || "",
    status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    enabledSizes,
    priceBySize,
  };
};

export const buildConcessionPayload = (itemType, formData) => {
  const nameKey = ITEM_TYPE_META[itemType].nameKey;
  const prices = formData.enabledSizes.map((size) => ({
    size,
    price: Number(formData.priceBySize[size]),
  }));
  return {
    [nameKey]: formData.name?.trim() || null,
    description: formData.description?.trim() || null,
    image: formData.image?.trim() || null,
    status: formData.status,
    prices,
  };
};
