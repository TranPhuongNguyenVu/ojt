import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSidebar from '../../components/ProfilePage/ProfileSidebar.jsx';
import UserSummaryCard from '../../components/ProfilePage/UserSummaryCard.jsx';
import PersonalInfoCard from '../../components/ProfilePage/PersonalInfoCard.jsx';
import RewardPointsCard from '../../components/ProfilePage/RewardPointsCard.jsx';
import RecentActivityCard from '../../components/ProfilePage/RecentActivityCard.jsx';
import MyTicketsSection from '../../components/ProfilePage/MyTicketsSection.jsx';
import EditProfileModal from '../../components/ProfilePage/EditProfileModal.jsx';
import CustomerService from '../../services/CustomerService.js';
import BookingService from '../../services/BookingService';
import { Lock } from 'lucide-react';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('account-info');
  const [memberData, setMemberData] = useState(null);

  // States for Points History filter
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [txnFilterType, setTxnFilterType] = useState('ADD'); // 'ADD' or 'SUB'
  const [pointsHistory, setPointsHistory] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const navigate = useNavigate();

  // Change password flow states
  const [changePassForm, setChangePassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [changePassErrors, setChangePassErrors] = useState({});
  const [changePassStep, setChangePassStep] = useState(1);
  const [changePassOtpCode, setChangePassOtpCode] = useState('');
  const [isChangingPassSubmitting, setIsChangingPassSubmitting] = useState(false);

  useEffect(() => {
    setChangePassForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setChangePassErrors({});
    setChangePassStep(1);
    setChangePassOtpCode('');
    setIsChangingPassSubmitting(false);
  }, [activeTab]);

  const handleRequestChangePassword = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (!changePassForm.currentPassword) {
      tempErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại!";
    }
    
    if (!changePassForm.newPassword) {
      tempErrors.newPassword = "Vui lòng nhập mật khẩu mới!";
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(changePassForm.newPassword)) {
        tempErrors.newPassword = "Mật khẩu phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)!";
      }
    }

    if (!changePassForm.confirmNewPassword) {
      tempErrors.confirmNewPassword = "Vui lòng xác nhận mật khẩu mới!";
    } else if (changePassForm.newPassword !== changePassForm.confirmNewPassword) {
      tempErrors.confirmNewPassword = "Mật khẩu xác nhận không khớp!";
    }

    if (Object.keys(tempErrors).length > 0) {
      setChangePassErrors(tempErrors);
      return;
    }

    setChangePassErrors({});
    setIsChangingPassSubmitting(true);

    try {
      await CustomerService.requestChangePassword({
        email: memberData.email,
        currentPassword: changePassForm.currentPassword,
        newPassword: changePassForm.newPassword
      });
      alert("Mã OTP xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
      setChangePassStep(2);
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.message || "Có lỗi xảy ra khi yêu cầu đổi mật khẩu!";
      setChangePassErrors({ general: serverMsg });
    } finally {
      setIsChangingPassSubmitting(false);
    }
  };

  const handleConfirmChangePassword = async (e) => {
    e.preventDefault();
    if (!changePassOtpCode || changePassOtpCode.trim() === "") {
      setChangePassErrors({ otpCode: "Vui lòng nhập mã OTP!" });
      return;
    }

    setChangePassErrors({});
    setIsChangingPassSubmitting(true);

    try {
      await CustomerService.confirmChangePassword({
        email: memberData.email,
        otpCode: changePassOtpCode.trim(),
        newPassword: changePassForm.newPassword
      });
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.");
      
      localStorage.removeItem("USER_LOGIN");
      try {
        await CustomerService.Logout();
      } catch (err) {}
      
      navigate("/login");
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã quá hạn!";
      setChangePassErrors({ otpCode: serverMsg });
    } finally {
      setIsChangingPassSubmitting(false);
    }
  };

  const fetchPointsHistory = () => {
    BookingService.getPointsHistory()
      .then((res) => {
        setPointsHistory(res.data.data || []);
      })
      .catch((err) => {
        console.error("Lỗi lấy lịch sử điểm:", err);
      });
  };

  useEffect(() => {
    if (activeTab === 'points-history') {
      fetchPointsHistory();
      setFilteredPoints([]);
      setHasFiltered(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchMemberProfile = async () => {
      setIsLoading(true);
      try {
        const userLoginStr = localStorage.getItem("USER_LOGIN");
        if (!userLoginStr) {
          navigate("/login");
          return;
        }
        
        const userLogin = JSON.parse(userLoginStr);
        const email = userLogin.email;
        const username = userLogin.username;
        
        const response = await CustomerService.getCustomers();
        const members = response.data.data;
        
        const foundMember = members.find(m => 
          (m.email && m.email.toLowerCase() === email.toLowerCase()) || 
          (m.username && m.username.toLowerCase() === username.toLowerCase())
        );
        
        if (foundMember) {
          setMemberData(foundMember);
        } else {
          // fallback if member details aren't linked correctly
          setMemberData({
            username: userLogin.username,
            fullName: userLogin.fullName,
            email: userLogin.email,
            phoneNumber: userLogin.phoneNumber || '',
            gender: userLogin.gender || 'Nam',
            identityCard: userLogin.identityCard || '',
            address: userLogin.address || '',
            dateOfBirth: userLogin.dateOfBirth || '',
            image: userLogin.image || '',
            score: 0,
            memberId: ''
          });
        }
      } catch (error) {
        console.error("Error fetching member profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemberProfile();
  }, [navigate, activeTab]);

  const handleSave = async (formData) => {
    try {
      if (!memberData?.memberId) {
        throw new Error("Không tìm thấy thông tin Member ID để thực hiện cập nhật!");
      }
      const response = await CustomerService.updateCustomer(memberData.memberId, formData);
      const updatedMember = response.data.data;
      setMemberData(updatedMember);
      
      const userLoginStr = localStorage.getItem("USER_LOGIN");
      if (userLoginStr) {
        const userLogin = JSON.parse(userLoginStr);
        const newUserLogin = {
          ...userLogin,
          username: updatedMember.username,
          fullName: updatedMember.fullName,
          email: updatedMember.email,
          image: updatedMember.image,
          gender: updatedMember.gender,
          phoneNumber: updatedMember.phoneNumber,
          identityCard: updatedMember.identityCard,
          address: updatedMember.address,
          dateOfBirth: updatedMember.dateOfBirth
        };
        localStorage.setItem("USER_LOGIN", JSON.stringify(newUserLogin));
      }
      alert("Update information successfully");
    } catch (error) {
      console.error("Save profile error:", error);
      throw error;
    }
  };
  const handleAvatarChange = async (file) => {
    try {
      if (!memberData?.memberId) {
        alert("Không tìm thấy thông tin thành viên!");
        return;
      }
      
      setIsAvatarUploading(true);
      
      // 1. Upload file lên Cloudinary thông qua BE
      const uploadResponse = await CustomerService.uploadImage(file);
      const imageUrl = uploadResponse.data.data;
      
      // 2. Chuẩn bị dữ liệu cập nhật
      const updateData = {
        username: memberData.username,
        fullName: memberData.fullName,
        dateOfBirth: memberData.dateOfBirth,
        gender: memberData.gender,
        email: memberData.email,
        identityCard: memberData.identityCard,
        phoneNumber: memberData.phoneNumber,
        address: memberData.address,
        image: imageUrl
      };
      
      // 3. Gọi API cập nhật thông tin member
      const response = await CustomerService.updateCustomer(memberData.memberId, updateData);
      const updatedMember = response.data.data;
      
      // 4. Cập nhật state cục bộ và localStorage
      setMemberData(updatedMember);
      const userLoginStr = localStorage.getItem("USER_LOGIN");
      if (userLoginStr) {
        const userLogin = JSON.parse(userLoginStr);
        const newUserLogin = { ...userLogin, image: updatedMember.image };
        localStorage.setItem("USER_LOGIN", JSON.stringify(newUserLogin));
      }
      
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật ảnh đại diện:", error);
      alert(error.response?.data?.message || "Không thể cập nhật ảnh đại diện!");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleViewScore = (e) => {
    e.preventDefault();

    // 1. Kiểm tra định dạng ngày DD/MM/YYYY
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (fromDate && !dateRegex.test(fromDate)) {
      alert("Định dạng ngày bắt đầu không hợp lệ (Yêu cầu: DD/MM/YYYY)!");
      return;
    }
    if (toDate && !dateRegex.test(toDate)) {
      alert("Định dạng ngày kết thúc không hợp lệ (Yêu cầu: DD/MM/YYYY)!");
      return;
    }

    // 2. Chuyển đổi ngày để so sánh
    const parseDateStr = (str) => {
      if (!str) return null;
      const parts = str.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };

    const fromDateObj = parseDateStr(fromDate);
    const toDateObj = parseDateStr(toDate);

    if (fromDateObj && toDateObj && fromDateObj > toDateObj) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
      return;
    }

    // 3. Tiến hành lọc
    const filtered = pointsHistory.filter(tx => {
      if (tx.txnType !== txnFilterType) return false;

      if (tx.date) {
        const txDate = new Date(tx.date);
        const txDateZero = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
        
        if (fromDateObj && txDateZero < fromDateObj) return false;
        if (toDateObj && txDateZero > toDateObj) return false;
      }
      return true;
    });

    setFilteredPoints(filtered);
    setHasFiltered(true);
  };

  // Xử lý các màn hình nội dung khác nhau tùy theo Tab được chọn
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account-info':
        return (
          <div className="space-y-6">
            {/* Header thông tin tài khoản */}
            <UserSummaryCard 
              memberData={memberData} 
              onEditClick={() => setIsEditModalOpen(true)} 
              onAvatarChange={handleAvatarChange} 
              isUploading={isAvatarUploading}
            />

            {/* Chi tiết thông tin cá nhân và điểm thưởng */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalInfoCard memberData={memberData} onEditClick={() => setIsEditModalOpen(true)} />
              <RewardPointsCard memberData={memberData} />
            </div>

            {/* Đổi Mật Khẩu tích hợp */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight flex items-center gap-2">
                  <Lock size={16} className="text-[#C00000]" />
                  Mật khẩu đăng nhập
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bảo vệ tài khoản bằng mật khẩu có tính bảo mật cao</p>
              </div>
              <button
                onClick={() => setActiveTab('change-password')}
                className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                ĐỔI MẬT KHẨU
              </button>
            </div>

            {/* Vé phim đã đặt */}
            <MyTicketsSection tab="booked" />
          </div>
        );
      
      case 'booked-tickets':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6 transition-colors duration-300">
            <MyTicketsSection tab="booked" />
          </div>
        );

      case 'canceled-tickets':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6 transition-colors duration-300">
            <MyTicketsSection tab="canceled" />
          </div>
        );

      case 'points-history':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6 transition-colors duration-300">
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight uppercase">Lịch sử tích/dùng điểm</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Theo dõi lịch sử tích lũy và sử dụng điểm thưởng của bạn.</p>
            </div>

            {/* Bộ lọc điểm */}
            <form onSubmit={handleViewScore} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-150 dark:border-gray-700 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Từ ngày */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Từ ngày (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    placeholder="VD: 01/06/2026"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder-gray-300 dark:placeholder-gray-500 font-semibold"
                  />
                </div>
                {/* Đến ngày */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">Đến ngày (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    placeholder="VD: 30/06/2026"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder-gray-300 dark:placeholder-gray-500 font-semibold"
                  />
                </div>
              </div>

              {/* Radio buttons lọc */}
              <div className="flex flex-wrap gap-6 items-center">
                <label className="flex items-center space-x-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="txnFilterType"
                    checked={txnFilterType === 'ADD'}
                    onChange={() => setTxnFilterType('ADD')}
                    className="text-[#C00000] focus:ring-[#C00000]"
                  />
                  <span>History of Score Adding (Tích điểm)</span>
                </label>
                <label className="flex items-center space-x-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="txnFilterType"
                    checked={txnFilterType === 'SUB'}
                    onChange={() => setTxnFilterType('SUB')}
                    className="text-[#C00000] focus:ring-[#C00000]"
                  />
                  <span>History of Score Using (Dùng điểm)</span>
                </label>
              </div>

              {/* Nút tìm kiếm */}
              <button
                type="submit"
                className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                View Score
              </button>
            </form>

            {/* Bảng hiển thị kết quả */}
            {hasFiltered && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 tracking-widest uppercase">KẾT QUẢ GIAO DỊCH</h4>
                
                {filteredPoints.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                    <table className="w-full text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-150 dark:border-gray-700 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">
                        <tr>
                          <th className="px-5 py-3">Ngày tạo</th>
                          <th className="px-5 py-3">Tên phim</th>
                          <th className="px-5 py-3 text-right">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPoints.map((tx) => {
                          const dateObj = new Date(tx.date);
                          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                          const isAdd = tx.txnType === 'ADD';
                          
                          const getMovieNameFromTitle = (title) => {
                            if (!title) return "Phim";
                            const parts = title.split(': ');
                            if (parts.length > 1) {
                              return parts[1];
                            }
                            return title;
                          };

                          return (
                            <tr key={tx.txnId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                              <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{formattedDate}</td>
                              <td className="px-5 py-4">{getMovieNameFromTitle(tx.title)}</td>
                              <td className={`px-5 py-4 text-right font-black text-sm ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
                                {isAdd ? `+${tx.points}` : `-${tx.points}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl text-center text-amber-700 font-bold text-sm">
                    No score history found for the selected period.
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'change-password':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 max-w-lg mx-auto flex flex-col space-y-6 transition-colors duration-300">
            <div className="flex items-center space-x-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 bg-red-50 text-[#C00000] rounded-xl flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">Đổi mật khẩu</h3>
                <p className="text-[11px] text-gray-400 font-medium">Bảo vệ tài khoản bằng mật khẩu có tính bảo mật cao</p>
              </div>
            </div>

            {changePassStep === 1 ? (
              <form className="space-y-4 text-left" onSubmit={handleRequestChangePassword}>
                
                {changePassErrors.general && (
                  <div className="p-3 text-xs font-semibold text-[#C00000] bg-red-50 rounded-xl border border-red-100">
                    {changePassErrors.general}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">MẬT KHẨU HIỆN TẠI</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={changePassForm.currentPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, currentPassword: e.target.value })}
                    className={`w-full bg-white dark:bg-gray-950 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border dark:border-gray-700 focus:outline-none transition-all placeholder-gray-300 dark:placeholder-gray-500 ${
                      changePassErrors.currentPassword ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {changePassErrors.currentPassword && <span className="text-[11px] font-semibold text-red-500">{changePassErrors.currentPassword}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">MẬT KHẨU MỚI</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={changePassForm.newPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                    className={`w-full bg-white dark:bg-gray-950 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border dark:border-gray-700 focus:outline-none transition-all placeholder-gray-300 dark:placeholder-gray-500 ${
                      changePassErrors.newPassword ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {changePassErrors.newPassword && <span className="text-[11px] font-semibold text-red-500 leading-tight block">{changePassErrors.newPassword}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">XÁC NHẬN MẬT KHẨU MỚI</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={changePassForm.confirmNewPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, confirmNewPassword: e.target.value })}
                    className={`w-full bg-white dark:bg-gray-950 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border dark:border-gray-700 focus:outline-none transition-all placeholder-gray-300 dark:placeholder-gray-500 ${
                      changePassErrors.confirmNewPassword ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {changePassErrors.confirmNewPassword && <span className="text-[11px] font-semibold text-red-500">{changePassErrors.confirmNewPassword}</span>}
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isChangingPassSubmitting}
                    className="bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md shadow-red-950/10 uppercase tracking-wider disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    {isChangingPassSubmitting ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4 text-left" onSubmit={handleConfirmChangePassword}>
                
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">XÁC THỰC MẬT KHẨU</h4>
                  <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    Hệ thống đã gửi một mã xác thực OTP gồm 6 chữ số đến địa chỉ email <span className="font-bold text-gray-800 dark:text-gray-200">{memberData?.email}</span>. Vui lòng nhập mã OTP để hoàn tất.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">MÃ XÁC THỰC OTP</label>
                  <input
                    type="text"
                    placeholder="Nhập 6 chữ số OTP..."
                    value={changePassOtpCode}
                    onChange={(e) => setChangePassOtpCode(e.target.value)}
                    className={`w-full bg-white dark:bg-gray-950 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border dark:border-gray-700 focus:outline-none transition-all placeholder-gray-300 dark:placeholder-gray-500 text-center tracking-widest font-black ${
                      changePassErrors.otpCode ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                  {changePassErrors.otpCode && <span className="text-[11px] font-semibold text-red-500">{changePassErrors.otpCode}</span>}
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button 
                    type="submit" 
                    disabled={isChangingPassSubmitting}
                    className="bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md shadow-red-950/10 uppercase tracking-wider disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    {isChangingPassSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePassStep(1);
                      setChangePassOtpCode('');
                      setChangePassErrors({});
                    }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-black px-6 py-3 rounded-xl transition-all"
                  >
                    QUAY LẠI
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50/50 dark:bg-transparent flex items-center justify-center font-sans transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#C00000] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 dark:bg-transparent py-10 px-4 md:px-8 lg:px-16 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Sidebar điều hướng trái */}
        <div className="flex-shrink-0">
          <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>

      </div>

      {/* Modal Chỉnh sửa hồ sơ */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        memberData={memberData}
        onSave={handleSave}
      />
    </div>
  );
};

export default ProfilePage;
