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
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 relative flex flex-col space-y-6 transition-colors duration-300">
      
      {/* Tiêu đề & Nút sửa nhanh */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-gray-900 tracking-tight">Thông tin cá nhân</h3>
        <button onClick={onEditClick} className="text-gray-400 dark:text-gray-500 hover:text-[#C00000] dark:hover:text-[#E50914] p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
          <Edit2 size={16} />
        </button>
      </div>

      {/* Grid chứa các trường thông tin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
        {fields.map((field, idx) => (
          <div key={idx} className="space-y-1.5 border-b border-gray-50 pb-2">
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase block">
              {field.label}
            </span>
            <span className="text-sm font-bold text-gray-800 block">
              {field.value || <span className="text-gray-300 font-normal italic">Chưa cập nhật</span>}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PersonalInfoCard;
