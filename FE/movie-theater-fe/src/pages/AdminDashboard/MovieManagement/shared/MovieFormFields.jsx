import React, { useRef, useState } from "react";
import {
  Film,
  User,
  Clock,
  Link,
  FileText,
  Image,
  Upload,
  Loader2,
  ZoomIn,
} from "lucide-react";
import {
  fieldInputClass,
  fieldInputIconClass,
  fieldTextareaClass,
  fieldLabelClass,
} from "./movieFormConstants";
import MovieService from "../../../../services/MovieService";
import DateInput from "../../../../components/DateInput";
import ImageLightbox from "../../../../components/ImageLightbox";

const RequiredMark = () => <span className="text-red-500 ml-0.5">*</span>;

const Field = ({ label, required, icon: Icon, colSpan = false, children }) => (
  <div className={colSpan ? "md:col-span-2" : ""}>
    <label className={fieldLabelClass}>
      {label}
      {required && <RequiredMark />}
    </label>
    {Icon ? (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <Icon size={15} />
        </span>
        {React.cloneElement(children, {
          className: `${children.props.className || ""} ${fieldInputIconClass}`,
        })}
      </div>
    ) : (
      children
    )}
  </div>
);

const ImageUploadField = ({ label, fieldName, value, onChange, required = false }) => {
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
      const res = await MovieService.uploadImage(file);
      const url = res.data?.data;
      onChange({ target: { name: fieldName, value: url } });
    } catch {
      setUploadError("Upload thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={fieldLabelClass}>
        {label}
        {required && <RequiredMark />}
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            name={fieldName}
            value={value}
            onChange={onChange}
            placeholder="https://... hoặc upload ảnh"
            className={fieldInputClass}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}
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

const CheckboxGroup = ({ label, options, selectedIds, idKey, labelKey, onChange, allowSelectAll = false }) => {
  const toggle = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const allSelected = options.length > 0 && options.every((opt) => selectedIds.includes(opt[idKey]));
  const handleSelectAll = () => {
    onChange(allSelected ? [] : options.map((opt) => opt[idKey]));
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between">
        <label className={fieldLabelClass}>{label} <span className="text-red-500">*</span></label>
        {allowSelectAll && options.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-[#C00000] hover:underline mb-1"
          >
            {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Chưa có dữ liệu — sẽ hiển thị sau khi có ít nhất 1 phim được gán.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-1">
          {options.map((opt) => {
            const id = opt[idKey];
            const name = opt[labelKey];
            const checked = selectedIds.includes(id);
            return (
              <label
                key={id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer select-none transition-all ${
                  checked
                    ? "bg-[#C00000] text-white border-[#C00000]"
                    : "bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-[#C00000] hover:text-[#C00000]"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  onChange={() => toggle(id)}
                />
                {name}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MovieFormFields = ({ formData, onChange, onTypeChange, onVersionChange, typeOptions, versionOptions }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-left">
    {/* Tên phim VN */}
    <div>
      <label className={fieldLabelClass}>Tên phim (Tiếng Việt) <span className="text-red-500">*</span></label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><Film size={15} /></span>
        <input
          type="text"
          name="movieNameVn"
          value={formData.movieNameVn}
          onChange={onChange}
          required
          maxLength={200}
          placeholder="Nhập tên phim tiếng Việt..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Tên phim EN */}
    <div>
      <label className={fieldLabelClass}>Tên phim (Tiếng Anh) <span className="text-red-500">*</span></label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><Film size={15} /></span>
        <input
          type="text"
          name="movieNameEnglish"
          value={formData.movieNameEnglish}
          onChange={onChange}
          required
          maxLength={200}
          placeholder="Nhập tên phim tiếng Anh..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Đạo diễn */}
    <div>
      <label className={fieldLabelClass}>Đạo diễn</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><User size={15} /></span>
        <input
          type="text"
          name="director"
          value={formData.director}
          onChange={onChange}
          maxLength={200}
          placeholder="Tên đạo diễn..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Diễn viên */}
    <div>
      <label className={fieldLabelClass}>Diễn viên</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><User size={15} /></span>
        <input
          type="text"
          name="actor"
          value={formData.actor}
          onChange={onChange}
          maxLength={300}
          placeholder="Tên diễn viên..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Nhà sản xuất */}
    <div>
      <label className={fieldLabelClass}>Nhà sản xuất</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><User size={15} /></span>
        <input
          type="text"
          name="movieProductionCompany"
          value={formData.movieProductionCompany}
          onChange={onChange}
          maxLength={200}
          placeholder="Tên nhà sản xuất..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Thời lượng */}
    <div>
      <label className={fieldLabelClass}>Thời lượng (phút) <span className="text-red-500">*</span></label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><Clock size={15} /></span>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={onChange}
          required
          min={1}
          placeholder="Ví dụ: 120"
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Trailer URL */}
    <div className="md:col-span-2">
      <label className={fieldLabelClass}>Trailer (URL YouTube) <span className="text-red-500">*</span></label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"><Link size={15} /></span>
        <input
          type="url"
          name="trailer"
          value={formData.trailer}
          onChange={onChange}
          maxLength={500}
          placeholder="https://youtube.com/..."
          className={fieldInputIconClass}
        />
      </div>
    </div>

    {/* Ngày khởi chiếu */}
    <div>
      <label className={fieldLabelClass}>Ngày khởi chiếu</label>
      <DateInput
        name="fromDate"
        value={formData.fromDate}
        onChange={onChange}
        className={fieldInputIconClass}
      />
    </div>

    {/* Ngày kết thúc */}
    <div>
      <label className={fieldLabelClass}>Ngày kết thúc chiếu</label>
      <DateInput
        name="toDate"
        value={formData.toDate}
        onChange={onChange}
        min={formData.fromDate || undefined}
        className={fieldInputIconClass}
      />
    </div>

    {/* Nội dung */}
    <div className="md:col-span-2">
      <label className={fieldLabelClass}>Nội dung phim</label>
      <textarea
        name="content"
        value={formData.content}
        onChange={onChange}
        rows={3}
        maxLength={2000}
        placeholder="Mô tả nội dung phim..."
        className={fieldTextareaClass}
      />
    </div>

    {/* Ảnh lớn */}
    <ImageUploadField
      label="Ảnh poster lớn"
      fieldName="largeImage"
      value={formData.largeImage}
      onChange={onChange}
      required
    />

    {/* Ảnh nhỏ */}
    <ImageUploadField
      label="Ảnh poster nhỏ"
      fieldName="smallImage"
      value={formData.smallImage}
      onChange={onChange}
      required
    />

    {/* Thể loại */}
    <CheckboxGroup
      label="Thể loại"
      options={typeOptions}
      selectedIds={formData.typeIds}
      idKey="typeId"
      labelKey="typeName"
      onChange={onTypeChange}
    />

    {/* Định dạng */}
    <CheckboxGroup
      label="Định dạng"
      options={versionOptions}
      selectedIds={formData.versionIds}
      idKey="versionId"
      labelKey="versionName"
      onChange={onVersionChange}
      allowSelectAll
    />
  </div>
);

export default MovieFormFields;
