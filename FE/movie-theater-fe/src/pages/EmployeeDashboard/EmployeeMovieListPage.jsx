import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clock } from "lucide-react";
import MovieService from "../../services/MovieService";
import ScheduleService from "../../services/ScheduleService";
import MoviePoster from "../../components/MoviePoster";

const PAGE_SIZE = 12;
const INACTIVE_STATUSES = new Set(["INACTIVE", "UNSCHEDULED", "ENDED"]);
const ACTIVE_SCHEDULE_STATUSES = new Set(["SCHEDULED", "SOLD_OUT"]);

const getLocalDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const scheduleDate = (startTime) => {
  if (!startTime) return "";
  // LocalDateTime from BE: "2026-07-27T08:00:00" — lấy 10 ký tự đầu
  return String(startTime).substring(0, 10);
};

const EmployeeMovieListPage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [showCounts, setShowCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const today = getLocalDate();

    setLoading(true);

    Promise.all([
      MovieService.getAllMovies(),
      ScheduleService.filter({ date: today }),
    ])
      .then(([movieRes, scheduleRes]) => {
        if (cancelled) return;

        const todaySchedules = (scheduleRes.data?.data || []).filter((s) => {
          if (!ACTIVE_SCHEDULE_STATUSES.has(s.status)) return false;
          return scheduleDate(s.startTime) === today;
        });

        const countByMovie = todaySchedules.reduce((acc, s) => {
          if (!s.movieId) return acc;
          acc[s.movieId] = (acc[s.movieId] || 0) + 1;
          return acc;
        }, {});

        const movieIdsToday = new Set(Object.keys(countByMovie));

        const moviesToday = (movieRes.data?.data || []).filter((movie) => {
          if (!movieIdsToday.has(movie.movieId)) return false;
          if (movie.isDeleted === 1) return false;
          const status = (movie.status || "").toUpperCase();
          if (status && INACTIVE_STATUSES.has(status)) return false;
          return true;
        });

        setShowCounts(countByMovie);
        setMovies(moviesToday);
      })
      .catch((error) => {
        console.error("Lỗi tải danh sách phim chiếu hôm nay:", error);
        if (!cancelled) {
          setMovies([]);
          setShowCounts({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMovies = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return movies;
    return movies.filter((movie) =>
      [movie.movieNameVn, movie.movieNameEnglish, movie.movieId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [movies, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedMovies = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredMovies.slice(start, start + PAGE_SIZE);
  }, [filteredMovies, safePage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C00000] dark:text-[#ff4d57]">
            Danh sách phim
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">
            Phim chiếu hôm nay
          </h1>
          {!loading && (
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/50">
              {movies.length} phim có suất chiếu trong ngày
            </p>
          )}
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm tên phim..."
          className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#4CC9F0]/40 sm:w-72"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-gray-400 dark:text-white/40">
          Đang tải danh sách phim...
        </div>
      ) : pagedMovies.length === 0 ? (
        <div className="py-16 text-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">
          Không có phim chiếu hôm nay
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {pagedMovies.map((movie) => (
            <button
              key={movie.movieId}
              type="button"
              onClick={() =>
                navigate("/employee/showtime", {
                  state: { selectedMovieId: movie.movieId },
                })
              }
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#C00000] dark:hover:border-[#E50914] hover:shadow-md"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                <MoviePoster movie={movie} className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[#C00000] dark:text-[#ff4d57]">
                  <Film size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Chiếu hôm nay
                  </span>
                </div>
                <h2 className="line-clamp-2 text-sm font-black text-gray-950 dark:text-white">
                  {movie.movieNameVn || movie.movieNameEnglish}
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/50">
                  <Clock size={12} />
                  <span>
                    {showCounts[movie.movieId] || 0} suất ·{" "}
                    {movie.duration ? `${movie.duration} phút` : "Phim"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safePage === 1}
            className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-white/60 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs font-bold text-gray-500 dark:text-white/50">
            Trang {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safePage === totalPages}
            className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-white/60 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeMovieListPage;
