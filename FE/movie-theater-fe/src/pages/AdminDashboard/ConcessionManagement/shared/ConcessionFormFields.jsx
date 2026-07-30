import { useRef, useState } from "react";
import { Tag, Upload, Loader2 } from "lucide-react";
import {
  fieldInputClass,
  fieldInputIconClass,
  fieldTextareaClass,
  fieldSelectClass,
  fieldLabelClass,
  SIZE_OPTIONS,
} from "./concessionFormConstants";
import ConcessionService from "../../../../services/ConcessionService";
import { CONCESSION_LABELS, COMMON_LABELS } from "../../../../constants/labels";

const RequiredMark = () => <span className="text-red-500 ml-0.5">*</span>;

const ImageUploadField = ({ value, onChange }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {CONCESSION_LABELS.uploadButton}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        {value && (
          <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
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
    onChange({ enabledSizes, priceBySize: { ...priceBySize, [size]: value } });
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
                <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                disabled={!checked}
                value={priceBySize[opt.value]}
                onChange={(e) => setPrice(opt.value, e.target.value)}
                placeholder={CONCESSION_LABELS.pricePlaceholder}
                className={`${fieldInputClass} max-w-[180px] disabled:bg-gray-50 disabled:text-gray-300`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ConcessionFormFields = ({ formData, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-left">
    <div className="md:col-span-2">
      <label className={fieldLabelClass}>
        {CONCESSION_LABELS.fieldName} <RequiredMark />
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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

    <PriceEditor
      enabledSizes={formData.enabledSizes}
      priceBySize={formData.priceBySize}
      onChange={onChange}
    />
  </div>
);

export default ConcessionFormFields;
