import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const ConfirmEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const registeredEmail = location.state?.email;
  const requirePasswordChange = location.state?.requirePasswordChange;

  useEffect(() => {
    if (!registeredEmail) {
      navigate('/login');
    }
  }, [registeredEmail, navigate]);

  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!emailInput) {
      setErrorMessage("Vui lòng nhập email đăng ký.");
      return;
    }

    if (emailInput.trim().toLowerCase() !== registeredEmail.toLowerCase()) {
      setErrorMessage("Email xác nhận không khớp với email đăng ký tài khoản!");
      return;
    }

    setIsSending(true);
    try {
      await CustomerService.checkEmail(emailInput.trim());
      navigate('/verify-otp', { state: { email: emailInput.trim(), requirePasswordChange } });
    } catch (error) {
      const msg = error.response?.data?.message || "Không thể gửi OTP, vui lòng thử lại!";
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (!registeredEmail) return null;

  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-12 font-sans"
      style={{ backgroundImage: `url(${bgHero})` }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 flex flex-col items-center">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Xác thực tài khoản</h2>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            Vui lòng nhập lại email đăng ký của bạn để nhận mã xác thực OTP
          </p>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          
          <div className="space-y-1.5 w-full text-left">
            <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">EMAIL ĐĂNG KÝ</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={16} strokeWidth={2} />
              </span>
              <input
                type="email"
                value={emailInput} 
                onChange={(e) => { setEmailInput(e.target.value); setErrorMessage(""); }} 
                placeholder="Nhập email..."
                className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] bg-red-50/80 border border-red-100 rounded-xl transition-all w-full">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSending}
              className="w-full bg-[#C00000] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#a00000] active:scale-[0.99] transition-all shadow-md shadow-red-900/10 uppercase tracking-wider disabled:bg-gray-300"
            >
              {isSending ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-xs font-medium text-gray-400">
          <button onClick={() => navigate('/login')} className="flex items-center text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Quay lại đăng nhập
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmEmailPage;
