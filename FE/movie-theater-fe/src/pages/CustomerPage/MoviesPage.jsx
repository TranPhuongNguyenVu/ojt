import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import MovieService from '../../services/MovieService';
import MoviePoster from '../../components/MoviePoster';

const PAGE_SIZE = 10;
const TABS = [
  { key: 'now-showing', label: 'Phim đang chiếu' },
  { key: 'coming-soon', label: 'Phim sắp chiếu' },
];

const getRating = (movieId) => {
  if (!movieId) return '9.0';
  let sum = 0;
  for (let i = 0; i < movieId.length; i++) {
    sum += movieId.charCodeAt(i);
  }
  return ((sum % 16) / 10 + 8.0).toFixed(1);
};

const getMovieName = (movie) => movie.movieNameVn || movie.movieNameEnglish || '';

// Lọc theo status do BE tính (MovieStatusResolver), không tự suy ra từ fromDate/toDate:
// đây là trang công khai nên phải luôn ẩn UNSCHEDULED/INACTIVE, kể cả khi API trả về
// danh sách chưa lọc (trường hợp cookie của tài khoản Admin bị gửi kèm).
const splitBySchedule = (movieList) => {
  const active = movieList.filter((m) => m.status === 'SHOWING');
  const upcoming = movieList.filter((m) => m.status === 'UPCOMING');
  return { active, upcoming };
};

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const activeTab = searchParams.get('tab') === 'coming-soon' ? 'coming-soon' : 'now-showing';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const appliedKeyword = (searchParams.get('q') || '').trim();

  const applyMovieLists = (movieList) => {
    const { active, upcoming } = splitBySchedule(movieList);
    setNowShowing(active);
    setComingSoon(upcoming);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage('');

    const request = appliedKeyword
      ? MovieService.searchMovies(appliedKeyword)
      : MovieService.getAllMovies();

    request
      .then((response) => {
        if (cancelled) return;
        applyMovieLists(response.data.data || []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(appliedKeyword ? 'Lỗi tìm kiếm phim:' : 'Lỗi lấy danh sách phim:', error);
        setErrorMessage(appliedKeyword ? 'Không thể tìm kiếm phim.' : 'Không thể tải danh sách phim.');
        setNowShowing([]);
        setComingSoon([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedKeyword]);

  const movies = activeTab === 'coming-soon' ? comingSoon : nowShowing;
  const totalPages = Math.max(1, Math.ceil(movies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedMovies = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return movies.slice(start, start + PAGE_SIZE);
  }, [movies, safePage]);

  const buildParams = (overrides = {}) => {
    const next = {
      tab: activeTab,
      page: String(currentPage),
      ...overrides,
    };
    if (appliedKeyword) next.q = appliedKeyword;
    else delete next.q;
    return next;
  };

  const switchTab = (tabKey) => {
    setSearchParams(buildParams({ tab: tabKey, page: '1' }));
  };

  const switchPage = (page) => {
    setSearchParams(buildParams({ page: String(page) }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white dark:bg-transparent transition-colors duration-300">
        <div className="text-lg font-bold text-[#E50914] dark:text-[#4CC9F0] animate-pulse">
          Đang tải danh sách phim...
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full bg-white dark:bg-transparent py-12 px-6 md:px-16 font-sans min-h-[60vh] transition-colors duration-300 section-glow-trending">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center space-x-3 mb-8">
          <span className="w-[4px] h-8 bg-gradient-to-b from-[#E50914] to-[#7B61FF] rounded-full block shadow-[0_0_12px_rgba(229,9,20,0.55)]" />
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-gray-950 dark:text-white uppercase">
            Danh sách phim
          </h1>
        </div>

        {errorMessage && (
          <div className="mb-6 text-sm font-medium text-red-600 dark:text-red-400">{errorMessage}</div>
        )}

        <div className="flex flex-wrap gap-3 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-600/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 border border-transparent dark:border-white/10'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-80">
                ({tab.key === 'coming-soon' ? comingSoon.length : nowShowing.length})
              </span>
            </button>
          ))}
        </div>

        {pagedMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {pagedMovies.map((movie) => {
              const name = getMovieName(movie);
              return (
                <div key={movie.movieId} className="group">
                  <Link
                    to={`/detail/${movie.movieId}`}
                    className="poster-card relative aspect-[3/4] w-full rounded-[20px] overflow-hidden shadow-md bg-gray-900 block ring-1 ring-black/5 dark:ring-white/10"
                  >
                    <MoviePoster
                      movie={movie}
                      alt={name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-4">
                      <h3 className="text-white text-sm font-bold line-clamp-2">{name}</h3>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/55 dark:backdrop-blur-md px-2 py-1 rounded-md flex items-center space-x-1 shadow-sm z-20 border border-transparent dark:border-white/15">
                      <Star size={10} className="text-[#E50914] dark:text-[#F7B731]" fill="currentColor" />
                      <span className="text-[10px] font-extrabold text-gray-900 dark:text-white tracking-tighter">
                        {getRating(movie.movieId)}
                      </span>
                    </div>
                  </Link>
                  <Link
                    to={`/detail/${movie.movieId}`}
                    className="block pt-3 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#E50914] dark:group-hover:text-[#4CC9F0] transition-colors"
                  >
                    {name}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 cine-glass">
            <p className="text-gray-500 dark:text-white/60 font-semibold">
              {appliedKeyword ? 'Không tìm thấy tên phim này' : 'Hiện tại chưa có phim nào trong mục này.'}
            </p>
          </div>
        )}

        {movies.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              type="button"
              onClick={() => switchPage(safePage - 1)}
              disabled={safePage === 1}
              className="p-2 rounded-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-600 dark:text-white/60 px-4">
              Trang {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => switchPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-2 rounded-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Trang sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MoviesPage;
