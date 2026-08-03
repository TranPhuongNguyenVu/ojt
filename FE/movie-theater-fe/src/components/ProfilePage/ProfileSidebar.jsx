/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Ticket, History, LogOut, Award, Ban } from 'lucide-react';
import CustomerService from '../../services/CustomerService';
import { getMembershipTier } from '../../utils/membershipTier';

const ProfileSidebar = ({ activeTab, setActiveTab, memberData }) => {
  const navigate = useNavigate();
  const { tier, textColor, iconBg } = getMembershipTier(memberData?.score);

  const menuItems = [
    { id: 'account-info', name: 'Thông tin tài khoản', icon: User },
    { id: 'points-history', name: 'Lịch sử điểm', icon: History },
    { id: 'booked-tickets', name: 'Vé đã đặt', icon: Ticket },
    { id: 'canceled-tickets', name: 'Vé đã hủy', icon: Ban },
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
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-red-50 to-amber-50/40 dark:from-red-950/40 dark:to-amber-950/20 border border-red-100/80 dark:border-red-500/20">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Award size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#9CA3AF] dark:text-white/40 uppercase tracking-wider">
            Hạng thành viên
          </div>
          <div className={`text-sm font-black ${textColor}`}>{tier}</div>
        </div>
      </div>

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
