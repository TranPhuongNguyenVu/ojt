import React, { useEffect, useState, useRef } from "react";
import {
  UserCircle, Camera, Save, Lock, Eye, EyeOff, CheckCircle2, AlertCircle
} from "lucide-react";
import SystemAdminService from "../../../services/SystemAdminService";
import CustomerService from "../../../services/CustomerService";

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

const parseAddress = (fullAddress) => {
  if (!fullAddress) {
    return { province: "", district: "", detailAddress: "" };
  }
  const parts = fullAddress.split(",").map(p => p.trim());
  if (parts.length >= 3) {
    const province = parts[parts.length - 1];
    const district = parts[parts.length - 2];
    const detailAddress = parts.slice(0, parts.length - 2).join(", ");
    return { province, district, detailAddress };
  }
  return { province: "", district: "", detailAddress: fullAddress };
};

const getFullAddress = (form) => {
  const parts = [];
  if (form.detailAddress && form.detailAddress.trim()) parts.push(form.detailAddress.trim());
  if (form.district && form.district.trim()) parts.push(form.district.trim());
  if (form.province && form.province.trim()) parts.push(form.province.trim());
  return parts.join(", ");
};


// ─── Reusable alert banner ────────────────────────────────────────────────────
const Alert = ({ type, message, onClose }) => {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg text-sm mb-4 ${isSuccess ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/30" : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-500/30"}`}>
      {isSuccess ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 text-xs">✕</button>
    </div>
  );
};

const inputCls = "w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-[#4CC9F0]/40 transition bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-[#10131A]";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-white/45 uppercase tracking-wider mb-1";

// ─── Main component ───────────────────────────────────────────────────────────
const AdminProfile = () => {
  const [profile, setProfile]           = useState(null);
  const [isLoading, setIsLoading]       = useState(true);

  // Profile form
  const [profileForm, setProfileForm]   = useState({});
  const [profileAlert, setProfileAlert] = useState({ type: "", msg: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setProfileAlert({ type: "", msg: "" });
    try {
      // 1. Tải ảnh lên Cloudinary
      const res = await CustomerService.uploadImage(file);
      const imageUrl = res.data.data;
      
      // 2. Cập nhật state cục bộ
      setProfileForm(prev => ({ ...prev, image: imageUrl }));
      
      // 3. Tự động lưu luôn vào database để tránh mất khi reload trang
      const updatedForm = {
        fullName: profileForm.fullName || "",
        email: profileForm.email || "",
        phoneNumber: profileForm.phoneNumber || "",
        gender: profileForm.gender || "",
        dateOfBirth: profileForm.dateOfBirth || null,
        image: imageUrl,
        province: profileForm.province || "",
        district: profileForm.district || "",
        detailAddress: profileForm.detailAddress || "",
      };
      const submitData = {
        fullName: updatedForm.fullName,
        email: updatedForm.email,
        phoneNumber: updatedForm.phoneNumber,
        gender: updatedForm.gender,
        dateOfBirth: updatedForm.dateOfBirth,
        image: imageUrl,
        address: getFullAddress(updatedForm),
      };
      await SystemAdminService.updateMyProfile(submitData);
      
      // 4. Đồng bộ hóa localStorage và phát event update
      const localUser = JSON.parse(localStorage.getItem('USER_LOGIN') || '{}');
      const updatedUser = { ...localUser, image: imageUrl };
      localStorage.setItem('USER_LOGIN', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('profile-update'));
      
      setProfileAlert({ type: "success", msg: "Cập nhật ảnh đại diện thành công!" });
    } catch (err) {
      setProfileAlert({ type: "error", msg: err.response?.data?.message || "Tải ảnh và lưu thất bại." });
    } finally {
      setIsUploading(false);
    }
  };

  // Password form
  const [pwForm, setPwForm]             = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwAlert, setPwAlert]           = useState({ type: "", msg: "" });
  const [savingPw, setSavingPw]         = useState(false);
  const [showPw, setShowPw]             = useState({ current: false, next: false, confirm: false });

  // ─── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await SystemAdminService.getMyProfile();
      const data = res.data.data;
      setProfile(data);
      const parsedAddr = parseAddress(data.address || "");
      setProfileForm({
        fullName:    data.fullName    || "",
        email:       data.email       || "",
        phoneNumber: data.phoneNumber || "",
        gender:      data.gender      || "",
        dateOfBirth: data.dateOfBirth || "",
        image:       data.image       || "",
        province:    parsedAddr.province,
        district:    parsedAddr.district,
        detailAddress: parsedAddr.detailAddress,
      });
      // Cập nhật lại thông tin trong localStorage để đồng bộ sidebar ngay lập tức
      const localUser = JSON.parse(localStorage.getItem('USER_LOGIN') || '{}');
      const updatedUser = { ...localUser, ...data };
      localStorage.setItem('USER_LOGIN', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('profile-update'));
    } catch (_) {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ─── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName || !profileForm.email) {
      setProfileAlert({ type: "error", msg: "Vui lòng nhập đầy đủ Họ tên và Email." }); return;
    }
    setSavingProfile(true);
    setProfileAlert({ type: "", msg: "" });
    try {
      const submitData = {
        fullName:    profileForm.fullName,
        email:       profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        gender:      profileForm.gender,
        dateOfBirth: profileForm.dateOfBirth,
        image:       profileForm.image,
        address:     getFullAddress(profileForm),
      };
      await SystemAdminService.updateMyProfile(submitData);
      setProfileAlert({ type: "success", msg: "Cập nhật thông tin thành công!" });
      fetchProfile();
    } catch (err) {
      setProfileAlert({ type: "error", msg: err.response?.data?.message || "Cập nhật thất bại." });
    } finally { setSavingProfile(false); }
  };

  // ─── Change password ───────────────────────────────────────────────────────
  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwAlert({ type: "error", msg: "Vui lòng điền đầy đủ tất cả các trường." }); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwAlert({ type: "error", msg: "Mật khẩu mới và xác nhận mật khẩu không khớp." }); return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(pwForm.newPassword)) {
      setPwAlert({ type: "error", msg: "Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!" });
      return;
    }
    setSavingPw(true);
    setPwAlert({ type: "", msg: "" });
    try {
      await SystemAdminService.changeMyPassword(pwForm.currentPassword, pwForm.newPassword);
      setPwAlert({ type: "success", msg: "Đổi mật khẩu thành công!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwAlert({ type: "error", msg: err.response?.data?.message || "Đổi mật khẩu thất bại." });
    } finally { setSavingPw(false); }
  };

  const pfc = (key, val) => setProfileForm(prev => ({ ...prev, [key]: val }));
  const ppc = (key, val) => setPwForm(prev => ({ ...prev, [key]: val }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Đang tải thông tin...</div>;
  }

  const roleLabel = {
    Admin: "Quản trị viên",
    SystemAdmin: "Quản trị hệ thống",
    Employee: "Nhân viên",
    Customer: "Khách hàng",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile header card */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 flex items-center gap-6 text-white shadow-lg">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-white/20 flex items-center justify-center relative">
            {profileForm.image ? (
              <img
                src={profileForm.image}
                alt="Avatar"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : ''}`}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <UserCircle size={44} className="text-white/70" />
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className={`absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md transition-all ${
              isUploading ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
            }`}
            title="Tải ảnh lên"
          >
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold">{profile?.fullName || "—"}</h3>
          <p className="text-indigo-200 text-sm">@{profile?.username}</p>
          <span className="mt-1 inline-block px-3 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
            {roleLabel[profile?.roleName] || profile?.roleName}
          </span>
        </div>
      </div>

      {/* ─── Profile form ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <UserCircle size={18} className="text-indigo-500 dark:text-[#4CC9F0]" />
          Chỉnh sửa thông tin
        </h3>

        <Alert type={profileAlert.type} message={profileAlert.msg} onClose={() => setProfileAlert({ type: "", msg: "" })} />

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
              <input className={inputCls} value={profileForm.fullName} onChange={e => pfc("fullName", e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className={labelCls}>Tên đăng nhập</label>
              <input className={inputCls + " cursor-not-allowed opacity-60"} value={profile?.username || ""} disabled />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-red-500">*</span></label>
              <input className={inputCls} type="email" value={profileForm.email} onChange={e => pfc("email", e.target.value)} placeholder="example@email.com" />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input className={inputCls} value={profileForm.phoneNumber} onChange={e => pfc("phoneNumber", e.target.value)} placeholder="09xxxxxxxx" />
            </div>
            <div>
              <label className={labelCls}>Giới tính</label>
              <select className={inputCls} value={profileForm.gender} onChange={e => pfc("gender", e.target.value)}>
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Ngày sinh</label>
              <input className={inputCls} type="date" value={profileForm.dateOfBirth} onChange={e => pfc("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Tỉnh / Thành phố</label>
              <select 
                id="profile-province"
                className={inputCls} 
                value={profileForm.province || ""} 
                onChange={e => {
                  pfc("province", e.target.value);
                  pfc("district", "");
                }}
              >
                <option value="">Chọn Tỉnh/Thành...</option>
                {Object.keys(locationData).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quận / Huyện</label>
              <select 
                id="profile-district"
                className={inputCls} 
                value={profileForm.district || ""} 
                onChange={e => pfc("district", e.target.value)}
                disabled={!profileForm.province}
              >
                <option value="">Chọn Quận/Huyện...</option>
                {profileForm.province && locationData[profileForm.province]?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Địa chỉ chi tiết</label>
              <input 
                id="profile-detailAddress"
                className={inputCls} 
                value={profileForm.detailAddress || ""} 
                onChange={e => pfc("detailAddress", e.target.value)} 
                placeholder="Số nhà, tên đường, phường/xã..." 
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              id="btn-save-profile"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              <Save size={16} />
              {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Change password ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <Lock size={18} className="text-indigo-500 dark:text-[#4CC9F0]" />
          Đổi mật khẩu
        </h3>

        <Alert type={pwAlert.type} message={pwAlert.msg} onClose={() => setPwAlert({ type: "", msg: "" })} />

        <form onSubmit={handleChangePw} className="space-y-4 max-w-md">
          {[
            { key: "currentPassword", label: "Mật khẩu hiện tại", showKey: "current" },
            { key: "newPassword",     label: "Mật khẩu mới",      showKey: "next"    },
            { key: "confirmPassword", label: "Xác nhận mật khẩu", showKey: "confirm" },
          ].map(({ key, label, showKey }) => (
            <div key={key}>
              <label className={labelCls}>{label} <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id={`pw-${key}`}
                  className={inputCls + " pr-10"}
                  type={showPw[showKey] ? "text" : "password"}
                  value={pwForm[key]}
                  onChange={e => ppc(key, e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70"
                >
                  {showPw[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400">Mật khẩu mới phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).</p>

          <button
            type="submit"
            disabled={savingPw}
            id="btn-change-password"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            <Lock size={16} />
            {savingPw ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
