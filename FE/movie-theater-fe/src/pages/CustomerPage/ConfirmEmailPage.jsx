import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, Film, ShieldCheck } from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const fieldClass =
  'w-full bg-white/80 dark:bg-white/[0.06] text-sm text-[#111827] dark:text-[#F5F7FB] pl-11 pr-4 py-3.5 rounded-2xl border border-black/[0.08] dark:border-white/12 focus:outline-none focus:border-[var(--cine-red)] focus:ring-2 focus:ring-[var(--cine-red)]/25 transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-white/35';

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

  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput) {
      setErrorMessage('Vui lòng nhập email đăng ký.');
      return;
    }

    if (emailInput.trim().toLowerCase() !== registeredEmail.toLowerCase()) {
      setErrorMessage('Email xác nhận không khớp với email đăng ký tài khoản!');
      return;
    }

    setIsSending(true);
    try {
      await CustomerService.checkEmail(emailInput.trim());
      navigate('/verify-otp', { state: { email: emailInput.trim(), requirePasswordChange } });
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể gửi OTP, vui lòng thử lại!';
      setErrorMessage(typeof msg === 'string' ? msg : 'Không thể gửi OTP, vui lòng thử lại!');
    } finally {
      setIsSending(false);
    }
  };

  if (!registeredEmail) return null;

  return (
    <div className="relative min-h-screen w-full overflow-x-clip font-[family-name:var(--font-body)] text-[var(--cine-text)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHero})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-[var(--cine-red)]/35 dark:from-black/85 dark:via-[#050505]/75 dark:to-[var(--cine-red)]/25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[var(--cine-red)]/30 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--cine-blue)]/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12 sm:px-10">
        <Link
          to="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-white/90 transition hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cine-red)] shadow-lg shadow-red-900/40">
            <Film size={18} strokeWidth={2.4} />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-black tracking-[0.08em] uppercase">
            Cinema Elite
          </span>
        </Link>

        <div className="w-full rounded-3xl border border-white/15 bg-white/90 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/80 md:p-10">
          <div className="mb-8 flex flex-col items-center text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
              <ShieldCheck size={28} className="text-[#C00000] dark:text-[#ff4d57]" strokeWidth={2} />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[#111827] dark:text-[#F5F7FB]">
              Xác thực tài khoản
            </h2>
            <p className="max-w-[300px] text-xs font-medium leading-relaxed text-[#6B7280] dark:text-white/50 md:text-sm">
              Vui lòng nhập lại email đăng ký của bạn để nhận mã xác thực OTP
            </p>
          </div>

          <form className="w-full space-y-5" onSubmit={handleSubmit}>
            <div className="w-full space-y-1.5 text-left">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] dark:text-white/40">
                Email đăng ký
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40">
                  <Mail size={16} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Nhập email..."
                  className={fieldClass}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex w-full items-center rounded-xl border border-red-200 bg-red-50/90 p-3 text-[13px] font-semibold text-[#C00000] transition-all dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSending}
                className="w-full rounded-2xl bg-[var(--cine-red)] py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-white/15 dark:disabled:text-white/35"
              >
                {isSending ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center text-xs font-semibold text-[#9CA3AF] transition-colors hover:text-[#374151] dark:text-white/45 dark:hover:text-white/80"
            >
              <ArrowLeft size={16} className="mr-1" /> Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
