import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Calendar, Clock, Ticket } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';

const QuickBookingBar = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  
  const [errors, setErrors] = useState({ movie: '', date: '', time: '' });

  // Lấy danh sách phim đang khả dụng
  useEffect(() => {
    MovieService.getAllMovies()
      .then((res) => {
        setMovies(res.data.data || []);
      })
      .catch((err) => console.error("Lỗi tải danh sách phim:", err));
  }, []);

  // Lấy danh sách lịch chiếu khi phim thay đổi (Cascading Reset)
  useEffect(() => {
    if (!selectedMovieId) {
      setSchedules([]);
      setAvailableDates([]);
      setSelectedDate('');
      setAvailableTimes([]);
      setSelectedScheduleId('');
      return;
    }

    ScheduleService.getSchedulesByMovieId(selectedMovieId)
      .then((res) => {
        const list = res.data.data || [];
        
        // Lọc bỏ các suất chiếu trong quá khứ (Cho phép lệch múi giờ tối đa 10 phút)
        const now = new Date();
        const futureSchedules = list.filter(s => {
          if (!s.startTime) return false;
          const schedTime = new Date(s.startTime);
          return schedTime.getTime() > now.getTime() - 10 * 60 * 1000;
        });

        setSchedules(futureSchedules);

        // Trích xuất các ngày có lịch chiếu duy nhất
        const dates = [...new Set(futureSchedules.map(s => s.startTime.substring(0, 10)))];
        dates.sort();
        setAvailableDates(dates);
        
        // Reset các lựa chọn tiếp theo
        setSelectedDate('');
        setAvailableTimes([]);
        setSelectedScheduleId('');
      })
      .catch((err) => {
        console.error("Lỗi tải lịch chiếu:", err);
        setSchedules([]);
        setAvailableDates([]);
        setSelectedDate('');
        setAvailableTimes([]);
        setSelectedScheduleId('');
      });
  }, [selectedMovieId]);

  // Cập nhật giờ chiếu khi ngày thay đổi
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      setSelectedScheduleId('');
      return;
    }

    const filtered = schedules.filter(s => s.startTime.substring(0, 10) === selectedDate);
    // Sắp xếp tăng dần theo thời gian
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setAvailableTimes(filtered);
    setSelectedScheduleId('');
  }, [selectedDate, schedules]);

  const handleBookTicket = () => {
    const newErrors = { movie: '', date: '', time: '' };
    let hasError = false;

    if (!selectedMovieId) {
      newErrors.movie = 'Please select a movie';
      hasError = true;
    }
    if (selectedMovieId && !selectedDate) {
      newErrors.date = 'Please select the show date';
      hasError = true;
    }
    if (selectedDate && !selectedScheduleId) {
      newErrors.time = 'Please select showtime';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    // Chuyển hướng đến trang chọn ghế
    navigate(`/booking/seat/${selectedScheduleId}`);
  };

  const formatDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatTimeLabel = (timeStr) => {
    return timeStr.substring(11, 16);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-16 -mt-16 relative z-20">
      <div className="home-fade-up bg-white dark:bg-[#0A0A0F]/75 cine-glass-strong rounded-[20px] shadow-2xl shadow-gray-950/10 dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)] border border-gray-200/80 dark:border-white/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end [animation-delay:320ms] transition-colors duration-300 backdrop-blur-xl">
        
        {/* Chọn Phim */}
        <div className="space-y-2">
          <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase flex items-center gap-1.5">
            <Film size={12} className="text-[#E50914] dark:text-[#00E5FF]" /> PHIM
          </label>
          <select
            value={selectedMovieId}
            onChange={(e) => {
              setSelectedMovieId(e.target.value);
              setErrors(prev => ({ ...prev, movie: '' }));
            }}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl px-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-[#4CC9F0]/45 dark:focus:shadow-[0_0_0_3px_rgba(76,201,240,0.12)] transition-all text-gray-800 dark:text-white"
          >
            <option value="">Chọn phim...</option>
            {movies.map((m) => (
              <option key={m.movieId} value={m.movieId}>
                {m.movieNameVn || m.movieNameEnglish}
              </option>
            ))}
          </select>
          {errors.movie && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.movie}</p>}
        </div>

        {/* Chọn Ngày */}
        <div className="space-y-2">
          <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase flex items-center gap-1.5">
            <Calendar size={12} className="text-[#E50914] dark:text-[#F7B731]" /> NGÀY CHIẾU
          </label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setErrors(prev => ({ ...prev, date: '' }));
            }}
            disabled={!selectedMovieId}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl px-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-[#4CC9F0]/45 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-white"
          >
            <option value="">Chọn ngày...</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDateLabel(d)}
              </option>
            ))}
          </select>
          {errors.date && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* Chọn Suất */}
        <div className="space-y-2">
          <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase flex items-center gap-1.5">
            <Clock size={12} className="text-[#E50914] dark:text-[#7B61FF]" /> SUẤT CHIẾU
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => {
              setSelectedScheduleId(e.target.value);
              setErrors(prev => ({ ...prev, time: '' }));
            }}
            disabled={!selectedDate}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl px-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-[#4CC9F0]/45 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-white"
          >
            <option value="">Chọn suất...</option>
            {availableTimes.map((s) => (
              <option key={s.scheduleId} value={s.scheduleId}>
                {formatTimeLabel(s.startTime)} - {s.movieFormat || '2D'} ({s.cinemaRoomName})
              </option>
            ))}
          </select>
          {errors.time && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.time}</p>}
        </div>

        {/* Nút Đặt Vé */}
        <div>
          <button
            onClick={handleBookTicket}
            className="cine-btn-primary w-full bg-[#E50914] hover:bg-[#ff0f1b] text-white font-extrabold text-xs md:text-sm tracking-wider uppercase py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Ticket size={16} fill="currentColor" strokeWidth={0} />
            <span>ĐẶT VÉ NGAY</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuickBookingBar;
