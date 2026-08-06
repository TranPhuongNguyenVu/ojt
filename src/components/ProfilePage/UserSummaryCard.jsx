/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React, { useRef } from 'react';
import { Camera, Edit3 } from 'lucide-react';

const UserSummaryCard = ({ memberData, onEditClick, onAvatarChange, isUploading }) => {
  const fileInputRef = useRef(null);
  const currentPoints = memberData?.score || 0;

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onAvatarChange) onAvatarChange(file);
  };

  return (
    <div className="w-full bg-white dark:bg-[#10131A]/90 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5 text-center md:text-left">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-red-100 dark:border-red-500/30 bg-gray-100 dark:bg-white/10 overflow-hidden flex items-center justify-center relative">
            <img
              src={
                memberData?.image ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
              }
              alt="Avatar"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isUploading ? 'opacity-30' : ''
              }`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
                <div className="w-5 h-5 border-2 border-[#C00000] border-t-transparent rounded-full animate-spin" />
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
            type="button"
            onClick={handleCameraClick}
            disabled={isUploading}
            className={`absolute -bottom-1 -right-1 w-7 h-7 bg-[#C00000] dark:bg-[#E50914] hover:bg-[#a00000] dark:hover:bg-[#ff1a25] text-white rounded-full flex items-center justify-center shadow-md transition-all ${
              isUploading ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
            }`}
          >
            <Camera size={12} />
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-[#111827] dark:text-white leading-tight">
            {memberData?.fullName || 'Thành viên'}
          </h2>
          <div className="text-xs font-bold text-[#9CA3AF] dark:text-white/40">
            Mã TV:{' '}
            <span className="text-[#111827] dark:text-white font-black">
              {memberData?.memberId
                ? memberData.memberId.substring(0, 8).toUpperCase()
                : '—'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
            <span className="text-[9px] font-black tracking-wider uppercase px-2.5 py-1 bg-gray-100 dark:bg-white/8 text-[#6B7280] dark:text-white/45 rounded-full">
              {(currentPoints || 0).toLocaleString('vi-VN')} điểm
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEditClick}
        className="flex items-center gap-2 bg-gray-50 dark:bg-white/8 hover:bg-gray-100 dark:hover:bg-white/12 text-[#374151] dark:text-white/80 px-5 py-2.5 rounded-xl text-xs font-black border border-gray-200/60 dark:border-white/10 transition-all active:scale-[0.98] cursor-pointer"
      >
        <Edit3 size={14} />
        <span className="uppercase tracking-wider">Chỉnh sửa hồ sơ</span>
      </button>
    </div>
  );
};

export default UserSummaryCard;
