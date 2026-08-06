import { useEffect, useRef, useState } from "react";
import { Tag, Upload, Loader2, ZoomIn, Minus, Plus, Popcorn, X } from "lucide-react";
import {
  fieldInputClass,
  fieldInputIconClass,
  fieldTextareaClass,
  fieldSelectClass,
  fieldLabelClass,
  SIZE_OPTIONS,
  formatVnd,
  clampConcessionPriceDigits,
} from "./concessionFormConstants";
import ConcessionService from "../../../../services/ConcessionService";
import { CONCESSION_LABELS, COMMON_LABELS } from "../../../../constants/labels";
import ImageLightbox from "../../../../components/ImageLightbox";

const SIZE_LABEL_BY_VALUE = SIZE_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const RequiredMark = () => <span className="text-red-500 ml-0.5">*</span>;

const ImageUploadField = ({ value, onChange }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await ConcessionService.uploadImage(file);
      const url = res.data?.url || res.data;
      onChange(url);
    } catch {
      setUploadError(CONCESSION_LABELS.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={fieldLabelClass}>{CONCESSION_LABELS.fieldImage}</label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={CONCESSION_LABELS.imagePlaceholder}
            className={fieldInputClass}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {CONCESSION_LABELS.uploadButton}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        {uploadError && <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>}
        {value && (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0"
            title="Xem ảnh lớn"
          >
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
              <ZoomIn
                size={18}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </span>
          </button>
        )}
      </div>
      <ImageLightbox src={zoomOpen ? value : null} onClose={() => setZoomOpen(false)} />
    </div>
  );
};

const digitsOnly = (value) => clampConcessionPriceDigits(value);

const blockNonDigitKeys = (e) => {
  if (
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
  ) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

const PriceEditor = ({ enabledSizes, priceBySize, onChange }) => {
  const toggleSize = (size) => {
    let nextEnabled;
    let nextPrices = { ...priceBySize };

    if (size === "NONE") {
      const turningOn = !enabledSizes.includes("NONE");
      nextEnabled = turningOn ? ["NONE"] : [];
      nextPrices = turningOn
        ? { ...nextPrices, S: "", M: "", L: "" }
        : { ...nextPrices, NONE: "" };
    } else {
      const isEnabled = enabledSizes.includes(size);
      nextEnabled = isEnabled
        ? enabledSizes.filter((s) => s !== size)
        : [...enabledSizes.filter((s) => s !== "NONE"), size];
      nextPrices = isEnabled
        ? { ...nextPrices, [size]: "" }
        : { ...nextPrices, NONE: "" };
    }

    onChange({ enabledSizes: nextEnabled, priceBySize: nextPrices });
  };

  const setPrice = (size, value) => {
    onChange({ enabledSizes, priceBySize: { ...priceBySize, [size]: digitsOnly(value) } });
  };

  return (
    <div className="md:col-span-2">
      <label className={fieldLabelClass}>
        {CONCESSION_LABELS.fieldPrices} <RequiredMark />
      </label>
      <div className="space-y-2">
        {SIZE_OPTIONS.map((opt) => {
          const checked = enabledSizes.includes(opt.value);
          return (
            <div key={opt.value} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSize(opt.value)}
                  className="accent-[#C00000]"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                disabled={!checked}
                value={priceBySize[opt.value] ?? ""}
                onKeyDown={blockNonDigitKeys}
                onChange={(e) => setPrice(opt.value, e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  setPrice(opt.value, e.clipboardData.getData("text"));
                }}
                placeholder={CONCESSION_LABELS.pricePlaceholder}
                className={`${fieldInputClass} max-w-[180px] disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:text-gray-300 dark:disabled:text-gray-600`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ComboPriceEditor = ({ priceBySize, onChange }) => (
  <div className="md:col-span-2">
    <label className={fieldLabelClass}>
      {CONCESSION_LABELS.fieldPrices} <RequiredMark />
    </label>
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={priceBySize.NONE ?? ""}
      onKeyDown={blockNonDigitKeys}
      onChange={(e) =>
        onChange({
          enabledSizes: ["NONE"],
          priceBySize: { NONE: digitsOnly(e.target.value), S: "", M: "", L: "" },
        })
      }
      onPaste={(e) => {
        e.preventDefault();
        onChange({
          enabledSizes: ["NONE"],
          priceBySize: { NONE: digitsOnly(e.clipboardData.getData("text")), S: "", M: "", L: "" },
        });
      }}
      placeholder={CONCESSION_LABELS.pricePlaceholder}
      className={`${fieldInputClass} max-w-[220px]`}
    />
  </div>
);

const ComboItemPicker = ({ items, availableItems, idKey, nameKey, onChange, emptyMessage }) => {
  const [expandedId, setExpandedId] = useState(null);
  const selectionByItemId = new Map(items.map((i) => [i[idKey], i]));

  const priceForSize = (prices, size) => prices.find((p) => p.size === size)?.price;

  const selectSize = (opt, size) => {
    const id = opt[idKey];
    const existing = selectionByItemId.get(id);
    if (existing && existing.size === size) {
      onChange(items.filter((i) => i[idKey] !== id));
      return;
    }
    if (existing) {
      onChange(items.map((i) => (i[idKey] === id ? { ...i, size, quantity: i.quantity || 1 } : i)));
    } else {
      onChange([...items, { [idKey]: id, size, quantity: 1 }]);
    }
  };

  const setQuantity = (id, nextQuantity) => {
    const quantity = Math.max(1, nextQuantity);
    onChange(items.map((i) => (i[idKey] === id ? { ...i, quantity } : i)));
  };

  const removeItem = (id) => onChange(items.filter((i) => i[idKey] !== id));

  if (availableItems.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto pr-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2">
      {availableItems.map((opt) => {
        const id = opt[idKey];
        const selection = selectionByItemId.get(id);
        const active = !!selection;
        const prices = opt.prices || [];
        const isExpanded = expandedId === id;
        const selectedPrice = active ? priceForSize(prices, selection.size) : null;

        return (
          <div
            key={id}
            className={`rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-red-50/60 dark:bg-red-950/30" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
                {opt.image ? (
                  <img src={opt.image} alt={opt[nameKey]} className="w-full h-full object-cover" />
                ) : (
                  <Popcorn size={14} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm block truncate ${active ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                  title={opt[nameKey]}
                >
                  {opt[nameKey]}
                </span>
                {active && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {SIZE_LABEL_BY_VALUE[selection.size] || selection.size}
                    {selectedPrice != null && ` · ${formatVnd(selectedPrice)}`}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : id)}
                className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  isExpanded
                    ? "bg-[#C00000] text-white border-[#C00000]"
                    : "bg-white dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Tag size={11} />
                {CONCESSION_LABELS.viewPriceButton}
              </button>

              {active && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(id, selection.quantity - 1)}
                    disabled={selection.quantity <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                    {selection.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(id, selection.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(id)}
                    title={CONCESSION_LABELS.actionDelete}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="mt-2 pl-11 flex flex-wrap gap-2">
                {prices.length === 0 ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{CONCESSION_LABELS.comboNoPriceAvailable}</span>
                ) : (
                  prices.map((p) => {
                    const selected = selection?.size === p.size;
                    return (
                      <button
                        key={p.size}
                        type="button"
                        onClick={() => selectSize(opt, p.size)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          selected
                            ? "bg-[#C00000] text-white border-[#C00000]"
                            : "bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#C00000]"
                        }`}
                      >
                        {SIZE_LABEL_BY_VALUE[p.size] || p.size} · {formatVnd(p.price)}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ComboItemsFields = ({ formData, onChange }) => {
  const [availableFoods, setAvailableFoods] = useState([]);
  const [availableDrinks, setAvailableDrinks] = useState([]);

  useEffect(() => {
    ConcessionService.getAllFoodsAdmin()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setAvailableFoods(list.filter((f) => f.status !== "DELETED"));
      })
      .catch(() => setAvailableFoods([]));
    ConcessionService.getAllDrinksAdmin()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setAvailableDrinks(list.filter((d) => d.status !== "DELETED"));
      })
      .catch(() => setAvailableDrinks([]));
  }, []);

  const missingFood = formData.comboFoodItems.length === 0;
  const missingDrink = formData.comboDrinkItems.length === 0;

  return (
    <>
      <div>
        <label className={fieldLabelClass}>
          {CONCESSION_LABELS.fieldComboFoodItems} <RequiredMark />
        </label>
        <ComboItemPicker
          items={formData.comboFoodItems}
          availableItems={availableFoods}
          idKey="foodId"
          nameKey="foodName"
          onChange={(comboFoodItems) => onChange({ comboFoodItems })}
          emptyMessage={CONCESSION_LABELS.comboNoFoodAvailable}
        />
        {missingFood && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{CONCESSION_LABELS.validationComboNeedsFood}</p>
        )}
      </div>

      <div>
        <label className={fieldLabelClass}>
          {CONCESSION_LABELS.fieldComboDrinkItems} <RequiredMark />
        </label>
        <ComboItemPicker
          items={formData.comboDrinkItems}
          availableItems={availableDrinks}
          idKey="drinkId"
          nameKey="drinkName"
          onChange={(comboDrinkItems) => onChange({ comboDrinkItems })}
          emptyMessage={CONCESSION_LABELS.comboNoDrinkAvailable}
        />
        {missingDrink && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{CONCESSION_LABELS.validationComboNeedsDrink}</p>
        )}
      </div>
    </>
  );
};

const ConcessionFormFields = ({ itemType, formData, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-left">
    <div className="md:col-span-2">
      <label className={fieldLabelClass}>
        {CONCESSION_LABELS.fieldName} <RequiredMark />
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <Tag size={15} />
        </span>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          maxLength={150}
          placeholder={CONCESSION_LABELS.namePlaceholder}
          className={fieldInputIconClass}
        />
      </div>
    </div>

    <div className="md:col-span-2">
      <label className={fieldLabelClass}>{CONCESSION_LABELS.fieldDescription}</label>
      <textarea
        value={formData.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
        maxLength={1000}
        placeholder={CONCESSION_LABELS.descriptionPlaceholder}
        className={fieldTextareaClass}
      />
    </div>

    <ImageUploadField value={formData.image} onChange={(url) => onChange({ image: url })} />

    <div>
      <label className={fieldLabelClass}>{CONCESSION_LABELS.fieldStatus}</label>
      <select
        value={formData.status}
        onChange={(e) => onChange({ status: e.target.value })}
        className={fieldSelectClass}
      >
        <option value="ACTIVE">{COMMON_LABELS.active}</option>
        <option value="INACTIVE">{COMMON_LABELS.inactive}</option>
      </select>
    </div>

    {itemType === "combo" ? (
      <ComboPriceEditor priceBySize={formData.priceBySize} onChange={onChange} />
    ) : (
      <PriceEditor
        enabledSizes={formData.enabledSizes}
        priceBySize={formData.priceBySize}
        onChange={onChange}
      />
    )}

    {itemType === "combo" && <ComboItemsFields formData={formData} onChange={onChange} />}
  </div>
);

export default ConcessionFormFields;
