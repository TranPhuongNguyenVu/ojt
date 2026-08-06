import React from 'react';
import { Award } from 'lucide-react';

const RewardPointsCard = ({ memberData }) => {
  const currentPoints = memberData?.score || 0;

  return (
    <div className="w-full h-full bg-[#C00000] text-white rounded-2xl p-6 shadow-md shadow-red-900/10 flex flex-col items-center justify-center text-center relative overflow-hidden">

      {/* Nền họa tiết chìm để tạo độ sâu thiết kế */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
        <Award size={160} strokeWidth={1} />
      </div>

      <div className="space-y-3 relative z-10">

        {/* Tiêu đề */}
        <span className="text-xs font-black tracking-widest text-red-200 uppercase">
          ĐIỂM TÍCH LŨY
        </span>

        {/* Số điểm to nổi bật */}
        <div className="space-y-1.5">
          <div className="text-7xl font-black tracking-tight leading-none">
            {currentPoints.toLocaleString()}
          </div>
          <div className="text-sm font-bold text-red-200 uppercase tracking-widest">
            Reward Points
          </div>
        </div>

      </div>

    </div>
  );
};

export default RewardPointsCard;
