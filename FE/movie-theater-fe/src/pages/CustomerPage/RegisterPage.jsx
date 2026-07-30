import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Import đủ bộ Icon cho 10 trường nhập liệu
import { User, Mail, Lock, Phone, CreditCard, Calendar, MapPin, Users } from 'lucide-react';
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});

  // Quản lý dữ liệu form gom chung vào 1 cục cho gọn code
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
        district: "" // Reset quận/huyện khi đổi tỉnh/thành
      });
      setErrors((prev) => ({
        ...prev,
        province: "",
        district: "",
        detailAddress: ""
      }));
    } else if (name === "district") {
      setFormData({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, district: "", detailAddress: "" }));
    } else {
      setFormData({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errorsObj = {};

    // --- BƯỚC 1: FRONTEND TỰ VALIDATE (AC-02) ---

    // 1. Tên đăng nhập
    if (!formData.username || formData.username.trim() === "") {
      errorsObj.username = "Vui lòng nhập tên đăng nhập!";
    } else {
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(formData.username)) {
        errorsObj.username = "Tên đăng nhập chỉ được phép chứa chữ cái và số (viết liền không dấu, không khoảng trắng)!";
      } else if (formData.username.length < 5 || formData.username.length > 20) {
        errorsObj.username = "Tên đăng nhập phải dài từ 5 đến 20 ký tự!";
      }
    }

    // 2. Họ và tên
    if (!formData.fullName || formData.fullName.trim() === "") {
      errorsObj.fullName = "Vui lòng nhập họ và tên!";
    } else {
      const fullNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ\s]+$/;
      if (!fullNameRegex.test(formData.fullName.trim())) {
        errorsObj.fullName = "Họ và tên chỉ được chứa chữ cái và khoảng trắng!";
      }
    }

    // 3. Email
    if (!formData.email || formData.email.trim() === "") {
      errorsObj.email = "Vui lòng nhập email!";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errorsObj.email = "Email không đúng định dạng (ví dụ: email@example.com)!";
      }
    }

    // 4. Mật khẩu
    if (!formData.password || formData.password.trim() === "") {
      errorsObj.password = "Vui lòng nhập mật khẩu!";
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        errorsObj.password = "Mật khẩu phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)!";
      }
    }

    // 5. Xác nhận mật khẩu
    if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
      errorsObj.confirmPassword = "Vui lòng xác nhận mật khẩu!";
    } else if (formData.password !== formData.confirmPassword) {
      errorsObj.confirmPassword = "Mật khẩu xác nhận không trùng khớp!";
    }

    // 6. Số điện thoại
    if (!formData.phoneNumber || formData.phoneNumber.trim() === "") {
      errorsObj.phoneNumber = "Vui lòng nhập số điện thoại!";
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        errorsObj.phoneNumber = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!";
      }
    }

    // 7. CMND / CCCD
    if (!formData.identityCard || formData.identityCard.trim() === "") {
      errorsObj.identityCard = "Vui lòng nhập số CMND/CCCD!";
    } else {
      const identityRegex = /^\d{9}$|^\d{12}$/;
      if (!identityRegex.test(formData.identityCard)) {
        errorsObj.identityCard = "Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số!";
      }
    }

    // 8. Ngày sinh
    if (!formData.dateOfBirth || formData.dateOfBirth.trim() === "") {
      errorsObj.dateOfBirth = "Vui lòng nhập ngày sinh!";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (isNaN(dob.getTime()) || dob > today) {
        errorsObj.dateOfBirth = "Ngày sinh không hợp lệ!";
      } else if (age < 18) {
        errorsObj.dateOfBirth = "Thành viên đăng ký phải từ 18 tuổi trở lên!";
      }
    }

    // 9. Giới tính
    if (!formData.gender || formData.gender.trim() === "") {
      errorsObj.gender = "Vui lòng chọn giới tính!";
    }

    // 10. Tỉnh / Thành phố
    if (!formData.province || formData.province.trim() === "") {
      errorsObj.province = "Vui lòng chọn Tỉnh/Thành phố!";
    }

    // 11. Quận / Huyện
    if (!formData.district || formData.district.trim() === "") {
      errorsObj.district = "Vui lòng chọn Quận/Huyện!";
    }

    // 12. Địa chỉ chi tiết
    if (!formData.detailAddress || formData.detailAddress.trim() === "") {
      errorsObj.detailAddress = "Vui lòng nhập địa chỉ chi tiết!";
    }

    // --- BƯỚC 2: KIỂM TRA CHECKBOX ĐIỀU KHOẢN ---
    if (!agreeTerms) {
      errorsObj.agreeTerms = "Vui lòng đồng ý với Điều khoản sử dụng!";
    }

    // Nếu có lỗi, chặn lại và set state errors
    if (Object.keys(errorsObj).length > 0) {
      setErrors(errorsObj);
      return;
    }

    setErrors({});

    // --- BƯỚC 3: GỌI API ĐĂNG KÝ ---
    try {
      const { confirmPassword, province, district, detailAddress, ...rest } = formData;
      const fullAddress = `${detailAddress.trim()}, ${district}, ${province}`;
      const submitData = { ...rest, address: fullAddress };
      
      await CustomerService.Register(submitData);
      
      navigate("/verify-otp", { state: { email: submitData.email } });


      

    } catch (error) {
      if (error.response && error.response.data) {
        const msg = error.response.data.message || error.response.data;
        if (typeof msg === 'string') {
          if (msg.includes("Tên đăng nhập đã tồn tại!")) {
            setErrors({ username: "Tên đăng nhập đã tồn tại!" });
          } else if (msg.includes("Email đã tồn tại!")) {
            setErrors({ email: "Email đã tồn tại!" });
          } else {
            setErrors({ submit: msg });
          }
        } else {
          setErrors({ submit: "Có lỗi xảy ra khi kết nối máy chủ!" });
        }
      } else {
        setErrors({ submit: "Không thể kết nối đến máy chủ!" });
      }
    }
  };

  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-12 font-sans"
      style={{ backgroundImage: `url(${bgHero})` }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      {/* Card Form làm to hơn (max-w-4xl) để chứa vừa 2 cột */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 flex flex-col">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto font-medium">
            Đăng ký ngay để nhận ưu đãi thành viên và trải nghiệm điện ảnh đẳng cấp
          </p>
        </div>

        <form className="w-full space-y-6" onSubmit={handleRegister}>
          
          {/* LƯỚI 2 CỘT CHO 10 TRƯỜNG NHẬP LIỆU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            
            {/* ================= CỘT BÊN TRÁI ================= */}
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Tên Đăng Nhập <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={16} strokeWidth={2} /></span>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Chữ thường viết liền..." className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.username && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.username}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Họ và Tên <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={16} strokeWidth={2} /></span>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.fullName && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.fullName}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} strokeWidth={2} /></span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.email && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.email}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} strokeWidth={2} /></span>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all tracking-widest placeholder-gray-300" />
                </div>
                {errors.password && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.password}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} strokeWidth={2} /></span>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all tracking-widest placeholder-gray-300" />
                </div>
                {errors.confirmPassword && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* ================= CỘT BÊN PHẢI ================= */}
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Số điện thoại <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={16} strokeWidth={2} /></span>
                  <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0901234567" className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.phoneNumber && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.phoneNumber}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">CMND / CCCD <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={16} strokeWidth={2} /></span>
                  <input type="text" name="identityCard" value={formData.identityCard} onChange={handleChange} placeholder="Nhập số CCCD..." className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.identityCard && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.identityCard}</span>}
              </div>

              {/* Dòng này chia nhỏ tiếp làm 2 ô: Ngày sinh & Giới tính */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Ngày sinh <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={16} strokeWidth={2} /></span>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-white text-sm text-gray-800 pl-11 pr-2 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all text-gray-500" />
                  </div>
                  {errors.dateOfBirth && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.dateOfBirth}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Giới tính <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Users size={16} strokeWidth={2} /></span>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all appearance-none cursor-pointer">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  {errors.gender && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.gender}</span>}
                </div>
              </div>

              {/* Dòng địa chỉ chia cấp: Tỉnh thành & Quận huyện */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={16} strokeWidth={2} /></span>
                    <select name="province" value={formData.province} onChange={handleChange} className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all appearance-none cursor-pointer">
                      <option value="">Chọn Tỉnh/Thành...</option>
                      {Object.keys(locationData).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  {errors.province && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.province}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Quận / Huyện <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={16} strokeWidth={2} /></span>
                    <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.province} className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed">
                      <option value="">Chọn Quận/Huyện...</option>
                      {formData.province && locationData[formData.province].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  {errors.district && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.district}</span>}
                </div>
              </div>

              {/* Ô Nhập Địa chỉ chi tiết */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={16} strokeWidth={2} /></span>
                  <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="Số nhà, tên đường, phường/xã..." className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300" />
                </div>
                {errors.detailAddress && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.detailAddress}</span>}
              </div>

            </div>
          </div>

          {/* Vùng hiển thị lỗi submit chung (Nếu có) */}
          {errors.submit && (
            <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] bg-red-50/80 border border-red-100 rounded-xl transition-all">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {errors.submit}
            </div>
          )}

          {/* Nút Đăng ký và Checkbox */}
          <div className="flex flex-col items-center pt-2 space-y-5">
            <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={agreeTerms} onChange={() => { setAgreeTerms(!agreeTerms); setErrors((prev) => ({ ...prev, agreeTerms: "" })); }} className="w-4 h-4 rounded border-gray-300 text-[#C00000] focus:ring-[#C00000] cursor-pointer" />
              <span>
                Tôi đồng ý với <a href="#terms" className="font-bold text-[#C00000] hover:underline">Điều khoản sử dụng</a> và <a href="#privacy" className="font-bold text-[#C00000] hover:underline">Chính sách bảo mật</a>
              </span>
            </label>
            {errors.agreeTerms && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.agreeTerms}</span>}

            <button type="submit" className="w-[70%] bg-[#C00000] text-white font-bold text-sm py-4 rounded-xl hover:bg-[#a00000] active:scale-[0.99] transition-all shadow-md shadow-red-900/10 uppercase tracking-wider">
              Xác nhận Đăng ký
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs font-medium text-gray-400">
          Bạn đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-[#C00000] hover:underline">
            Đăng nhập ngay
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;