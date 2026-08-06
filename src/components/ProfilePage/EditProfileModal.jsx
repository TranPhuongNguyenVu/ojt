import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, CreditCard, Calendar, MapPin } from 'lucide-react';

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

const EditProfileModal = ({ isOpen, onClose, memberData, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    email: '',
    identityCard: '',
    phoneNumber: '',
    province: '',
    district: '',
    detailAddress: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền và phân tách dữ liệu địa chỉ khi mở Modal
  useEffect(() => {
    if (memberData) {
      let prov = '';
      let dist = '';
      let det = '';
      
      const addr = memberData.address || '';
      const parts = addr.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        prov = parts[parts.length - 1];
        dist = parts[parts.length - 2];
        det = parts.slice(0, parts.length - 2).join(', ');
      } else {
        det = addr;
      }
      
      if (locationData[prov]) {
        if (!locationData[prov].includes(dist)) {
          dist = '';
        }
      } else {
        prov = '';
        dist = '';
        det = addr;
      }

      setFormData({
        username: memberData.username || '',
        fullName: memberData.fullName || '',
        dateOfBirth: memberData.dateOfBirth || '',
        gender: memberData.gender || 'Nam',
        email: memberData.email || '',
        identityCard: memberData.identityCard || '',
        phoneNumber: memberData.phoneNumber || '',
        province: prov,
        district: dist,
        detailAddress: det,
      });
      setErrors({});
    }
  }, [memberData, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const tempErrors = {};
    
    // 1. Họ và tên
    if (!formData.fullName || formData.fullName.trim() === '') {
      tempErrors.fullName = 'Họ và tên không được để trống!';
    } else {
      const fullNameRegex = /^[\p{L}\s]+$/u;
      if (!fullNameRegex.test(formData.fullName.trim())) {
        tempErrors.fullName = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.';
      }
    }

    // 2. Ngày sinh (Phải từ 18 tuổi trở lên)
    if (!formData.dateOfBirth) {
      tempErrors.dateOfBirth = 'Vui lòng chọn ngày sinh!';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (isNaN(dob.getTime()) || dob > today) {
        tempErrors.dateOfBirth = 'Ngày sinh không hợp lệ!';
      } else if (age < 18) {
        tempErrors.dateOfBirth = 'Thành viên phải từ 18 tuổi trở lên.';
      }
    }

    // 3. Số điện thoại
    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      tempErrors.phoneNumber = 'Vui lòng nhập số điện thoại!';
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        tempErrors.phoneNumber = 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 số.';
      }
    }

    // 4. Địa chỉ chi tiết, tỉnh, huyện
    if (!formData.province || formData.province.trim() === '') {
      tempErrors.province = 'Vui lòng chọn Tỉnh/Thành phố!';
    }
    if (!formData.district || formData.district.trim() === '') {
      tempErrors.district = 'Vui lòng chọn Quận/Huyện!';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Ghép địa chỉ giống đăng ký
    const addressParts = [];
    if (formData.detailAddress?.trim()) addressParts.push(formData.detailAddress.trim());
    if (formData.district?.trim()) addressParts.push(formData.district.trim());
    if (formData.province?.trim()) addressParts.push(formData.province.trim());
    const submitData = {
      username: formData.username,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      email: formData.email,
      identityCard: formData.identityCard,
      phoneNumber: formData.phoneNumber,
      address: addressParts.join(', '),
      image: memberData?.image || '', // Giữ nguyên link ảnh cũ
    };

    setIsSubmitting(true);
    try {
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!';
      
      // Map lỗi trùng lặp từ server về đúng ô input
      if (serverMsg.includes('Số điện thoại đã được sử dụng') || serverMsg.includes('Số điện thoại đã tồn tại')) {
        setErrors(prev => ({ ...prev, phoneNumber: 'Số điện thoại đã được sử dụng!' }));
      } else {
        alert(serverMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-black text-gray-900 tracking-tight">Chỉnh sửa thông tin tài khoản</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form className="flex-1 overflow-y-auto p-6 space-y-4 text-left" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Tên đăng nhập (Khóa lại) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">TÊN ĐĂNG NHẬP (KHÓA)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={formData.username}
                  disabled={true}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Họ và tên */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">HỌ VÀ TÊN *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className={`w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 rounded-xl border dark:border-gray-700 focus:outline-none transition-all ${
                    errors.fullName ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              {errors.fullName && <span className="text-[11px] font-semibold text-red-500">{errors.fullName}</span>}
            </div>

            {/* 3. Ngày sinh */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">NGÀY SINH *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Calendar size={15} />
                </span>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={`w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 rounded-xl border dark:border-gray-700 focus:outline-none transition-all ${
                    errors.dateOfBirth ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              {errors.dateOfBirth && <span className="text-[11px] font-semibold text-red-500">{errors.dateOfBirth}</span>}
            </div>

            {/* 4. Giới tính */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">GIỚI TÍNH *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-all cursor-pointer"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* 5. Email (Khóa lại) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">EMAIL (KHÓA)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* 6. CMND/CCCD (Khóa lại) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">CMND/CCCD (KHÓA)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CreditCard size={15} />
                </span>
                <input
                  type="text"
                  value={formData.identityCard}
                  disabled={true}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* 7. Số điện thoại */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">SỐ ĐIỆN THOẠI *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone size={15} />
                </span>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  className={`w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 rounded-xl border dark:border-gray-700 focus:outline-none transition-all ${
                    errors.phoneNumber ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              {errors.phoneNumber && <span className="text-[11px] font-semibold text-red-500">{errors.phoneNumber}</span>}
            </div>

            {/* 8. Tỉnh / Thành phố */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">TỈNH / THÀNH PHỐ *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={15} />
                </span>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value, district: '' })}
                  className={`w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 rounded-xl border dark:border-gray-700 focus:outline-none transition-all appearance-none cursor-pointer ${
                    errors.province ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                >
                  <option value="">Chọn Tỉnh/Thành...</option>
                  {Object.keys(locationData).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {errors.province && <span className="text-[11px] font-semibold text-red-500">{errors.province}</span>}
            </div>

            {/* 9. Quận / Huyện */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">QUẬN / HUYỆN *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={15} />
                </span>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  disabled={!formData.province}
                  className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all appearance-none cursor-pointer ${
                    !formData.province ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-800'
                  } ${
                    errors.district ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                >
                  <option value="">Chọn Quận/Huyện...</option>
                  {formData.province && locationData[formData.province].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {errors.district && <span className="text-[11px] font-semibold text-red-500">{errors.district}</span>}
            </div>

            {/* 10. Địa chỉ chi tiết */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">ĐỊA CHỈ CHI TIẾT</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={15} />
                </span>
                <input
                  type="text"
                  value={formData.detailAddress}
                  onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                  placeholder="Số nhà, tên đường, phường/xã... (có thể cập nhật sau)"
                  className={`w-full bg-white dark:bg-gray-950 text-xs text-gray-800 dark:text-gray-200 pl-9 pr-4 py-2.5 rounded-xl border dark:border-gray-700 focus:outline-none transition-all ${
                    errors.detailAddress ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              {errors.detailAddress && <span className="text-[11px] font-semibold text-red-500">{errors.detailAddress}</span>}
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-2.5 pt-4 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-black px-5 py-2.5 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-red-950/10 transition-all disabled:bg-gray-300"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EditProfileModal;
