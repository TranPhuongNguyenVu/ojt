import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Clock, Film, Star } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import posterImg from "../../assets/imgs/Vidu_Film.jpeg";
import BookingStepper from '../../components/BookingStepper';

const SelectShowtimePage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState(''); // Định dạng YYYY-MM-DD

  // Generate 7 days starting from today
  useEffect(() => {
    const list = [];
    const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const dayName = i === 0 ? "Hôm Nay" : weekdays[d.getDay()];
      const dateNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const year = d.getFullYear();
      const dateStr = `${year}-${monthStr}-${dateNum < 10 ? '0' + dateNum : dateNum}`;

      list.push({
        dayName,
        dateNum,
        monthStr,
        dateStr
      });
    }
    setDays(list);
    if (list.length > 0) {
      setSelectedDateStr(list[0].dateStr);
    }
  }, []);

  // Fetch Movie details and showtimes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      MovieService.getMovieById(movieId),
      ScheduleService.getSchedulesByMovieId(movieId)
    ])
      .then(([movieRes, scheduleRes]) => {
        setMovie(movieRes.data.data);
        const now = Date.now() - 10 * 60 * 1000;
        const validSchedules = (scheduleRes.data.data || []).filter((s) => {
          if (!s?.startTime) return false;
          const startAt = new Date(s.startTime);
          return !Number.isNaN(startAt.getTime()) && startAt.getTime() > now;
        });
        setSchedules(validSchedules);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu lịch chiếu:", err);
        setLoading(false);
      });
  }, [movieId]);

  // Trích xuất ảnh Unsplash nếu khớp mockup
  const getSmallImageUrl = (image) => {
    if (!image) return posterImg;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    const mockSmallImages = {
      'small1.jpg': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      'small2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
      'small3.jpg': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80',
      'small4.jpg': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
      'small5.jpg': 'https://images.unsplash.com/photo-1460889418202-14ebd473d78c?w=500&auto=format&fit=crop&q=80',
    };
    return mockSmallImages[image] || posterImg;
  };

  if (loading) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-[#E50914] animate-pulse">
          Đang tải lịch chiếu phim...
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-gray-500 dark:text-white/70">
          Không tìm thấy thông tin bộ phim này.
        </div>
      </div>
    );
  }

  // Lọc lịch chiếu theo ngày được chọn
  const filteredSchedules = schedules.filter(s => {
    if (!s.startTime) return false;
    return s.startTime.substring(0, 10) === selectedDateStr;
  });

  // Nhóm lịch chiếu theo tên phòng
  const groupedSchedules = filteredSchedules.reduce((acc, s) => {
    const roomName = s.cinemaRoomName || 'Phòng Khác';
    if (!acc[roomName]) {
      acc[roomName] = {
        roomName,
        format: s.movieFormat || '2D DIGITAL',
        slots: []
      };
    }
    // Lấy phần giờ chiếu HH:mm từ startTime (ví dụ "2026-06-29T10:00:00" -> "10:00")
    let timeStr = "";
    if (s.startTime) {
      const timeParts = s.startTime.split('T');
      if (timeParts.length === 2) {
        timeStr = timeParts[1].substring(0, 5);
      }
    }
    acc[roomName].slots.push({
      scheduleId: s.scheduleId,
      time: timeStr,
      goldenHourExtra: s.goldenHourExtra,
    });
    return acc;
  }, {});

  // Sắp xếp các suất chiếu trong phòng theo thời gian tăng dần
  Object.values(groupedSchedules).forEach(group => {
    group.slots.sort((a, b) => a.time.localeCompare(b.time));
  });

  // Lấy danh sách thể loại dạng chuỗi
  const genres = movie.types && movie.types.length > 0 
    ? movie.types.map(t => t.typeName).join(', ') 
    : movie.types && movie.types.size > 0 
      ? Array.from(movie.types).map(t => t.typeName).join(', ')
      : 'Thể loại đang cập nhật';

  // Định dạng phim hiển thị tag
  const movieFormats = movie.versions && movie.versions.length > 0
    ? movie.versions.map(v => v.versionName)
    : ['2D'];

  const handleSelectShowtime = (slot) => {
    navigate(`/booking/seat/${slot.scheduleId}`, {
      state: {
        movieId,
        date: selectedDateStr,
        time: slot.time,
      },
    });
  };

  return (
    <div className="cine-booking-canvas bg-[#F8F9FA] dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      <BookingStepper currentStep={1} />
      
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8 space-y-8">
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
          >
            <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
              {movie.movieNameVn || movie.movieNameEnglish}
            </h1>
            {movie.movieNameVn && movie.movieNameEnglish && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mt-1">
                {movie.movieNameEnglish}
              </p>
            )}
          </div>
        </div>

        {/* ================= MOVIE SUMMARY CARD ================= */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-5 items-center sm:items-start transition-colors duration-300">
          <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <img 
              src={getSmallImageUrl(movie.smallImage)} 
              alt="Movie Poster" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-between space-y-4 text-center sm:text-left">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300 font-bold">
                
                {/* Đánh giá */}
                <div className="flex items-center space-x-1 text-[#E50914]">
                  <Star size={14} fill="currentColor" />
                  <span className="font-extrabold">8.9</span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">/10</span>
                </div>

                {/* Thời lượng */}
                <div className="flex items-center space-x-1">
                  <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{movie.duration || 120} Phút</span>
                </div>

                {/* Thể loại */}
                <div className="flex items-center space-x-1">
                  <Film size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{genres}</span>
                </div>

              </div>
              
              {/* Định dạng và Tag tuổi */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1.5">
                {movieFormats.map((format, idx) => (
                  <span key={idx} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                    {format}
                  </span>
                ))}
                <span className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                  C18
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CHỌN NGÀY CHIẾU ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Chọn ngày chiếu
            </h2>
            <div className="flex space-x-1">
              <button className="p-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
            {days.map((day, idx) => {
              const isSelected = day.dateStr === selectedDateStr;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`w-[85px] py-4 px-2 rounded-xl flex-shrink-0 flex flex-col items-center justify-center space-y-1 border shadow-sm transition-all cursor-pointer transform active:scale-95 ${
                    isSelected 
                      ? 'bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900' 
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {day.dayName}
                  </span>
                  <span className="text-2xl font-black leading-none">
                    {day.dateNum}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isSelected ? 'text-gray-350 dark:text-gray-500' : 'text-gray-450 dark:text-gray-500'}`}>
                    T. {day.monthStr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= DANH SÁCH PHÒNG & SUẤT CHIẾU ================= */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            Danh sách Phòng & Suất chiếu
          </h2>

          {Object.keys(groupedSchedules).length > 0 ? (
            <div className="space-y-5">
              {Object.values(groupedSchedules).map((group, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  {/* Phòng chiếu & Tim yêu thích */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {group.roomName}
                    </h3>
                    <button className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
                      <Heart size={18} />
                    </button>
                  </div>

                  {/* Định dạng phòng chiếu */}
                  <div className="space-y-3.5">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      ĐỊNH DẠNG {group.format}
                    </p>
                    
                    {/* Các suất chiếu */}
                    <div className="flex flex-wrap gap-3">
                      {group.slots.map((slot, sIdx) => {
                        const isGolden = Number(slot.goldenHourExtra) > 0;
                        return (
                          <button
                            key={sIdx}
                            onClick={() => handleSelectShowtime(slot)}
                            className="relative px-5 py-2.5 rounded border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-950 hover:border-[#E50914] hover:bg-[#E50914] hover:text-white transition-all font-bold text-xs md:text-sm text-gray-800 dark:text-gray-200 shadow-sm cursor-pointer transform active:scale-95"
                          >
                            {slot.time}
                            {isGolden && (
                              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[8px] font-black uppercase tracking-wide shadow-sm">
                                +{Number(slot.goldenHourExtra).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 p-10 rounded-2xl text-center text-gray-450 dark:text-gray-500 font-bold text-sm">
              No showtime
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SelectShowtimePage;
