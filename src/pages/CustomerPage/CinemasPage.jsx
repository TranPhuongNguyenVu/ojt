import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, MonitorPlay } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import MoviePoster from '../../components/MoviePoster';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const GRACE_MS = 10 * 60 * 1000;

const isBookableSchedule = (startTime) => {
  if (!startTime) return false;
  const startAt = new Date(startTime);
  return !Number.isNaN(startAt.getTime()) && startAt.getTime() > Date.now() - GRACE_MS;
};

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDateStr(d);
};

const buildDayFromDateStr = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = todayStr();
  return {
    dateStr,
    dayName: dateStr === today ? 'Hôm Nay' : WEEKDAYS[d.getDay()],
    dateNum: d.getDate(),
    monthStr: String(d.getMonth() + 1).padStart(2, '0'),
  };
};

/** 7 ngày tới; nếu chưa có lịch sắp tới thì thêm vài ngày gần nhất có dữ liệu BE */
const buildDayOptions = (scheduleDateStrs) => {
  const set = new Set();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    set.add(toDateStr(d));
  }

  const today = todayStr();
  const hasUpcoming = scheduleDateStrs.some((d) => d >= today);
  if (!hasUpcoming) {
    [...new Set(scheduleDateStrs)]
      .filter((d) => d < today)
      .sort()
      .slice(-5)
      .forEach((d) => set.add(d));
  }

  return [...set].sort().map(buildDayFromDateStr);
};

const pickDefaultDate = (days, schedules) => {
  const today = todayStr();
  if (days.some((d) => d.dateStr === today)) {
    const hasToday = schedules.some(
      (s) => s.startTime?.substring(0, 10) === today && isBookableSchedule(s.startTime)
    );
    if (hasToday) return today;
  }

  const futureDates = [
    ...new Set(
      schedules
        .filter((s) => isBookableSchedule(s.startTime))
        .map((s) => s.startTime.substring(0, 10))
    ),
  ].sort();
  if (futureDates.length > 0) {
    const match = days.find((d) => futureDates.includes(d.dateStr));
    if (match) return match.dateStr;
  }

  const anyDates = [
    ...new Set(schedules.map((s) => s.startTime?.substring(0, 10)).filter(Boolean)),
  ].sort();
  const nearestPastOrAny = [...anyDates].reverse().find((d) => days.some((day) => day.dateStr === d));
  return nearestPastOrAny || days[0]?.dateStr || today;
};

const getMovieName = (movie) => movie?.movieNameVn || movie?.movieNameEnglish || 'Phim';

const getMovieFormats = (movie) => {
  if (movie?.versions?.length > 0) {
    return movie.versions.map((v) => v.versionName).filter(Boolean);
  }
  return [];
};

const CinemasPage = () => {
  const navigate = useNavigate();
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [movies, setMovies] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage('');

    Promise.all([MovieService.getAllMovies(), ScheduleService.getAll()])
      .then(([movieRes, scheduleRes]) => {
        if (cancelled) return;
        const movieList = (movieRes.data.data || []).filter(
          (m) => m.status === 'SHOWING' || m.status === 'UPCOMING'
        );
        // Giữ cả suất đã qua trong khoảng gần đây để vẫn hiện UI theo dữ liệu BE;
        // nút giờ đã qua sẽ bị disable.
        const scheduleList = (scheduleRes.data.data || []).filter(
          (s) => s?.scheduleId && s?.startTime && s?.movieId
        );
        setMovies(movieList);
        setSchedules(scheduleList);
        const dateStrs = scheduleList.map((s) => s.startTime.substring(0, 10));
        const days = buildDayOptions(dateStrs);
        setSelectedDateStr(pickDefaultDate(days, scheduleList));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Lỗi tải lịch chiếu rạp:', error);
        setErrorMessage('Không thể tải lịch chiếu. Vui lòng thử lại.');
        setMovies([]);
        setSchedules([]);
        setSelectedDateStr(todayStr());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => {
    const dateStrs = schedules.map((s) => s.startTime.substring(0, 10));
    return buildDayOptions(dateStrs);
  }, [schedules]);

  const moviesWithRooms = useMemo(() => {
    if (!selectedDateStr) return [];

    const byMovie = schedules
      .filter((s) => s.startTime?.substring(0, 10) === selectedDateStr)
      .reduce((acc, s) => {
        if (!acc[s.movieId]) acc[s.movieId] = [];
        acc[s.movieId].push(s);
        return acc;
      }, {});

    return movies
      .filter((m) => byMovie[m.movieId]?.length > 0)
      .map((movie) => {
        const slots = byMovie[movie.movieId]
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        const roomMap = slots.reduce((acc, s) => {
          const roomKey = s.cinemaRoomId ?? s.cinemaRoomName ?? 'unknown';
          if (!acc[roomKey]) {
            acc[roomKey] = {
              roomId: s.cinemaRoomId,
              roomName: s.cinemaRoomName || 'Phòng chiếu',
              format: s.movieFormat || null,
              showtimes: [],
            };
          }
          acc[roomKey].showtimes.push({
            scheduleId: s.scheduleId,
            time: s.startTime.substring(11, 16),
            format: s.movieFormat || null,
            bookable: isBookableSchedule(s.startTime),
          });
          return acc;
        }, {});

        const formatsFromSchedules = [
          ...new Set(slots.map((s) => s.movieFormat).filter(Boolean)),
        ];
        const formats =
          formatsFromSchedules.length > 0
            ? formatsFromSchedules
            : getMovieFormats(movie);

        return {
          movie,
          formats,
          rooms: Object.values(roomMap).sort((a, b) =>
            a.roomName.localeCompare(b.roomName, 'vi')
          ),
        };
      });
  }, [movies, schedules, selectedDateStr]);

  const handleSelectShowtime = (scheduleId, movieId, time, bookable) => {
    if (!bookable) return;
    navigate(`/booking/seat/${scheduleId}`, {
      state: { movieId, date: selectedDateStr, time },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--cine-bg-0)]">
        <p className="text-lg font-bold text-[var(--cine-red)] animate-pulse">
          Đang tải lịch chiếu...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cine-bg-0)] text-[var(--cine-text)] pb-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-16 pt-8 md:pt-12 space-y-9 md:space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Lịch chiếu
          </h1>
          <p className="text-sm md:text-base text-[var(--cine-muted)] font-semibold">
            Chọn ngày, phòng và suất chiếu để đặt vé
          </p>
        </header>

        <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`min-w-[88px] py-4 px-2.5 rounded-xl flex-shrink-0 flex flex-col items-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[var(--cine-red)] border-[var(--cine-red)] text-white shadow-lg shadow-red-900/25'
                    : 'bg-[var(--cine-bg-1)] dark:bg-[var(--cine-bg-2)] border-[var(--cine-border)] text-[var(--cine-text)] hover:border-[var(--cine-red)]/50'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-white/80' : 'text-[var(--cine-muted)]'
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="text-3xl font-black leading-none tabular-nums">
                  {day.dateNum}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest ${
                    isSelected ? 'text-white/75' : 'text-[var(--cine-muted)]'
                  }`}
                >
                  T. {day.monthStr}
                </span>
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-600 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {!errorMessage && moviesWithRooms.length === 0 && (
          <div className="rounded-2xl border border-[var(--cine-border)] bg-[var(--cine-bg-1)] dark:bg-[var(--cine-bg-2)] px-6 py-14 text-center">
            <p className="text-sm font-bold text-[var(--cine-muted)]">
              Không có suất chiếu cho ngày này.
            </p>
            <Link
              to="/movies"
              className="inline-block mt-4 text-sm font-bold text-[var(--cine-red)] hover:underline"
            >
              Xem danh sách phim
            </Link>
          </div>
        )}

        <div className="space-y-12 md:space-y-14">
          {moviesWithRooms.map(({ movie, formats, rooms }) => {
            const title = getMovieName(movie);
            const englishTitle =
              movie.movieNameVn && movie.movieNameEnglish
                ? movie.movieNameEnglish
                : null;

            return (
              <article
                key={movie.movieId}
                className="flex flex-col sm:flex-row gap-6 sm:gap-8 md:gap-10"
              >
                <Link
                  to={`/detail/${movie.movieId}`}
                  className="shrink-0 w-[140px] sm:w-[160px] md:w-[180px] mx-auto sm:mx-0"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-[var(--cine-bg-2)] border border-[var(--cine-border)]">
                    <MoviePoster
                      movie={movie}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0 space-y-5 text-center sm:text-left">
                  <div className="space-y-2.5">
                    <Link to={`/detail/${movie.movieId}`} className="group">
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--cine-text)] group-hover:text-[var(--cine-red)] transition-colors">
                        {title}
                      </h2>
                    </Link>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3.5 gap-y-1.5 text-sm md:text-base font-semibold text-[var(--cine-muted)]">
                      {englishTitle && (
                        <span className="uppercase tracking-wide">{englishTitle}</span>
                      )}
                      {englishTitle && (
                        <span className="hidden sm:inline opacity-40">·</span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={16} strokeWidth={2.2} className="text-[#F04438]" />
                        {movie.duration || '—'} phút
                      </span>
                      {formats.length > 0 && (
                        <>
                          <span className="hidden sm:inline opacity-40">·</span>
                          <span className="inline-flex items-center gap-1.5">
                            <MonitorPlay size={16} strokeWidth={2.2} className="text-[#F04438]" />
                            {formats.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {rooms.map((room) => (
                      <div key={room.roomId ?? room.roomName} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--cine-text)]">
                            {room.roomName}
                          </h3>
                          {room.format && (
                            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/10 text-[var(--cine-muted)]">
                              {room.format}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                          {room.showtimes.map((slot) => (
                            <button
                              key={slot.scheduleId}
                              type="button"
                              disabled={!slot.bookable}
                              title={slot.bookable ? undefined : 'Suất chiếu đã qua'}
                              onClick={() =>
                                handleSelectShowtime(
                                  slot.scheduleId,
                                  movie.movieId,
                                  slot.time,
                                  slot.bookable
                                )
                              }
                              className={`inline-flex items-center justify-center min-w-[96px] h-12 px-6 rounded-full border border-[#F04438] bg-[#2a2a2a] text-[#F04438] text-base md:text-lg font-bold tabular-nums leading-none transition-all ${
                                slot.bookable
                                  ? 'hover:bg-[#F04438] hover:text-white cursor-pointer active:scale-95'
                                  : 'cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CinemasPage;
