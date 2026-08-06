import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Film,
  History,
  UserCircle,
  HelpCircle,
  LogOut,
  Home,
  QrCode,
  LayoutDashboard,
  Shield
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import FhdScaleShell from '../components/FhdScaleShell';

const EmployeeTemplate = () => {
  const user = JSON.parse(localStorage.getItem('USER_LOGIN') || '{}');
  const avatarUrl = user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80";
  const fullName = user.fullName || "Chưa cập nhật";
  const roleName = user.roleName || user.role?.roleName || "";
  const roleLabel = roleName === 'Employee' ? 'Nhân viên' : (roleName || 'Nhân viên');
  const normalizedRole = roleName.trim().toLowerCase();

  const mainNavItems = [
    { name: 'Thống kê', path: '/employee/statistics', icon: BarChart3 },
    ...((normalizedRole === 'admin' || normalizedRole === 'systemadmin') ? [{ name: 'Trang Admin', path: '/admin/statistics', icon: LayoutDashboard }] : []),
    ...(normalizedRole === 'systemadmin' ? [{ name: 'Quản trị hệ thống', path: '/system-admin/admins', icon: Shield }] : []),
    { name: 'Soát vé', path: '/employee/tickets/checkin', icon: QrCode },
    { name: 'Lịch sử bán vé', path: '/employee/tickets/history', icon: History },
    { name: 'Danh sách phim', path: '/employee/movies', icon: Film },
    { name: 'Hồ sơ của tôi', path: '/employee/profile', icon: UserCircle },
  ];

  const bottomNavItems = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Hỗ trợ', path: '/employee/support', icon: HelpCircle },
    { name: 'Đăng xuất', path: '/login', icon: LogOut, isSignOut: true },
  ];

  return (
    <FhdScaleShell className="employee-shell relative flex h-full flex-row overflow-hidden font-sans transition-colors duration-300">
      <div className="employee-glow employee-glow-a" aria-hidden="true" />
      <div className="employee-glow employee-glow-b" aria-hidden="true" />
      <div className="employee-glow employee-glow-c" aria-hidden="true" />

      <aside className="relative z-10 w-64 max-w-64 h-full bg-white/70 dark:bg-[#0a0a0f]/75 backdrop-blur-xl border-r border-gray-200/80 dark:border-white/10 flex flex-col justify-between gap-4 py-8 pl-0 pr-4 select-none shrink-0 overflow-x-hidden overflow-y-auto transition-colors duration-300">
        <div className="space-y-8 min-w-0 pl-6">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="min-w-0 flex-1 text-base font-black tracking-wide text-gray-950 dark:text-white leading-tight">
              Khu vực nhân viên
            </h1>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-gray-300 dark:border-white/15 bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              {user.image ? (
                <img
                  src={avatarUrl}
                  alt="Ảnh đại diện nhân viên"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <UserCircle size={28} className="text-gray-400 dark:text-white/40" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black tracking-wider text-[#C00000] dark:text-[#ff4d57] uppercase leading-tight truncate" title={fullName}>
                {fullName}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-white/45 truncate">
                {roleLabel}
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
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={item.isSignOut ? () => localStorage.clear() : undefined}
                className={({ isActive }) =>
                  `flex w-full min-w-0 items-center gap-3 pl-6 py-3 text-xs font-black tracking-wide transition-colors ${
                    item.isSignOut
                      ? 'text-gray-400 dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57]'
                      : isActive
                        ? 'text-[#C00000] dark:text-[#ff4d57]'
                        : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" strokeWidth={2} />
                <span className="min-w-0 leading-snug break-words">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      <main className="relative z-10 flex-1 h-full overflow-y-auto bg-transparent p-10 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Outlet />
      </main>
    </FhdScaleShell>
  );
};

export default EmployeeTemplate;
