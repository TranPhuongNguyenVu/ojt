import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Users, UserCircle, LogOut, Home } from 'lucide-react';
import CustomerService from '../services/CustomerService';

const SystemAdminTemplate = () => {
  const navigate = useNavigate();

  const mainNavItems = [
    { name: 'Quản lý admin', path: '/system-admin/admins', icon: Users },
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
    <div className="w-full min-h-screen flex flex-col bg-gray-50 font-sans lg:flex-row lg:h-screen lg:overflow-hidden">

      {/* ================= SIDEBAR (Bên trái) ================= */}
      <aside className="w-full bg-[#F1F3F5] border-b border-gray-200 flex flex-col gap-4 py-5 px-4 select-none shrink-0 lg:min-h-screen lg:w-64 lg:justify-between lg:border-b-0 lg:border-r lg:py-8 lg:pl-0 lg:pr-4">

        {/* Phần trên: Logo & Thông tin User */}
        <div className="space-y-4 lg:space-y-8 lg:pl-6">
          {/* Tên thương hiệu */}
          <h1 className="text-xl font-black tracking-wider text-gray-950 flex items-center gap-2">
            <Shield size={20} className="text-[#C00000]" />
            SysAdmin Hub
          </h1>

          {/* Khối thông tin Hub / Nhân viên */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 border border-gray-300">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-wider text-[#C00000] uppercase leading-tight">
                SYSTEM ADMINISTRATOR
              </span>
              <span className="text-[10px] font-medium text-gray-400">
                Toàn quyền hệ thống
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
                      ? 'text-[#C00000] bg-gradient-to-r from-red-50 to-transparent'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Vạch đỏ đứng bên trái khi Tab được Active */}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#C00000] rounded-r-md"></span>
                    )}
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Phần dưới cùng: TRANG CHỦ & ĐĂNG XUẤT */}
        <div className="hidden border-t border-gray-200/60 pt-4 lg:flex lg:flex-col lg:space-y-1">
          <NavLink
            to="/"
            className="flex items-center space-x-4 pl-6 py-3 text-xs font-black tracking-widest text-gray-500 hover:text-[#C00000] w-full text-left"
          >
            <Home size={16} strokeWidth={2} />
            <span>Trang chủ</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-4 pl-6 py-3 text-xs font-black tracking-widest text-gray-500 hover:text-[#C00000] w-full text-left"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Đăng xuất</span>
          </button>
        </div>

      </aside>

      {/* ================= MAIN CONTENT AREA (Bên phải) ================= */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-white p-4 sm:p-6 md:p-8 lg:p-10">
        <Outlet />
      </main>

    </div>
  );
};

export default SystemAdminTemplate;

