/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Film, ArrowRight, AlertCircle } from 'lucide-react';
import bgHero from '../../assets/imgs/Hero.png';
import CustomerService from '../../services/CustomerService.js';

const fieldClass =
  'w-full bg-white/80 dark:bg-white/[0.06] text-sm text-[#111827] dark:text-[#F5F7FB] pl-11 pr-4 py-3.5 rounded-2xl border border-black/[0.08] dark:border-white/12 focus:outline-none focus:border-[var(--cine-red)] focus:ring-2 focus:ring-[var(--cine-red)]/25 transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-white/35';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const response = await CustomerService.Login(username.toLowerCase(), password);
      const account = response.data.data.account;
      const role = account.roleName;

      console.log('Login Success Account Data:', account);
      console.log('Account status:', account.status);
      console.log('Account createdBy:', account.createdBy);

      if (account.status === 0) {
        const email = account.email;
        const requirePasswordChange = !!(
          account.createdBy &&
          account.createdBy !== 'Customer' &&
          account.createdBy !== 'null'
        );
        navigate('/confirm-email', { state: { email, requirePasswordChange } });
      } else if (account.status === 2) {
        setErrorMessage('Tài khoản của bạn đã bị khóa!');
      } else {
        localStorage.setItem('USER_LOGIN', JSON.stringify(account));
        if (role === 'Admin') {
          navigate('/admin');
        } else if (role === 'Employee') {
          navigate('/employee');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-clip font-[family-name:var(--font-body)] text-[var(--cine-text)]">
      {/* Full-bleed cinema plane */}
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row lg:items-stretch">
        {/* Brand column */}
        <section className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-white/90 transition hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cine-red)] shadow-lg shadow-red-900/40">
              <Film size={18} strokeWidth={2.4} />
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg font-black tracking-[0.08em] uppercase">
              Cinema ELITE
            </span>
          </Link>

          <div className="mt-12 max-w-md space-y-4 lg:mt-0">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--cine-gold)]">
              Member access
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl min-w-0 [overflow-wrap:anywhere]">
              Chào mừng trở lại
            </h1>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-white/70">
              Đăng nhập để đặt vé, giữ ghế và nhận ưu đãi thành viên tại rạp.
            </p>
          </div>

          <p className="mt-10 hidden text-xs font-semibold text-white/40 lg:block">
            Trải nghiệm điện ảnh · Cinema ELITE
          </p>
        </section>

        {/* Form column */}
        <section className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-white/92 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#10131A]/88 sm:p-9">
            <div className="mb-7 space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight text-[#111827] dark:text-white">
                Đăng nhập
              </h2>
              <p className="text-sm font-medium text-[#6B7280] dark:text-white/50">
                Nhập thông tin tài khoản của bạn
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#9CA3AF] dark:text-white/40">
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Nhập username..."
                    autoComplete="username"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#9CA3AF] dark:text-white/40">
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    className="shrink-0 text-xs font-bold text-[var(--cine-red)] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`${fieldClass} tracking-widest`}
                  />
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-semibold text-[#C00000] dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-[#6B7280] dark:text-white/50">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--cine-red)] focus:ring-[var(--cine-red)]"
                />
                <span>Duy trì đăng nhập</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cine-red)] py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!submitting && (
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs font-medium text-[#6B7280] dark:text-white/45">
              Bạn chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-[var(--cine-red)] hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
