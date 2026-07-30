import { NavLink, Outlet } from 'react-router-dom';
import { 
  BarChart3, 
  Film,
  History,
  UserCircle,
  HelpCircle, 
  LogOut,
  Home
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const EmployeeTemplate = () => {
  const user = JSON.parse(localStorage.getItem('USER_LOGIN') || '{}');
  const avatarUrl = user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80";
  const fullName = user.fullName || "Chưa cập nhật";
  const roleLabel = user.roleName === 'Employee' ? 'Nhân viên' : (user.roleName || 'Employee');

  const mainNavItems = [
    { name: 'Thống kê', path: '/employee/statistics', icon: BarChart3 },
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
    <div className="employee-shell relative w-full min-h-screen flex flex-col font-sans lg:flex-row lg:h-screen lg:overflow-hidden transition-colors duration-300">
      <div className="employee-glow employee-glow-a" aria-hidden="true" />
      <div className="employee-glow employee-glow-b" aria-hidden="true" />
      <div className="employee-glow employee-glow-c" aria-hidden="true" />

      <aside className="relative z-10 w-full bg-white/70 dark:bg-[#0a0a0f]/75 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 flex flex-col gap-4 py-5 px-4 select-none shrink-0 lg:min-h-screen lg:w-64 lg:justify-between lg:border-b-0 lg:border-r lg:py-8 lg:pl-0 lg:pr-4 transition-colors duration-300">
        <div className="space-y-4 lg:space-y-8 lg:pl-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-black tracking-wide text-gray-950 dark:text-white whitespace-nowrap">
              Employee Hub
            </h1>
            <ThemeToggle />
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-white/15 bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              {user.image ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar Employee" 
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <UserCircle size={28} className="text-gray-400 dark:text-white/40" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-wider text-[#C00000] dark:text-[#ff4d57] uppercase leading-tight truncate max-w-[140px]" title={fullName}>
                {fullName}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-white/45">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-1 overflow-x-auto lg:mt-10 lg:flex-col lg:space-y-1 lg:overflow-visible">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center space-x-3 rounded-lg px-3 py-3 text-xs font-black tracking-widest transition-all duration-200 lg:space-x-4 lg:rounded-none lg:pl-6 ${
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
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="hidden border-t border-gray-200/60 dark:border-white/10 pt-4 lg:flex lg:flex-col lg:space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={item.isSignOut ? () => localStorage.clear() : undefined}
                className={({ isActive }) =>
                  `flex items-center space-x-4 pl-6 py-3 text-xs font-black tracking-widest transition-colors ${
                    item.isSignOut 
                      ? 'text-gray-400 dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57]' 
                      : isActive 
                        ? 'text-[#C00000] dark:text-[#ff4d57]' 
                        : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      <main className="relative z-10 flex-1 min-h-screen overflow-y-auto bg-transparent p-4 sm:p-6 md:p-8 lg:p-10 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeTemplate;
