import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  QrCode,
  Ticket,
  Armchair,
  Tag,
  Film,
  CalendarClock,
  BadgeDollarSign,
  Popcorn,
  UserCircle,
  HelpCircle,
  LogOut,
  Home,
  UserCheck,
  Shield
} from 'lucide-react';
import { CONCESSION_LABELS } from '../constants/labels';
import ThemeToggle from '../components/ThemeToggle';

const AdminTemplate = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('USER_LOGIN') || '{}'));

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('USER_LOGIN') || '{}'));
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => window.removeEventListener('profile-update', handleProfileUpdate);
  }, []);

  const avatarUrl = user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80";
  const fullName = user.fullName || "Chưa cập nhật";
  const roleName = user.roleName || user.role?.roleName || "";
  const roleLabel = roleName === 'Admin' ? 'Quản trị viên' : (roleName === 'SystemAdmin' ? 'System Admin' : (roleName || 'Admin'));

  const mainNavItems = [
    { name: 'Thống kê', path: '/admin/statistics', icon: BarChart3 },
    { name: 'Trang Nhân viên', path: '/employee/statistics', icon: UserCheck },
    ...(roleName.trim().toLowerCase() === 'systemadmin' ? [{ name: 'SysAdmin Hub', path: '/system-admin/admins', icon: Shield }] : []),
    { name: 'Quản lý phim', path: '/admin/movies', icon: Film },
    { name: 'Quản lý suất chiếu', path: '/admin/schedules', icon: CalendarClock },
    { name: 'Quản lý phòng chiếu', path: '/admin/cinema-rooms', icon: Armchair },
    { name: 'Cấu hình giá', path: '/admin/pricing', icon: BadgeDollarSign },
    { name: 'Quản lý khuyến mãi', path: '/admin/promotions', icon: Tag },
    { name: CONCESSION_LABELS.sidebarTitle, path: '/admin/concessions', icon: Popcorn },
    { name: 'Quản lý khách hàng', path: '/admin/customers', icon: QrCode },
    { name: 'Quản lý nhân viên', path: '/admin/employees', icon: Ticket },
    { name: 'Hồ sơ của tôi', path: '/admin/profile', icon: UserCircle },
  ];

  // Định nghĩa danh sách các menu ở dưới cùng
  const bottomNavItems = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Hỗ trợ', path: '/admin/support', icon: HelpCircle },
    { name: 'Đăng xuất', path: '/login', icon: LogOut, isSignOut: true },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50 dark:bg-[#050505] font-sans lg:flex-row lg:h-screen lg:overflow-hidden transition-colors duration-300">

      {/* ================= SIDEBAR (Bên trái) ================= */}
      <aside className="w-full bg-[#F1F3F5] dark:bg-[#0a0a0f]/75 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 flex flex-col gap-4 py-5 px-4 select-none shrink-0 lg:h-screen lg:overflow-y-auto lg:w-64 lg:justify-between lg:border-b-0 lg:border-r lg:py-8 lg:pl-0 lg:pr-4 transition-colors duration-300">

        {/* Phần trên: Logo & Thông tin User */}
        <div className="space-y-4 lg:space-y-8 lg:pl-6">
          {/* Tên thương hiệu */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-black tracking-wider text-gray-950 dark:text-white whitespace-nowrap">
              Admin Hub
            </h1>
            <ThemeToggle />
          </div>

          {/* Khối thông tin Hub / Nhân viên */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-white/15 bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              {user.image ? (
                <img
                  src={avatarUrl}
                  alt="Avatar Admin"
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

        {/* Phần giữa: Các chức năng chính (Main Menu) */}
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
                    {/* Vạch đỏ đứng bên trái khi Tab được Active */}
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

        {/* Phần dưới cùng: Support & Sign out */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-t-0 pt-2 lg:overflow-visible lg:flex-col lg:space-y-1 lg:border-t lg:border-gray-200/60 lg:dark:border-white/10 lg:pt-4">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={item.isSignOut ? () => localStorage.clear() : undefined}
                className={({ isActive }) =>
                  `flex shrink-0 items-center space-x-3 rounded-lg px-3 py-3 text-xs font-black tracking-widest transition-colors lg:space-x-4 lg:rounded-none lg:pl-6 ${
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

      <main
        className="relative z-10 flex-1 min-h-screen overflow-y-auto bg-transparent p-4 sm:p-6 md:p-8 lg:p-10 text-[#111827] dark:text-[#F5F7FB] transition-colors duration-300 select-none"
        onCopy={(e) => e.preventDefault()}
      >
        <Outlet />
      </main>

    </div>
  );
};

export default AdminTemplate;
