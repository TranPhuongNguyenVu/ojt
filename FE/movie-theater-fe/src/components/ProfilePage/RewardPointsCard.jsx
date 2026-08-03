import React from 'react';
import { Award, Zap } from 'lucide-react';
import { getMembershipTier } from '../../utils/membershipTier';

const RewardPointsCard = ({ memberData }) => {
  const currentPoints = memberData?.score || 0;

  // Tự động phân hạng & tính tiến trình lên hạng tiếp theo
  const { tier, nextTier, targetPoints } = getMembershipTier(currentPoints);

  const percentage = targetPoints > 0 ? Math.min((currentPoints / targetPoints) * 100, 100) : 100;

  return (
    <div className="w-full h-full bg-[#C00000] text-white rounded-2xl p-6 shadow-md shadow-red-900/10 flex flex-col justify-between relative overflow-hidden">
      
      {/* Nền họa tiết chìm để tạo độ sâu thiết kế */}
      <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
        <Award size={160} strokeWidth={1} />
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* Tiêu đề & Icon */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-red-200 uppercase">
            ĐIỂM TÍCH LŨY
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase flex items-center gap-1">
            <Zap size={10} className="fill-white" />
            Hạng {tier}
          </span>
        </div>

        {/* Số điểm to nổi bật */}
        <div className="space-y-1">
          <div className="text-4xl font-black tracking-tight leading-none">
            {currentPoints.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-red-200 uppercase tracking-widest">
            Reward Points
          </div>
        </div>

        {/* Thanh tiến trình nâng hạng */}
        {tier !== 'Platinum' ? (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-red-100">
              <span>Tiến trình lên hạng {nextTier}</span>
              <span>{currentPoints} / {targetPoints} pts</span>
            </div>
            
            {/* Thanh progress bar xịn */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <div className="text-[9px] font-medium text-red-200 italic">
              * Tích lũy thêm {(targetPoints - currentPoints)} điểm để nâng hạng {nextTier}.
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-red-100">
              <span>Hạng thành viên tối đa</span>
              <span>{currentPoints} pts</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-full"></div>
            </div>
            <div className="text-[9px] font-medium text-red-200 italic">
              * Bạn đã đạt hạng cao nhất (Platinum). Xin chúc mừng!
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default RewardPointsCard;
