import React from 'react';
import { User, Ticket, History, LogOut, Award, Ban } from 'lucide-react';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'account-info', name: 'Account Information', icon: User },
    { id: 'points-history', name: 'History', icon: History },
    { id: 'booked-tickets', name: 'Booked Ticket', icon: Ticket },
    { id: 'canceled-tickets', name: 'Canceled Ticket', icon: Ban },
  ];

  return (
    <div className="w-full md:w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col space-y-6 transition-colors duration-300">
      
      {/* Hạng thành viên (Tier badge) */}
      <div className="flex items-center space-x-3 p-4 bg-red-50/50 dark:bg-red-950/30 rounded-2xl border border-red-50 dark:border-red-900/40">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Award size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">MEMBER STATUS</div>
          <div className="text-sm font-black text-amber-600 dark:text-amber-400 flex items-center">
            Gold Tier
          </div>
        </div>
      </div>

      {/* Danh sách Menu */}
      <nav className="flex flex-col space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left relative ${
                isActive
                  ? 'bg-red-50/40 dark:bg-red-950/40 text-[#C00000] dark:text-[#E50914] border-l-4 border-[#C00000] dark:border-[#E50914] pl-3'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </button>
          );
        })}

        <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-4"></div>

        <button className="flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all text-left">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

    </div>
  );
};

export default ProfileSidebar;
