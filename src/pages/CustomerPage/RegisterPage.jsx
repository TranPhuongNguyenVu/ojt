/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Users,
  Film,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const locationData = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy", 
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Huyện Đông Anh"
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", 
    "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Tân Bình", "Quận Gò Vấp", "TP. Thủ Đức"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu", "Quận Cẩm Lệ"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An"
  ]
};

const fieldClass =
  'w-full bg-white/80 dark:bg-white/[0.06] text-sm text-[#111827] dark:text-[#F5F7FB] pl-11 pr-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/12 focus:outline-none focus:border-[var(--cine-red)] focus:ring-2 focus:ring-[var(--cine-red)]/25 transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-white/35 disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass =
  'block text-[10px] font-black uppercase tracking-[0.16em] text-[#9CA3AF] dark:text-white/40 mb-1.5';

const errorClass = 'mt-1 block text-xs font-semibold text-[#C00000] dark:text-red-300';

const Field = ({ icon: Icon, label, required, error, children }) => (
  <div className="min-w-0 space-y-0">
    <label className={labelClass}>
      {label} {required && <span className="text-[var(--cine-red)]">*</span>}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40">
        <Icon size={16} strokeWidth={2} />
      </span>
      {children}
    </div>
    {error && <span className={errorClass}>{error}</span>}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    identityCard: "",
    dateOfBirth: "",
    gender: "Nam", // Mặc định là Nam
    province: "",
    district: "",
    detailAddress: "",
    password: "",
    confirmPassword: ""
  });

  // Hàm tự động bắt dữ liệu mỗi khi người dùng gõ phím vào bất kỳ ô nào
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "province") {
      setFormData({
        ...formData,
        province: value,
        district: '',
      });
      setErrors((prev) => ({
        ...prev,
        province: '',
        district: '',
        detailAddress: '',
      }));
    } else if (name === 'district') {
      setFormData({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, district: '', detailAddress: '' }));
    } else {
      setFormData({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errorsObj = {};

    if (!formData.username || formData.username.trim() === '') {
      errorsObj.username = 'Vui lòng nhập tên đăng nhập!';
    } else {
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(formData.username)) {
        errorsObj.username =
          'Tên đăng nhập chỉ được phép chứa chữ cái và số (viết liền không dấu, không khoảng trắng)!';
      } else if (formData.username.length < 5 || formData.username.length > 20) {
        errorsObj.username = 'Tên đăng nhập phải dài từ 5 đến 20 ký tự!';
      }
    }

    if (!formData.fullName || formData.fullName.trim() === '') {
      errorsObj.fullName = 'Vui lòng nhập họ và tên!';
    } else {
      const fullNameRegex =
        /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ\s]+$/;
      if (!fullNameRegex.test(formData.fullName.trim())) {
        errorsObj.fullName = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng!';
      }
    }

    if (!formData.email || formData.email.trim() === '') {
      errorsObj.email = 'Vui lòng nhập email!';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errorsObj.email = 'Email không đúng định dạng (ví dụ: email@example.com)!';
      }
    }

    if (!formData.password || formData.password.trim() === '') {
      errorsObj.password = 'Vui lòng nhập mật khẩu!';
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        errorsObj.password =
          'Mật khẩu phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)!';
      }
    }

    if (!formData.confirmPassword || formData.confirmPassword.trim() === '') {
      errorsObj.confirmPassword = 'Vui lòng xác nhận mật khẩu!';
    } else if (formData.password !== formData.confirmPassword) {
      errorsObj.confirmPassword = 'Mật khẩu xác nhận không trùng khớp!';
    }

    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      errorsObj.phoneNumber = 'Vui lòng nhập số điện thoại!';
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        errorsObj.phoneNumber = 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!';
      }
    }

    if (!formData.identityCard || formData.identityCard.trim() === '') {
      errorsObj.identityCard = 'Vui lòng nhập số CMND/CCCD!';
    } else {
      const identityRegex = /^\d{9}$|^\d{12}$/;
      if (!identityRegex.test(formData.identityCard)) {
        errorsObj.identityCard = 'Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số!';
      }
    }

    if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
      errorsObj.dateOfBirth = 'Vui lòng nhập ngày sinh!';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (isNaN(dob.getTime()) || dob > today) {
        errorsObj.dateOfBirth = 'Ngày sinh không hợp lệ!';
      } else if (age < 18) {
        errorsObj.dateOfBirth = 'Thành viên đăng ký phải từ 18 tuổi trở lên!';
      }
    }

    if (!formData.gender || formData.gender.trim() === '') {
      errorsObj.gender = 'Vui lòng chọn giới tính!';
    }

    if (!formData.province || formData.province.trim() === '') {
      errorsObj.province = 'Vui lòng chọn Tỉnh/Thành phố!';
    }

    if (!formData.district || formData.district.trim() === '') {
      errorsObj.district = 'Vui lòng chọn Quận/Huyện!';
    }

    if (!formData.detailAddress || formData.detailAddress.trim() === '') {
      errorsObj.detailAddress = 'Vui lòng nhập địa chỉ chi tiết!';
    }

    if (!agreeTerms) {
      errorsObj.agreeTerms = 'Vui lòng đồng ý với Điều khoản sử dụng!';
    }

    if (Object.keys(errorsObj).length > 0) {
      setErrors(errorsObj);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const { confirmPassword, province, district, detailAddress, ...rest } = formData;
      const fullAddress = `${detailAddress.trim()}, ${district}, ${province}`;
      const submitData = { ...rest, address: fullAddress };

      await CustomerService.Register(submitData);
      navigate('/verify-otp', { state: { email: submitData.email } });
    } catch (error) {
      if (error.response?.data) {
        const msg = error.response.data.message || error.response.data;
        if (typeof msg === 'string') {
          if (msg.includes('Tên đăng nhập đã tồn tại!')) {
            setErrors({ username: 'Tên đăng nhập đã tồn tại!' });
          } else if (msg.includes('Email đã tồn tại!')) {
            setErrors({ email: 'Email đã tồn tại!' });
          } else {
            setErrors({ submit: msg });
          }
        } else {
          setErrors({ submit: 'Có lỗi xảy ra khi kết nối máy chủ!' });
        }
      } else {
        setErrors({ submit: 'Không thể kết nối đến máy chủ!' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-clip font-[family-name:var(--font-body)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHero})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-[#0a0a0f]/92"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[70%] -translate-x-1/2 rounded-full bg-[var(--cine-red)]/25 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Brand masthead — different rhythm from login split */}
        <header className="mb-8 flex flex-col items-start gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/90 transition hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cine-red)] shadow-lg shadow-red-900/40">
                <Film size={18} strokeWidth={2.4} />
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-black tracking-[0.08em] uppercase">
                Cinema Elite
              </span>
            </Link>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--cine-gold)]">
                Join the club
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-white sm:text-4xl min-w-0 [overflow-wrap:anywhere]">
                Tạo tài khoản mới
              </h1>
              <p className="max-w-lg text-sm font-medium leading-relaxed text-white/65">
                Đăng ký để đặt vé nhanh, tích điểm thành viên và nhận ưu đãi tại quầy.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 text-sm font-bold text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </header>

        <div className="rounded-[28px] border border-white/12 bg-white/94 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#10131A]/90 sm:p-8 md:p-10">
          <form className="space-y-7" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--cine-red)]">
                  Tài khoản
                </p>
                <Field icon={User} label="Tên đăng nhập" required error={errors.username}>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Chữ thường viết liền..."
                    className={fieldClass}
                  />
                </Field>
                <Field icon={User} label="Họ và tên" required error={errors.fullName}>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className={fieldClass}
                  />
                </Field>
                <Field icon={Mail} label="Email" required error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className={fieldClass}
                  />
                </Field>
                <Field icon={Lock} label="Mật khẩu" required error={errors.password}>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${fieldClass} tracking-widest`}
                  />
                </Field>
                <Field
                  icon={Lock}
                  label="Xác nhận mật khẩu"
                  required
                  error={errors.confirmPassword}
                >
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${fieldClass} tracking-widest`}
                  />
                </Field>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--cine-red)]">
                  Thông tin cá nhân
                </p>
                <Field icon={Phone} label="Số điện thoại" required error={errors.phoneNumber}>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0901234567"
                    className={fieldClass}
                  />
                </Field>
                <Field icon={CreditCard} label="CMND / CCCD" required error={errors.identityCard}>
                  <input
                    type="text"
                    name="identityCard"
                    value={formData.identityCard}
                    onChange={handleChange}
                    placeholder="Nhập số CCCD..."
                    className={fieldClass}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field icon={Calendar} label="Ngày sinh" required error={errors.dateOfBirth}>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`${fieldClass} pr-2`}
                    />
                  </Field>
                  <Field icon={Users} label="Giới tính" required error={errors.gender}>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`${fieldClass} appearance-none cursor-pointer`}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field icon={MapPin} label="Tỉnh / Thành phố" required error={errors.province}>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className={`${fieldClass} appearance-none cursor-pointer`}
                    >
                      <option value="">Chọn...</option>
                      {Object.keys(locationData).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field icon={MapPin} label="Quận / Huyện" required error={errors.district}>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      disabled={!formData.province}
                      className={`${fieldClass} appearance-none cursor-pointer`}
                    >
                      <option value="">Chọn...</option>
                      {formData.province &&
                        locationData[formData.province].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>

                <Field
                  icon={MapPin}
                  label="Địa chỉ chi tiết"
                  required
                  error={errors.detailAddress}
                >
                  <input
                    type="text"
                    name="detailAddress"
                    value={formData.detailAddress}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường, phường/xã..."
                    className={fieldClass}
                  />
                </Field>
              </div>
            </div>

            {errors.submit && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-semibold text-[#C00000] dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="flex flex-col items-stretch gap-4 border-t border-black/[0.06] pt-6 dark:border-white/10 sm:items-center">
              <label className="flex max-w-xl cursor-pointer select-none items-start gap-2.5 text-xs font-medium leading-relaxed text-[#6B7280] dark:text-white/50">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => {
                    setAgreeTerms(!agreeTerms);
                    setErrors((prev) => ({ ...prev, agreeTerms: '' }));
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--cine-red)] focus:ring-[var(--cine-red)]"
                />
                <span>
                  Tôi đồng ý với{' '}
                  <a href="#terms" className="font-bold text-[var(--cine-red)] hover:underline">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="#privacy" className="font-bold text-[var(--cine-red)] hover:underline">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>
              {errors.agreeTerms && <span className={errorClass}>{errors.agreeTerms}</span>}

              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-[var(--cine-red)] py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
                {!submitting && (
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-[#6B7280] dark:text-white/45">
            Bạn đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-[var(--cine-red)] hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
