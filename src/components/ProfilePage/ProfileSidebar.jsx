/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Ticket, History, LogOut } from 'lucide-react';
import CustomerService from '../../services/CustomerService';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'account-info', name: 'Thông tin tài khoản', icon: User },
    { id: 'points-history', name: 'Lịch sử điểm', icon: History },
    { id: 'booked-tickets', name: 'Vé đã đặt', icon: Ticket },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('USER_LOGIN');
    try {
      await CustomerService.Logout();
    } catch (err) {
      /* ignore */
    }
    navigate('/login');
  };

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-[#10131A]/90 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 flex flex-col gap-5 transition-colors duration-300">
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left relative ${
                isActive
                  ? 'bg-red-50/70 dark:bg-red-950/40 text-[#C00000] dark:text-[#ff4d57]'
                  : 'text-[#6B7280] dark:text-white/50 hover:text-[#111827] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/8'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-md bg-[#C00000] dark:bg-[#E50914]" />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </button>
          );
        })}

        <div className="h-px bg-gray-100 dark:bg-white/10 my-3" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-[#9CA3AF] dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57] hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all text-left"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
};

export default ProfileSidebar;
