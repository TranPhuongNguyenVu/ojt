import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP, 3: Nhập mật khẩu mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 600 giây = 10 phút
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // ================= ĐỒNG HỒ ĐẾM NGƯỢC (chạy khi ở Bước 2) =================
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ================= LÕI XỬ LÝ 6 Ô VUÔNG OTP =================
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;

    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6 - index);
      if (!digits) return;
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => { newOtp[index + i] = digit; });
      setOtp(newOtp);
      setErrorMessage('');
      inputRefs.current[Math.min(index + digits.length, 5)].focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Cho phép dán (Ctrl+V) nguyên mã OTP 6 số vào bất kỳ ô nào
  const handleOtpPaste = (index, e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6 - index);
    if (!pasteData) return;

    const newOtp = [...otp];
    pasteData.split('').forEach((digit, i) => { newOtp[index + i] = digit; });
    setOtp(newOtp);
    setErrorMessage('');
    inputRefs.current[Math.min(index + pasteData.length, 5)].focus();
  };

  // BƯỚC 1: Gửi OTP xác thực tới Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      return;
    }

    setIsLoading(true);
    try {
      await CustomerService.forgotPassword(email.trim());
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(600);
      setStep(2); // Thành công -> Chuyển sang bước 2 nhập OTP
    } catch (error) {
      const msg = error.response?.data?.message || "Không tìm thấy tài khoản gắn với Email này!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await CustomerService.forgotPassword(email.trim());
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(600);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const msg = error.response?.data?.message || "Gửi lại mã OTP thất bại, vui lòng thử lại!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 2: Xác minh mã OTP (chưa cập nhật pass)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await CustomerService.verifyForgotOtp(email.trim(), otpCode);
      setStep(3); // OTP chính xác -> Chuyển sang bước 3 đặt mật khẩu mới
    } catch (error) {
      const msg = error.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin mật khẩu mới.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMessage('Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!');
      return;
    }

    setIsLoading(true);
    try {
      await CustomerService.resetPassword({
        email: email.trim(),
        otpCode: otp.join(''),
        newPassword: newPassword
      });
      alert('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-12 font-sans"
      style={{ backgroundImage: `url(${bgHero})` }}
    >
      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10 flex flex-col items-center">

        {/* Tiêu đề & Icon bảo mật */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-[#C00000] dark:text-[#E50914]" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Quên mật khẩu</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            {step === 1 && "Nhập email của bạn để nhận mã OTP khôi phục mật khẩu"}
            {step === 2 && `Nhập mã OTP 6 chữ số đã được gửi tới email: ${email}`}
            {step === 3 && "Mã OTP chính xác! Vui lòng thiết lập mật khẩu mới của bạn"}
          </p>
        </div>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <form className="w-full space-y-5" onSubmit={handleSendOtp}>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">EMAIL ĐĂNG KÝ</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Mail size={16} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                  placeholder="Nhập email..."
                  className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] dark:text-red-300 bg-red-50/80 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl transition-all">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C00000] dark:bg-[#E50914] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] active:scale-[0.99] transition-all shadow-md shadow-red-900/10 disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {isLoading ? 'Đang gửi mã...' : 'Gửi mã OTP'}
              </button>
            </div>
          </form>
        )}

        {/* BƯỚC 2: XÁC MINH MÃ OTP */}
        {step === 2 && (
          <form className="w-full space-y-5" onSubmit={handleVerifyOtp}>
            {/* Khối chứa 6 ô vuông nhập số */}
            <div className="flex justify-between w-full gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={(e) => handleOtpPaste(index, e)}
                  disabled={timeLeft === 0 || isLoading}
                  className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800 transition-all
                    ${digit ? 'border-[#C00000] dark:border-[#E50914] ring-[#C00000]/20 dark:ring-[#E50914]/20' : 'border-gray-200 dark:border-gray-700 focus:ring-[#C00000]/50 dark:focus:ring-[#E50914]/50 focus:border-[#C00000] dark:focus:border-[#E50914]'}
                  `}
                />
              ))}
            </div>

            {errorMessage && (
              <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] dark:text-red-300 bg-red-50/80 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl transition-all">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Đồng hồ đếm ngược */}
            <div className="flex items-center justify-center w-full">
              <span className={`font-mono text-xl font-bold tracking-widest ${timeLeft > 60 ? 'text-gray-700 dark:text-gray-300' : 'text-[#C00000] dark:text-[#E50914] animate-pulse'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || timeLeft === 0}
                className="w-full bg-[#C00000] dark:bg-[#E50914] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] active:scale-[0.99] transition-all shadow-md shadow-red-900/10 disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {isLoading ? 'Đang xác minh...' : 'Xác minh mã OTP'}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timeLeft > 0 || isLoading}
                className={`flex items-center text-sm font-semibold transition-colors ${timeLeft > 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-[#C00000] dark:text-[#E50914] hover:underline'}`}
              >
                <RefreshCw size={14} className="mr-1.5" /> Gửi lại mã
              </button>
            </div>
          </form>
        )}

        {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
        {step === 3 && (
          <form className="w-full space-y-5" onSubmit={handleResetPassword}>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">MẬT KHẨU MỚI</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(""); }}
                  placeholder="Mật khẩu mới..."
                  className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">XÁC NHẬN MẬT KHẨU</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Lock size={16} strokeWidth={2} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(""); }}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] dark:text-red-300 bg-red-50/80 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl transition-all">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C00000] dark:bg-[#E50914] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] active:scale-[0.99] transition-all shadow-md shadow-red-900/10 disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {isLoading ? 'Đang đặt lại...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}

        {/* Nút quay lại điều hướng */}
        <div className="mt-8 text-xs font-medium text-gray-400 dark:text-gray-500">
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                setStep(1);
                setErrorMessage('');
              } else if (step === 3) {
                setStep(2);
                setErrorMessage('');
              } else {
                navigate('/login');
              }
            }}
            className="flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            {step === 1 && 'Quay lại đăng nhập'}
            {step === 2 && 'Quay lại nhập Email'}
            {step === 3 && 'Quay lại nhập OTP'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
