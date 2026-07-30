import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { Mail, Lock } from 'lucide-react'; 
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // 1. Khai báo 1 cái "túi" để hứng câu chữ thông báo lỗi
  const [errorMessage, setErrorMessage] = useState(""); 
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Xóa sạch câu lỗi cũ mỗi lần bấm Đăng nhập lại
    
   try {
    const response = await CustomerService.Login(username, password);
    const account = response.data.data.account;
    const role = account.roleName;

    // Log kiểm tra theo yêu cầu
    console.log("Login Success Account Data:", account);
    console.log("Account status:", account.status);
    console.log("Account createdBy:", account.createdBy);

    if (account.status === 0) {
        // Chưa active -> Điều hướng tới trang OTP
        const email = account.email;
        const requirePasswordChange = !!(account.createdBy && account.createdBy !== "Customer" && account.createdBy !== "null");
        navigate("/confirm-email", { state: { email, requirePasswordChange } });
    } else if (account.status === 2) {
        // Bị khóa/banned -> Hiển thị thông báo lỗi
        setErrorMessage("Tài khoản của bạn đã bị khóa!");
    } else {
        // Đã active -> Cho phép đăng nhập bình thường
        localStorage.setItem("USER_LOGIN", JSON.stringify(account));
        if (role === "Admin") {
             navigate("/admin"); 
        } else if (role === "Employee") {
             navigate("/employee");
        } else {
             navigate("/"); 
        }
    }
} catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
         setErrorMessage(error.response.data.message); 
    } else {
         setErrorMessage("Không thể kết nối đến máy chủ!");
    }
}
  };

  return (
    <div 
      className="w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-12 font-sans"
      style={{ backgroundImage: `url(${bgHero})` }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 flex flex-col items-center">
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chào mừng trở lại</h2>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            Đăng nhập để trải nghiệm những bộ phim bom tấn tại Cinema Noir
          </p>
        </div>

        <form className="w-full space-y-5" onSubmit={handleLogin}>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">USERNAME</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={16} strokeWidth={2} />
              </span>
              <input
                type="text"
                value={username} 
                // Cực tinh tế: Vừa gõ phím đổi username là dòng lỗi tự động biến mất
                onChange={(e) => { setUsername(e.target.value); setErrorMessage(""); }} 
                placeholder="Nhập username..."
                className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">MẬT KHẨU</label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#C00000] hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} strokeWidth={2} />
              </span>
              <input
                type="password"
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                placeholder="••••••••"
                className="w-full bg-white text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-300 tracking-widest"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. KHUNG HIỂN THỊ LỖI TUYỆT ĐẸP (Chỉ hiện ra khi có biến errorMessage) */}
          {/* ======================================================== */}
          {errorMessage && (
            <div className="flex items-center p-3 text-[13px] font-semibold text-[#C00000] bg-red-50/80 border border-red-100 rounded-xl transition-all">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              {errorMessage}
            </div>
          )}

          <div className="flex items-center pt-1">
            <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-gray-300 text-[#C00000] focus:ring-[#C00000] cursor-pointer"
              />
              <span>Duy trì đăng nhập</span>
            </label>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-[#C00000] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#a00000] active:scale-[0.99] transition-all shadow-md shadow-red-900/10">
              Đăng nhập
            </button>
          </div>
        </form>

        <div className="w-full flex items-center justify-center my-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">
          <span className="w-1/4 h-[1px] bg-gray-100 block"></span>
          <span className="mx-3 whitespace-nowrap">HOẶC TIẾP TỤC VỚI</span>
          <span className="w-1/4 h-[1px] bg-gray-100 block"></span>
        </div>

        <div className="w-full grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 py-2.5 rounded-xl transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9.1z"/>
              <path fill="#34A853" d="M12 24c3.2 0 6-.1 8-2.9l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.2v3.2C3.2 21.8 7.3 24 12 24z"/>
              <path fill="#FBBC05" d="M5.2 14.2c-.3-.8-.4-1.7-.4-2.7s.1-1.9.4-2.7V5.6H1.2C.4 7.2 0 9 0 11s.4 3.8 1.2 5.4l4-3.2z"/>
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.3 15.2 0 12 0 7.3 0 3.2 2.2 1.2 5.6l4 3.2c1-2.9 3.7-5 6.8-5z"/>
            </svg>
            <span className="text-xs font-bold text-gray-700">Google</span>
          </button>

          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 py-2.5 rounded-xl transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
            </svg>
            <span className="text-xs font-bold text-gray-700">Apple</span>
          </button>
        </div>

        <div className="mt-8 text-xs font-medium text-gray-400">
          Bạn chưa có tài khoản?{' '}
          <a href="#register" className="font-bold text-[#C00000] hover:underline">Đăng ký ngay</a>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;