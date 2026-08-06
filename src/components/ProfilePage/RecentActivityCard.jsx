import React, { useEffect, useState } from 'react';
import { ArrowRight, Coins } from 'lucide-react';
import BookingService from '../../services/BookingService';

const RecentActivityCard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BookingService.getPointsHistory()
      .then((res) => {
        setActivities(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy biến động điểm thành viên:", err);
        setLoading(false);
      });
  }, []);

  // Định dạng ngày
  const formatShowtime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split('T');
    if (parts.length !== 2) return dateTimeStr;
    const time = parts[1].substring(0, 5);
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateTimeStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} - ${time}`;
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse uppercase tracking-wider">
        Đang tải lịch sử điểm...
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col space-y-4 transition-colors duration-300">
      
      {/* Tiêu đề */}
      <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">
        Lịch sử điểm tích lũy
      </h3>

      {/* Danh sách giao dịch */}
      {activities.length > 0 ? (
        <div className="flex flex-col space-y-3.5">
          {activities.map((act) => {
            const isAdd = act.txnType === 'ADD';
            return (
              <div key={act.txnId} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="space-y-0.5 text-left flex-1 min-w-0 pr-3">
                  <div className="text-xs font-bold text-gray-850 truncate leading-snug">
                    {act.title}
                  </div>
                  <div className="text-[10px] font-medium text-gray-400">
                    📅 {formatShowtime(act.date)}
                  </div>
                </div>
                
                {/* Điểm tích lũy */}
                <div className={`flex items-center space-x-1 text-xs font-black flex-shrink-0 ${
                  isAdd ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  <span>{isAdd ? '+' : '-'}{act.points}</span>
                  <span className={`text-[9px] font-bold uppercase ${
                    isAdd ? 'text-emerald-500' : 'text-red-400'
                  }`}>pts</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-450 text-xs font-semibold text-center py-6 flex flex-col items-center justify-center space-y-2">
          <Coins size={24} className="text-gray-300" />
          <span>Chưa có biến động điểm thưởng nào được thực hiện.</span>
        </div>
      )}

      {/* Xem tất cả */}
      <button 
        onClick={() => alert("Hệ thống hiển thị tối đa lịch sử biến động điểm tích lũy của bạn.")}
        className="flex items-center justify-center space-x-1.5 w-full pt-2 text-xs font-bold text-[#C00000] hover:text-[#a00000] hover:underline transition-all"
      >
        <span>Xem toàn bộ lịch sử</span>
        <ArrowRight size={12} />
      </button>

    </div>
  );
};

export default RecentActivityCard;
