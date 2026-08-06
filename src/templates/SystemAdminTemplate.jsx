import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Users, UserCircle, LogOut, Home, LayoutDashboard, UserCheck } from 'lucide-react';
import CustomerService from '../services/CustomerService';
import ThemeToggle from '../components/ThemeToggle';
import FhdScaleShell from '../components/FhdScaleShell';

const SystemAdminTemplate = () => {
  const navigate = useNavigate();

  const mainNavItems = [
    { name: 'Quản lý admin', path: '/system-admin/admins', icon: Users },
    { name: 'Trang Admin', path: '/admin/statistics', icon: LayoutDashboard },
    { name: 'Trang Nhân viên', path: '/employee/statistics', icon: UserCheck },
    { name: 'Thông tin cá nhân', path: '/system-admin/profile', icon: UserCircle },
  ];

  const handleSignOut = async () => {
    try {
      await CustomerService.Logout();
    } catch (_) {}
    localStorage.removeItem('USER_LOGIN');
    navigate('/login');
  };

  return (
    <FhdScaleShell className="flex h-full flex-row overflow-hidden bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300">
      <aside className="w-64 max-w-64 h-full bg-[#F1F3F5] dark:bg-[#0a0a0f]/75 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col justify-between gap-4 py-8 pl-0 pr-4 select-none shrink-0 overflow-x-hidden overflow-y-auto transition-colors duration-300">
        <div className="space-y-8 min-w-0 pl-6">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="min-w-0 flex-1 text-base font-black tracking-wide text-gray-950 dark:text-white flex items-center gap-2 leading-tight">
              <Shield size={18} className="shrink-0 text-[#C00000] dark:text-[#ff4d57]" />
              <span className="min-w-0 break-words">Quản trị hệ thống</span>
            </h1>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 border border-gray-300 dark:border-white/15">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black tracking-wider text-[#C00000] dark:text-[#ff4d57] uppercase leading-tight truncate">
                SYSTEM ADMINISTRATOR
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-white/45 truncate">
                Toàn quyền hệ thống
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden mt-10 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex w-full min-w-0 items-center gap-3 pl-6 py-3 text-xs font-black tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-[#C00000] dark:text-[#ff4d57] bg-gradient-to-r from-red-50 dark:from-red-950/50 to-transparent'
                      : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/8'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#C00000] dark:bg-[#E50914] rounded-r-md"></span>
                    )}
                    <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                    <span className="min-w-0 leading-snug break-words">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="flex flex-col shrink-0 gap-1 min-w-0 overflow-hidden border-t border-gray-200/60 dark:border-white/10 pt-4 space-y-1">
          <NavLink
            to="/"
            className="flex w-full min-w-0 items-center gap-3 pl-6 py-3 text-xs font-black tracking-wide text-gray-500 dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57] text-left"
          >
            <Home size={16} className="shrink-0" strokeWidth={2} />
            <span className="min-w-0 leading-snug break-words">Trang chủ</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex w-full min-w-0 items-center gap-3 pl-6 py-3 text-xs font-black tracking-wide text-gray-500 dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57] text-left"
          >
            <LogOut size={16} className="shrink-0" strokeWidth={2} />
            <span className="min-w-0 leading-snug break-words">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-transparent text-gray-900 dark:text-gray-100 p-10 transition-colors duration-300">
        <Outlet />
      </main>
    </FhdScaleShell>
  );
};

export default SystemAdminTemplate;
