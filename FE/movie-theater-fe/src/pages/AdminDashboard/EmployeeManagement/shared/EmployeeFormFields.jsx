import React from "react";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Lock,
} from "lucide-react";
import {
  fieldInputClass,
  fieldSelectClass,
  fieldLabelClass,
} from "./employeeFormConstants";

const locationData = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Huyện Đông Anh",
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10",
    "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Tân Bình", "Quận Gò Vấp", "TP. Thủ Đức",
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu", "Quận Cẩm Lệ",
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt",
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An",
  ],
};

const RequiredMark = () => <span className="text-red-500">*</span>;

const FieldError = ({ message }) =>
  message ? (
    <span className="text-[#C00000] text-xs font-semibold mt-1 block">{message}</span>
  ) : null;

const Field = ({ label, required, icon: Icon, error, children }) => (
  <div>
    <label className={fieldLabelClass}>
      {label} {required && <RequiredMark />}
    </label>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Icon size={16} />
        </span>
      )}
      {children}
    </div>
    <FieldError message={error} />
  </div>
);

const EmployeeFormFields = ({ formData, onChange, mode = "add", errors = {} }) => {
  const isAdd = mode === "add";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
      {isAdd && (
        <>
          <Field label="Tên đăng nhập" required icon={User} error={errors.username}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={onChange}
              required
              maxLength={28}
              placeholder="Chữ thường viết liền, tối đa 28 ký tự..."
              className={fieldInputClass}
            />
          </Field>

          <Field label="Số điện thoại" required icon={Phone} error={errors.phoneNumber}>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onChange}
              required
              maxLength={28}
              placeholder="0901234567"
              className={fieldInputClass}
            />
          </Field>
        </>
      )}

      <Field label="Họ và tên" required icon={User} error={errors.fullName}>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={onChange}
          required
          maxLength={28}
          placeholder="Nguyễn Văn A"
          className={fieldInputClass}
        />
      </Field>

      <Field label="CMND / CCCD" required={isAdd} icon={CreditCard} error={errors.identityCard}>
        <input
          type="text"
          name="identityCard"
          value={formData.identityCard}
          onChange={onChange}
          required={isAdd}
          maxLength={28}
          placeholder="Nhập số CMND/CCCD..."
          className={fieldInputClass}
        />
      </Field>

      <Field label="Email" required icon={Mail} error={errors.email}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
          maxLength={28}
          placeholder="email@example.com"
          className={fieldInputClass}
        />
      </Field>

      <Field label="Ngày sinh" required={isAdd} icon={Calendar} error={errors.dateOfBirth}>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={onChange}
          required={isAdd}
          className={fieldInputClass}
        />
      </Field>

      <Field label="Giới tính" required={isAdd} icon={User} error={errors.gender}>
        <select
          name="gender"
          value={formData.gender}
          onChange={onChange}
          required={isAdd}
          className={fieldSelectClass}
        >
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
      </Field>

      {isAdd ? (
        <Field label="Mật khẩu" required icon={Lock} error={errors.password}>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            required
            maxLength={28}
            placeholder="Nhập mật khẩu đăng nhập..."
            className={fieldInputClass}
          />
        </Field>
      ) : (
        <>
          <Field label="Số điện thoại" icon={Phone} error={errors.phoneNumber}>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onChange}
              maxLength={28}
              placeholder="0901234567"
              className={fieldInputClass}
            />
          </Field>

          <Field label="Mật khẩu mới" icon={Lock} error={errors.password}>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              maxLength={28}
              placeholder="Để trống nếu không đổi"
              className={fieldInputClass}
            />
          </Field>

          <div className="flex items-center p-3 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="leading-relaxed">
              💡 Để trống mật khẩu nếu không muốn thay đổi tài khoản đăng nhập của nhân viên.
            </span>
          </div>
        </>
      )}

      {isAdd && (
        <div className="md:col-span-2 flex items-center p-3 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="leading-relaxed">
            💡 Tài khoản nhân viên sẽ dùng tên đăng nhập và mật khẩu bạn nhập để đăng nhập hệ thống.
          </span>
        </div>
      )}

      <div className="md:col-span-2 space-y-4 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Tỉnh / Thành phố" required={isAdd} icon={MapPin} error={errors.province}>
            <select
              name="province"
              value={formData.province}
              onChange={onChange}
              required={isAdd}
              className={fieldSelectClass}
            >
              <option value="">Chọn Tỉnh/Thành...</option>
              {Object.keys(locationData).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quận / Huyện" required={isAdd} icon={MapPin} error={errors.district}>
            <select
              name="district"
              value={formData.district}
              onChange={onChange}
              disabled={!formData.province}
              required={isAdd}
              className={`${fieldSelectClass} disabled:bg-gray-50 disabled:cursor-not-allowed`}
            >
              <option value="">Chọn Quận/Huyện...</option>
              {formData.province &&
                locationData[formData.province]?.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <Field
          label="Địa chỉ chi tiết"
          required={isAdd}
          icon={MapPin}
          error={errors.detailAddress || errors.address}
        >
          <input
            type="text"
            name="detailAddress"
            value={formData.detailAddress}
            onChange={onChange}
            required={isAdd}
            placeholder="Số nhà, tên đường, phường/xã..."
            className={fieldInputClass}
          />
        </Field>
      </div>
    </div>
  );
};

export default EmployeeFormFields;
