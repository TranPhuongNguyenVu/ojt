import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
import FhdScaleShell from '../components/FhdScaleShell';
import SupportService from '../services/SupportService';

const AdminTemplate = () => {
  const location = useLocation();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('USER_LOGIN') || '{}'));
  const [newSupportCount, setNewSupportCount] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('USER_LOGIN') || '{}'));
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => window.removeEventListener('profile-update', handleProfileUpdate);
  }, []);

  const refreshSupportBadge = useCallback(async () => {
    try {
      const res = await SupportService.stats();
      setNewSupportCount(Number(res.data?.data?.newCount) || 0);
    } catch {
      // silent — badge is non-critical
    }
  }, []);

  useEffect(() => {
    refreshSupportBadge();
    const intervalId = window.setInterval(refreshSupportBadge, 20000);
    const onSupportUpdated = () => refreshSupportBadge();
    window.addEventListener('support-updated', onSupportUpdated);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('support-updated', onSupportUpdated);
    };
  }, [refreshSupportBadge]);

  useEffect(() => {
    refreshSupportBadge();
  }, [location.pathname, refreshSupportBadge]);

  const avatarUrl = user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80";
  const fullName = user.fullName || "Chưa cập nhật";
  const roleName = user.roleName || user.role?.roleName || "";
  const roleLabel = roleName === 'Admin' ? 'Quản trị viên' : (roleName === 'SystemAdmin' ? 'Quản trị hệ thống' : (roleName || 'Quản trị viên'));
  const hasNewSupport = newSupportCount > 0;

  const mainNavItems = [
    { name: 'Thống kê', path: '/admin/statistics', icon: BarChart3 },
    { name: 'Trang Nhân viên', path: '/employee/statistics', icon: UserCheck },
    ...(roleName.trim().toLowerCase() === 'systemadmin' ? [{ name: 'Quản trị hệ thống', path: '/system-admin/admins', icon: Shield }] : []),
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

  const bottomNavItems = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Hỗ trợ', path: '/admin/support', icon: HelpCircle, isSupport: true },
    { name: 'Đăng xuất', path: '/login', icon: LogOut, isSignOut: true },
  ];

  return (
    <FhdScaleShell className="flex h-full flex-row overflow-hidden bg-gray-50 dark:bg-[#050505] font-sans transition-colors duration-300">
      <aside className="w-64 max-w-64 h-full min-h-0 bg-[#F1F3F5] dark:bg-[#0a0a0f]/75 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col gap-4 py-8 pl-0 pr-4 select-none shrink-0 overflow-hidden transition-colors duration-300">
        <div className="space-y-8 min-w-0 pl-6 shrink-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h1 className="min-w-0 flex-1 text-base font-black tracking-wide text-gray-950 dark:text-white leading-tight">
              Khu vực quản trị
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
                  alt="Ảnh đại diện quản trị"
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

        <div className="admin-sidebar-scroll flex-1 flex flex-col gap-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden mt-2 space-y-1">
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
            const alertSupport = item.isSupport && hasNewSupport;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={item.isSignOut ? () => localStorage.clear() : undefined}
                className={({ isActive }) =>
                  `relative flex w-full min-w-0 items-center gap-3 pl-6 py-3 pr-3 text-xs font-black tracking-wide transition-colors ${
                    item.isSignOut
                      ? 'text-gray-400 dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57]'
                      : alertSupport
                        ? 'text-[#C00000] dark:text-[#ff4d57] bg-red-50/90 dark:bg-red-950/40 animate-pulse'
                        : isActive
                          ? 'text-[#C00000] dark:text-[#ff4d57]'
                          : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {alertSupport && (
                      <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#C00000] dark:bg-[#E50914] rounded-r-md" />
                    )}
                    <span className="relative shrink-0">
                      <Icon
                        size={16}
                        className={alertSupport ? 'text-[#C00000] dark:text-[#ff4d57]' : undefined}
                        strokeWidth={alertSupport || isActive ? 2.5 : 2}
                      />
                      {alertSupport && (
                        <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-[#E50914] ring-2 ring-white dark:ring-[#0a0a0f]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug break-words">{item.name}</span>
                    {alertSupport && (
                      <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#E50914] text-white text-[10px] font-black flex items-center justify-center">
                        {newSupportCount > 99 ? '99+' : newSupportCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </aside>

      <main
        className="relative z-10 flex-1 h-full overflow-y-auto bg-transparent p-10 text-[#111827] dark:text-[#F5F7FB] transition-colors duration-300 select-none"
        onCopy={(e) => e.preventDefault()}
      >
        <Outlet />
      </main>
    </FhdScaleShell>
  );
};

export default AdminTemplate;
