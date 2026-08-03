import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
// Import hình nền và Service (Sếp nhớ check lại đường dẫn cho chuẩn nhé)
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hứng cái Email mà trang Register vừa truyền sang
  const email = location.state?.email;

  // Nếu khách hàng lách luật gõ URL thẳng vào trang này thì đá về trang Register
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Trạng thái (State)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 600 giây = 10 phút
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Trạng thái đổi mật khẩu khi đăng nhập lần đầu
  const requirePasswordChange = location.state?.requirePasswordChange;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  
  // Dùng Ref để điều khiển con trỏ chuột nhảy tự động giữa 6 ô
  const inputRefs = useRef([]);

  // ================= LÕI XỬ LÝ ĐỒNG HỒ ĐẾM NGƯỢC =================
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId); // Xóa đồng hồ khi tắt trang
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ================= LÕI XỬ LÝ 6 Ô VUÔNG =================
  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Cấm nhập chữ, chỉ cho nhập số
    
    const newOtp = [...otp];
    // Chỉ lấy 1 số cuối cùng (Đề phòng khách dán nguyên chuỗi dài)
    newOtp[index] = value.substring(value.length - 1); 
    setOtp(newOtp);
    setErrorMessage(''); // Đang nhập thì tắt báo lỗi đi

    // Nhập xong 1 số thì tự động đẩy con trỏ chuột sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Bấm nút Xóa (Backspace) mà ô hiện tại đang trống thì lùi con trỏ về ô trước
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ================= LÕI GỌI API XÁC THỰC =================
  const handleVerify = async () => {
    const otpCode = otp.join(''); // Ghép 6 ô lại thành 1 chuỗi 6 số
    
    if (otpCode.length < 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    // Nếu là tài khoản do Admin tạo (cần đổi mật khẩu) và chưa được check OTP
    if (requirePasswordChange && !isOtpVerified) {
      setIsVerifying(true);
      setErrorMessage('');
      try {
        await CustomerService.checkOtp(email, otpCode);
        setIsOtpVerified(true);
        alert('Mã OTP chính xác! Vui lòng nhập mật khẩu mới để hoàn tất kích hoạt tài khoản.');
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data || "Xác thực OTP thất bại, vui lòng thử lại!";
        setErrorMessage(msg);
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    // Nếu đã check OTP thành công và giờ là lúc đổi mật khẩu
    if (requirePasswordChange && isOtpVerified) {
      if (!newPassword || !confirmPassword) {
        setErrorMessage('Vui lòng điền đầy đủ thông tin mật khẩu mới.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
      }

      setIsVerifying(true);
      setErrorMessage('');
      try {
        await CustomerService.verifyAndChangePassword(email, otpCode, newPassword);
        alert('Tuyệt vời! Xác thực tài khoản và đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
        navigate('/login');
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data || "Cập nhật mật khẩu thất bại, vui lòng thử lại!";
        setErrorMessage(msg);
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Trường hợp tự đăng ký (chỉ xác thực OTP)
      setIsVerifying(true);
      setErrorMessage('');
      try {
        await CustomerService.verifyOtp(email, otpCode); 
        alert('Tuyệt vời! Xác thực tài khoản thành công! Bạn có thể Đăng nhập ngay.');
        navigate('/login');
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data || "Xác thực thất bại, vui lòng thử lại!";
        setErrorMessage(msg);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  // Đề phòng trường hợp chưa có Email
  if (!email) return null;

  // ================= GIAO DIỆN UI =================
  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-12 font-sans"
      style={{ backgroundImage: `url(${bgHero})` }}
    >
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 flex flex-col items-center">

        {/* Icon Bảo mật */}
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={32} className="text-[#C00000] dark:text-[#E50914]" strokeWidth={2} />
        </div>

        <div className="text-center space-y-3 mb-8 w-full">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Xác thực Email</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">
            Chúng tôi vừa gửi một mã OTP gồm 6 chữ số đến email: <br/>
            <span className="text-[#C00000] dark:text-[#E50914] font-bold">{email}</span>
          </p>
        </div>

        {/* Khối chứa 6 ô vuông nhập số */}
        <div className="flex justify-between w-full mb-6 gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric" // Gọi bàn phím số trên Mobile
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={timeLeft === 0 || isVerifying || isOtpVerified}
              className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800 transition-all
                ${digit ? 'border-[#C00000] dark:border-[#E50914] ring-[#C00000]/20 dark:ring-[#E50914]/20' : 'border-gray-200 dark:border-gray-700 focus:ring-[#C00000]/50 dark:focus:ring-[#E50914]/50 focus:border-[#C00000] dark:focus:border-[#E50914]'}
              `}
            />
          ))}
        </div>

        {/* Đổi mật khẩu lần đầu (chỉ hiển thị nếu đã xác thực OTP thành công) */}
        {requirePasswordChange && isOtpVerified && (
          <div className="w-full space-y-4 mb-6 transition-all duration-300">
            <div className="space-y-1.5 text-left w-full">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">MẬT KHẨU MỚI</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(""); }}
                placeholder="Nhập mật khẩu mới..."
                className="w-full bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
              />
            </div>
            <div className="space-y-1.5 text-left w-full">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">XÁC NHẬN MẬT KHẨU MỚI</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(""); }}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
              />
            </div>
          </div>
        )}

        {/* Khối hiển thị Lỗi */}
        {errorMessage && (
          <div className="w-full flex items-center p-3 mb-6 text-[13px] font-semibold text-[#C00000] dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Khối Đồng hồ đếm ngược */}
        <div className="flex items-center justify-center w-full mb-8">
          <span className={`font-mono text-xl font-bold tracking-widest ${timeLeft > 60 ? 'text-gray-700 dark:text-gray-300' : 'text-[#C00000] dark:text-[#E50914] animate-pulse'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Nút Xác nhận */}
        <button
          onClick={handleVerify}
          disabled={timeLeft === 0 || isVerifying}
          className={`w-full font-bold text-sm py-4 rounded-xl transition-all shadow-lg uppercase tracking-wider
            ${(timeLeft === 0 || isVerifying)
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#C00000] dark:bg-[#E50914] text-white hover:bg-[#a00000] dark:hover:bg-[#ff1a25] active:scale-[0.99] shadow-red-900/20'
            }`}
        >
          {isVerifying
            ? 'Đang xử lý...'
            : (requirePasswordChange && isOtpVerified)
              ? 'Đặt mật khẩu mới'
              : 'Xác nhận mã OTP'
          }
        </button>

        {/* Chân trang: Nút Quay lại & Gửi lại mã */}
        <div className="w-full flex justify-between items-center mt-8 text-sm font-semibold">
          <button onClick={() => navigate('/register')} className="flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Quay lại
          </button>

          <button
            disabled={timeLeft > 0}
            className={`flex items-center transition-colors ${timeLeft > 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-[#C00000] dark:text-[#E50914] hover:underline'}`}
          >
            <RefreshCw size={14} className="mr-1.5" /> Gửi lại mã
          </button>
        </div>

      </div>
    </div>
  );
};

export default OtpVerificationPage;