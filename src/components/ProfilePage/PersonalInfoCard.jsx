import React from 'react';
import { Edit2 } from 'lucide-react';

const PersonalInfoCard = ({ memberData, onEditClick }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const fields = [
    { label: 'HỌ VÀ TÊN', value: memberData?.fullName || '' },
    { label: 'EMAIL', value: memberData?.email || '' },
    { label: 'SỐ ĐIỆN THOẠI', value: memberData?.phoneNumber || '' },
    { label: 'NGÀY SINH', value: formatDate(memberData?.dateOfBirth) },
    { label: 'GIỚI TÍNH', value: memberData?.gender || 'Nam' },
    { label: 'ĐỊA CHỈ', value: memberData?.address || '' },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#10131A]/90 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 relative flex flex-col space-y-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-[#111827] dark:text-white tracking-tight">
          Thông tin cá nhân
        </h3>
        <button
          type="button"
          onClick={onEditClick}
          className="text-[#9CA3AF] dark:text-white/40 hover:text-[#C00000] dark:hover:text-[#ff4d57] p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/8 transition-all cursor-pointer"
        >
          <Edit2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
        {fields.map((field, idx) => (
          <div key={idx} className="space-y-1.5 border-b border-gray-50 dark:border-white/8 pb-2">
            <span className="text-[10px] font-black tracking-widest text-[#9CA3AF] dark:text-white/40 uppercase block">
              {field.label}
            </span>
            <span className="text-sm font-bold text-[#1F2937] dark:text-white/85 block">
              {field.value || (
                <span className="text-[#D1D5DB] dark:text-white/25 font-normal">Chưa cập nhật</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalInfoCard;
