import { CONCESSION_LABELS } from "../../../../constants/labels";
import ConcessionService from "../../../../services/ConcessionService";

export const PAGE_SIZE = 10;

/** Giá bán tối đa cho mỗi size (đồng) — khớp BE ConcessionSupport.MAX_PRICE */
export const MAX_CONCESSION_PRICE = 10_000_000;

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
    getAll: ConcessionService.getAllFoodsAdmin,
    search: ConcessionService.searchFoodsAdmin,
    create: ConcessionService.createFood,
    update: ConcessionService.updateFood,
    restore: ConcessionService.restoreFood,
    remove: ConcessionService.deleteFood,
  },
  drink: {
    getAll: ConcessionService.getAllDrinksAdmin,
    search: ConcessionService.searchDrinksAdmin,
    create: ConcessionService.createDrink,
    update: ConcessionService.updateDrink,
    restore: ConcessionService.restoreDrink,
    remove: ConcessionService.deleteDrink,
  },
  combo: {
    getAll: ConcessionService.getAllCombosAdmin,
    search: ConcessionService.searchCombosAdmin,
    create: ConcessionService.createCombo,
    update: ConcessionService.updateCombo,
    restore: ConcessionService.restoreCombo,
    remove: ConcessionService.deleteCombo,
  },
};

export const fieldInputClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldInputIconClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";

export const fieldTextareaClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm resize-none";

export const fieldSelectClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white";

export const fieldLabelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const mapConcessionApiError = (error, fallback) => {
  const msg = String(error?.response?.data?.message || error?.message || "");
  const lower = msg.toLowerCase();

  if (lower.includes("food name already exists") || msg.includes("Tên món ăn đã tồn tại")) {
    return CONCESSION_LABELS.foodNameAlreadyExists;
  }
  if (lower.includes("drink name already exists") || msg.includes("Tên thức uống đã tồn tại")) {
    return CONCESSION_LABELS.drinkNameAlreadyExists;
  }
  if (lower.includes("combo name already exists") || msg.includes("Tên combo đã tồn tại")) {
    return CONCESSION_LABELS.comboNameAlreadyExists;
  }
  if (lower.includes("already exists")) {
    return CONCESSION_LABELS.nameAlreadyExists;
  }
  if (msg.includes("đang thuộc một combo") && msg.toLowerCase().includes("món ăn")) {
    return CONCESSION_LABELS.foodInComboCannotDelete;
  }
  if (msg.includes("đang thuộc một combo") && (msg.includes("nước uống") || msg.includes("thức uống"))) {
    return CONCESSION_LABELS.drinkInComboCannotDelete;
  }
  if (
    lower.includes("price must be positive") ||
    msg.includes("Giá bán phải lớn hơn 0") ||
    msg.includes("Giá phải lớn hơn 0")
  ) {
    return CONCESSION_LABELS.validationPricePositive;
  }
  if (
    lower.includes("giá bán tối đa") ||
    lower.includes("decimalmax") ||
    /10000000/.test(msg)
  ) {
    return CONCESSION_LABELS.priceExceedsMax;
  }
  if (lower.includes("at least one price") || msg.includes("ít nhất một loại giá")) {
    return CONCESSION_LABELS.validationPriceRequired;
  }
  if (lower.includes("none must be the only") || msg.includes("Tiêu chuẩn không thể kết hợp")) {
    return CONCESSION_LABELS.validationNoneExclusive;
  }
  if (lower.includes("name is required") || msg.includes("Vui lòng nhập tên")) {
    return CONCESSION_LABELS.validationNameRequired;
  }

  return msg || fallback;
};

export const clampConcessionPriceDigits = (rawDigits) => {
  const digits = String(rawDigits ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const asNumber = Number(digits);
  if (!Number.isFinite(asNumber)) return "";
  if (asNumber > MAX_CONCESSION_PRICE) return String(MAX_CONCESSION_PRICE);
  return digits.replace(/^0+(?=\d)/, "");
};

export const getConcessionStatusBadge = (status) => {
  if (status === "INACTIVE") return { label: CONCESSION_LABELS.statusInactive, cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" };
  if (status === "DELETED") return { label: CONCESSION_LABELS.statusDeleted, cls: "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-300" };
  return { label: CONCESSION_LABELS.statusActive, cls: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" };
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

export const emptyConcessionForm = (itemType) => ({
  name: "",
  description: "",
  image: "",
  status: "ACTIVE",
  enabledSizes: itemType === "combo" ? ["NONE"] : [],
  priceBySize: { ...EMPTY_PRICE_STATE },
  comboFoodItems: [],
  comboDrinkItems: [],
});

export const toConcessionFormState = (itemType, item) => {
  const priceBySize = { ...EMPTY_PRICE_STATE };
  let enabledSizes = [];
  if (itemType === "combo") {
    // Combo pricing is always a single flat price (no size concept for the combo itself).
    const noneEntry = (item.prices || []).find((p) => p.size === "NONE") || (item.prices || [])[0];
    priceBySize.NONE = noneEntry?.price != null ? String(noneEntry.price) : "";
    enabledSizes = ["NONE"];
  } else {
    (item.prices || []).forEach((p) => {
      priceBySize[p.size] = p.price != null ? String(p.price) : "";
      enabledSizes.push(p.size);
    });
  }
  const comboFoodItems = (item.items || [])
    .filter((i) => i.foodId != null)
    .map((i) => ({ foodId: i.foodId, size: i.size, quantity: i.quantity }));
  const comboDrinkItems = (item.items || [])
    .filter((i) => i.drinkId != null)
    .map((i) => ({ drinkId: i.drinkId, size: i.size, quantity: i.quantity }));
  return {
    name: item[ITEM_TYPE_META[itemType].nameKey] || "",
    description: item.description || "",
    image: item.image || "",
    status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    enabledSizes,
    priceBySize,
    comboFoodItems,
    comboDrinkItems,
  };
};

export const buildConcessionPayload = (itemType, formData) => {
  const nameKey = ITEM_TYPE_META[itemType].nameKey;
  const prices = formData.enabledSizes.map((size) => ({
    size,
    price: Number(formData.priceBySize[size]),
  }));
  const payload = {
    [nameKey]: formData.name?.trim() || null,
    description: formData.description?.trim() || null,
    image: formData.image?.trim() || null,
    status: formData.status,
    prices,
  };
  if (itemType === "combo") {
    payload.items = [
      ...(formData.comboFoodItems || []).map((i) => ({ foodId: i.foodId, size: i.size, quantity: i.quantity })),
      ...(formData.comboDrinkItems || []).map((i) => ({ drinkId: i.drinkId, size: i.size, quantity: i.quantity })),
    ];
  }
  return payload;
};
