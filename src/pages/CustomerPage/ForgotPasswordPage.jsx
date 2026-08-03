import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP, 3: Nhập mật khẩu mới
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

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
      setStep(2); // Thành công -> Chuyển sang bước 2 nhập OTP
    } catch (error) {
      const msg = error.response?.data?.message || "Không tìm thấy tài khoản gắn với Email này!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 2: Xác minh mã OTP (chưa cập nhật pass)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode) {
      setErrorMessage('Vui lòng nhập mã OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await CustomerService.verifyForgotOtp(email.trim(), otpCode.trim());
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
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await CustomerService.resetPassword({
        email: email.trim(),
        otpCode: otpCode.trim(),
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
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block">MÃ XÁC THỰC OTP</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value); setErrorMessage(""); }}
                placeholder="Nhập 6 số OTP..."
                maxLength={6}
                className="w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500 tracking-widest text-center font-bold text-lg"
              />
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
                {isLoading ? 'Đang xác minh...' : 'Xác minh mã OTP'}
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
