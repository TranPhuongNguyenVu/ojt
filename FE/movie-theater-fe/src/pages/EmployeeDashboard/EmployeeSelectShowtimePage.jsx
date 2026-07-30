import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, Clock, Film, Star } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import { getMovieImageUrl } from '../../utils/movieImageUtils';
import AppleSelect from '../../components/AppleSelect';

const isFutureSchedule = (startTime) => {
  if (!startTime) return false;
  const startAt = new Date(startTime);
  return !Number.isNaN(startAt.getTime()) && startAt.getTime() > Date.now() - 10 * 60 * 1000;
};

const EmployeeSelectShowtimePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [movies, setMovies] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(location.state?.selectedMovieId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location.state?.selectedMovieId) return;
    setSelectedMovieId(location.state.selectedMovieId);
  }, [location.state?.selectedMovieId]);

  const activeMovies = useMemo(
    () => movies.filter((m) => m.status !== "INACTIVE"),
    [movies]
  );

  const getMovieName = useCallback(
    (m) => m?.movieNameVn || m?.movieNameEnglish || 'Phim',
    []
  );

  useEffect(() => {
    setLoading(true);
    MovieService.getAllMovies()
      .then((res) => {
        const list = (res.data.data || []).filter((m) => m.status !== "INACTIVE");
        setMovies(list);
        return Promise.all(
          list.map((m) =>
            ScheduleService.getSchedulesByMovieId(m.movieId)
              .then((scheduleRes) => scheduleRes.data.data || [])
              .catch(() => [])
          )
        );
      })
      .then((results) => {
        if (!results) return;
        setAllSchedules(
          results
            .flat()
            .filter((s) => s?.scheduleId && isFutureSchedule(s.startTime))
        );
      })
      .catch((err) => {
        console.error('Lỗi tải lịch chiếu:', err);
        setAllSchedules([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedMovie = useMemo(
    () => activeMovies.find((m) => m.movieId === selectedMovieId) || null,
    [activeMovies, selectedMovieId]
  );

  const schedulesForSelection = useMemo(() => {
    if (!selectedMovieId) return allSchedules;
    return allSchedules.filter((s) => s.movieId === selectedMovieId);
  }, [allSchedules, selectedMovieId]);

  const availableDates = useMemo(() => {
    const dates = [...new Set(schedulesForSelection.map((s) => s.startTime.substring(0, 10)))];
    return dates.sort();
  }, [schedulesForSelection]);

  const getSmallImageUrl = (movie) => getMovieImageUrl(movie);

  const moviesWithShowtimes = useMemo(() => {
    if (!selectedDate) return [];

    const grouped = schedulesForSelection
      .filter((s) => s.startTime.substring(0, 10) === selectedDate)
      .reduce((acc, schedule) => {
        if (!acc[schedule.movieId]) acc[schedule.movieId] = [];
        acc[schedule.movieId].push(schedule);
        return acc;
      }, {});

    return activeMovies
      .filter((m) => grouped[m.movieId]?.length > 0)
      .map((m) => ({
        movie: m,
        showtimes: grouped[m.movieId]
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((s) => ({
            scheduleId: s.scheduleId,
            time: s.startTime.substring(11, 16),
            roomName: s.cinemaRoomName || 'Phòng chiếu',
            format: s.movieFormat || s.versionName || null,
            versionId: s.versionId,
          })),
      }));
  }, [selectedDate, schedulesForSelection, activeMovies]);

  const formatDateChip = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('vi-VN', { month: 'short' });
    return { weekday, day, month };
  };

  const handleSelectShowtime = (scheduleId, movieId, time) => {
    navigate(`/employee/booking/seat/${scheduleId}`, {
      state: { movieId, date: selectedDate, time },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-lg font-bold text-[#E50914] animate-pulse">
          Đang tải lịch chiếu...
        </div>
      </div>
    );
  }

  const filteredMovies = moviesWithShowtimes.filter(
    ({ movie: m }) => !selectedMovieId || m.movieId === selectedMovieId
  );

  const genres = selectedMovie?.types && selectedMovie.types.length > 0
    ? selectedMovie.types.map((t) => t.typeName).join(', ')
    : selectedMovie?.types && selectedMovie.types.size > 0
      ? Array.from(selectedMovie.types).map((t) => t.typeName).join(', ')
      : 'Thể loại đang cập nhật';

  const movieFormats = selectedMovie?.versions && selectedMovie.versions.length > 0
    ? selectedMovie.versions.map((v) => v.versionName)
    : ['2D'];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-gray-300 dark:border-white/15 bg-white dark:bg-[#10131A] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} className="text-gray-700 dark:text-white/70" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Showtime
          </h1>
          <p className="text-xs text-gray-500 dark:text-white/50 font-semibold mt-1">
            Chọn ngày và suất chiếu để đặt vé tại quầy
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm p-6 space-y-6">
        {selectedMovie && (
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="w-28 aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm bg-white dark:bg-white/5 flex-shrink-0">
              <img
                src={getSmallImageUrl(selectedMovie)}
                alt={getMovieName(selectedMovie)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {getMovieName(selectedMovie)}
                </h2>
                {selectedMovie.movieNameVn && selectedMovie.movieNameEnglish && (
                  <p className="text-[10px] text-gray-500 dark:text-white/45 font-extrabold uppercase tracking-widest mt-1">
                    {selectedMovie.movieNameEnglish}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-white/60 font-bold">
                <div className="flex items-center space-x-1 text-[#E50914]">
                  <Star size={14} fill="currentColor" />
                  <span className="font-extrabold">8.9</span>
                  <span className="text-gray-400 dark:text-white/40 font-medium">/10</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={14} className="text-gray-400 dark:text-white/40" />
                  <span>{selectedMovie.duration || 120} Phút</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Film size={14} className="text-gray-400 dark:text-white/40" />
                  <span>{genres}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                {movieFormats.map((format, idx) => (
                  <span
                    key={idx}
                    className="bg-[#E5E5EA] dark:bg-white/15 border border-black/[0.06] dark:border-white/20 text-[#1C1C1E] dark:text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                  >
                    {format}
                  </span>
                ))}
                <span className="bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                  C18
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase flex items-center gap-1.5">
              <Film size={12} className="text-[#E50914]" /> Phim (tùy chọn)
            </label>
            <AppleSelect
              value={selectedMovieId}
              placeholder="Tất cả phim"
              icon={Film}
              options={[
                { value: "", label: "Tất cả phim", secondary: "Hiển thị mọi suất sắp tới" },
                ...activeMovies.map((m) => ({
                  value: m.movieId,
                  label: getMovieName(m),
                  secondary: m.movieNameEnglish && m.movieNameVn
                    ? m.movieNameEnglish
                    : m.duration
                      ? `${m.duration} phút`
                      : undefined,
                })),
              ]}
              onChange={(nextId) => {
                setSelectedMovieId(nextId);
                setSelectedDate("");
              }}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase flex items-center gap-1.5">
              <Calendar size={12} className="text-[#E50914]" /> Ngày chiếu
            </label>
            {availableDates.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/15 bg-gray-50/80 dark:bg-white/5 px-4 py-3.5 text-sm font-semibold text-gray-400 dark:text-white/40">
                <Calendar size={16} className="text-gray-300 dark:text-white/30 shrink-0" />
                {selectedMovieId
                  ? 'Chưa có ngày chiếu cho phim này'
                  : 'Chưa có lịch chiếu sắp tới'}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin">
                {availableDates.map((d) => {
                  const { weekday, day, month } = formatDateChip(d);
                  const isActive = selectedDate === d;
                  const isToday = d === new Date().toLocaleDateString('sv-SE');
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`relative shrink-0 min-w-[76px] rounded-[14px] border px-3 py-2.5 text-center transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'border-[#E50914] bg-[#E50914] text-white shadow-[0_8px_20px_rgba(229,9,20,0.35)]'
                          : isToday
                            ? 'border-[#E50914]/55 bg-[#FFF1F2] dark:bg-[#3A1216] text-[#1C1C1E] dark:text-white hover:border-[#E50914]'
                            : 'border-black/[0.08] dark:border-white/18 bg-[#F2F2F7] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-white hover:bg-[#EBEBF0] dark:hover:bg-white/[0.18] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] dark:shadow-none'
                      }`}
                    >
                      {isToday && !isActive && (
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#E50914] ring-2 ring-[#FFF1F2] dark:ring-[#3A1216]" />
                      )}
                      <div
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'text-white/85'
                            : isToday
                              ? 'text-[#E50914] dark:text-[#FF8A90]'
                              : 'text-[#636366] dark:text-white/70'
                        }`}
                      >
                        {weekday}
                      </div>
                      <div
                        className={`text-lg font-black leading-tight tabular-nums ${
                          isActive ? 'text-white' : 'text-[#1C1C1E] dark:text-white'
                        }`}
                      >
                        {day}
                      </div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wide ${
                          isActive
                            ? 'text-white/80'
                            : 'text-[#636366] dark:text-white/65'
                        }`}
                      >
                        {month}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedMovieId && availableDates.length === 0 && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                Phim này chưa có suất chiếu trong hệ thống. Vui lòng chọn phim khác hoặc liên hệ quản trị để thêm lịch.
              </p>
            )}
          </div>
        </div>

        {selectedDate && (
          <div className="space-y-5">
            {filteredMovies.map(({ movie: m, showtimes }) => (
              <div key={m.movieId} className="space-y-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">
                  {getMovieName(m)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {showtimes.map((slot) => (
                    <button
                      key={slot.scheduleId}
                      type="button"
                      onClick={() => handleSelectShowtime(slot.scheduleId, m.movieId, slot.time)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] border border-black/[0.08] dark:border-white/15 bg-[#F2F2F7] dark:bg-white/[0.10] text-[#1C1C1E] dark:text-white hover:border-[#E50914] hover:bg-[#FFF1F2] dark:hover:bg-[#3A1216] hover:text-[#E50914] dark:hover:text-[#ff8a90] text-sm font-bold transition-all cursor-pointer"
                    >
                      <Clock size={13} strokeWidth={2.4} className="shrink-0 opacity-70" />
                      <span className="tabular-nums">{slot.time}</span>
                      <span className="text-[#8E8E93] dark:text-white/35 font-semibold">·</span>
                      <span>{slot.roomName}</span>
                      {slot.format && (
                        <>
                          <span className="text-[#8E8E93] dark:text-white/35 font-semibold">·</span>
                          <span className="inline-flex items-center rounded-md bg-black/[0.06] dark:bg-white/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1C1C1E] dark:text-white">
                            {slot.format}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredMovies.length === 0 && (
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 rounded-xl text-center text-gray-500 dark:text-white/50 font-bold text-sm">
                No showtime
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelectShowtimePage;
