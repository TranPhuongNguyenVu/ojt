import React, { useRef } from 'react';
import { Camera, Edit3 } from 'lucide-react';

const UserSummaryCard = ({ memberData, onEditClick, onAvatarChange, isUploading }) => {
  const fileInputRef = useRef(null);
  const currentPoints = memberData?.score || 0;
  let tier = 'Standard';
  let badgeColor = 'bg-gray-100 text-gray-500';
  
  if (currentPoints >= 5000) {
    tier = 'Platinum';
    badgeColor = 'bg-red-500/10 text-[#C00000]';
  } else if (currentPoints >= 2000) {
    tier = 'Gold';
    badgeColor = 'bg-amber-500/10 text-amber-700';
  } else if (currentPoints >= 1000) {
    tier = 'Silver';
    badgeColor = 'bg-slate-300/20 text-slate-700';
  }

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
      
      {/* Thông tin avatar & Tên */}
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-5 text-center md:text-left">
        
        {/* Avatar với nút sửa ảnh đè lên */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-red-50 bg-gray-100 overflow-hidden flex items-center justify-center relative">
            <img 
              src={memberData?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
              alt="Avatar" 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : ''}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
                <div className="w-5 h-5 border-2 border-[#C00000] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
          <button 
            onClick={handleCameraClick} 
            disabled={isUploading}
            className={`absolute -bottom-1 -right-1 w-7 h-7 bg-[#C00000] hover:bg-[#a00000] text-white rounded-full flex items-center justify-center shadow-md transition-all ${
              isUploading ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            <Camera size={12} />
          </button>
        </div>

        {/* Tên & Member Info */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 leading-tight">{memberData?.fullName || "Alex Nguyen"}</h2>
          <div className="text-xs font-bold text-gray-400">
            Member ID: <span className="text-gray-800 font-black">{memberData?.memberId ? memberData.memberId.substring(0, 8).toUpperCase() : "CL-000022"}</span>
          </div>
          
          {/* Nhãn Huy hiệu */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
            <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeColor}`}>
              {tier} Member
            </span>
            <span className="text-[9px] font-black tracking-wider uppercase px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
              Member Since 2022
            </span>
          </div>
        </div>

      </div>

      {/* Nút sửa thông tin */}
      <button onClick={onEditClick} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl text-xs font-black border border-gray-200/50 dark:border-gray-700 shadow-sm transition-all active:scale-[0.98]">
        <Edit3 size={14} />
        <span className="uppercase tracking-wider">Chỉnh sửa hồ sơ</span>
      </button>

    </div>
  );
};

export default UserSummaryCard;
