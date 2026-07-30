import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Star } from 'lucide-react';
import MovieService from '../../services/MovieService';
import MoviePoster from '../../components/MoviePoster';

const PAGE_SIZE = 10;
const SUGGESTION_LIMIT = 8;
const TABS = [
  { key: 'now-showing', label: 'Phim đang chiếu' },
  { key: 'coming-soon', label: 'Phim sắp chiếu' },
];

const getLocalDate = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};

const getRating = (movieId) => {
  if (!movieId) return '9.0';
  let sum = 0;
  for (let i = 0; i < movieId.length; i++) {
    sum += movieId.charCodeAt(i);
  }
  return ((sum % 16) / 10 + 8.0).toFixed(1);
};

const getMovieName = (movie) => movie.movieNameVn || movie.movieNameEnglish || '';

const splitBySchedule = (movieList) => {
  const today = getLocalDate();
  const active = movieList.filter(
    (m) => m.fromDate <= today && (!m.toDate || m.toDate >= today)
  );
  const upcoming = movieList.filter((m) => m.fromDate > today);
  return { active, upcoming };
};

const MoviesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allMovies, setAllMovies] = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);

  const activeTab = searchParams.get('tab') === 'coming-soon' ? 'coming-soon' : 'now-showing';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const applyMovieLists = (movieList) => {
    const { active, upcoming } = splitBySchedule(movieList);
    setNowShowing(active);
    setComingSoon(upcoming);
  };

  const loadAllMovies = () => {
    setLoading(true);
    setErrorMessage('');
    MovieService.getAllMovies()
      .then((response) => {
        const data = response.data.data || [];
        setAllMovies(data);
        applyMovieLists(data);
      })
      .catch((error) => {
        console.error('Lỗi lấy danh sách phim:', error);
        setErrorMessage('Không thể tải danh sách phim.');
        setAllMovies([]);
        setNowShowing([]);
        setComingSoon([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllMovies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return [];

    return allMovies
      .filter((movie) => {
        const vn = (movie.movieNameVn || '').toLowerCase();
        const en = (movie.movieNameEnglish || '').toLowerCase();
        return vn.includes(query) || en.includes(query);
      })
      .sort((a, b) => getMovieName(a).localeCompare(getMovieName(b), 'vi', { sensitivity: 'base' }))
      .slice(0, SUGGESTION_LIMIT);
  }, [keyword, allMovies]);

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (movie) => {
    const name = getMovieName(movie);
    setKeyword(name);
    setShowSuggestions(false);
    navigate(`/detail/${movie.movieId}`);
  };

  const handleSearch = () => {
    const trimmed = keyword.trim();
    setAppliedKeyword(trimmed);
    setShowSuggestions(false);
    setSearchParams({ tab: activeTab, page: '1' });

    if (!trimmed) {
      loadAllMovies();
      return;
    }

    setLoading(true);
    setErrorMessage('');
    MovieService.searchMovies(trimmed)
      .then((response) => {
        applyMovieLists(response.data.data || []);
      })
      .catch((error) => {
        console.error('Lỗi tìm kiếm phim:', error);
        setErrorMessage('Không thể tìm kiếm phim.');
        setNowShowing([]);
        setComingSoon([]);
      })
      .finally(() => setLoading(false));
  };

  const movies = activeTab === 'coming-soon' ? comingSoon : nowShowing;
  const totalPages = Math.max(1, Math.ceil(movies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedMovies = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return movies.slice(start, start + PAGE_SIZE);
  }, [movies, safePage]);

  const switchTab = (tabKey) => {
    setSearchParams({ tab: tabKey, page: '1' });
  };

  const switchPage = (page) => {
    setSearchParams({ tab: activeTab, page: String(page) });
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

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 min-w-0" ref={searchBoxRef}>
            <input
              type="text"
              value={keyword}
              onChange={handleKeywordChange}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              maxLength={100}
              placeholder="Nhập tên phim..."
              className="w-full bg-gray-100 dark:bg-white/5 text-sm text-gray-800 dark:text-white/90 rounded-full px-5 py-2.5 border border-transparent dark:border-white/10 focus:outline-none focus:bg-white dark:focus:bg-[#10131A]/90 focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#4CC9F0]/40 dark:focus:border-[#4CC9F0]/50 placeholder-gray-400 dark:placeholder-white/35 transition-all"
              aria-label="Tìm kiếm phim"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && keyword.trim().length > 0}
            />
            {showSuggestions && keyword.trim() && (
              <ul className="absolute left-0 right-0 top-full mt-2 z-30 bg-white dark:bg-[#10131A]/95 dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((movie) => (
                    <li key={movie.movieId}>
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(movie)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                      >
                        <span className="font-semibold">{getMovieName(movie)}</span>
                        {movie.movieNameVn && movie.movieNameEnglish && movie.movieNameVn !== movie.movieNameEnglish && (
                          <span className="block text-xs text-gray-400 dark:text-white/40 mt-0.5">{movie.movieNameEnglish}</span>
                        )}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-gray-500 dark:text-white/50">No movies found</li>
                )}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#c40812] dark:hover:bg-[#ff1a25] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors shrink-0 shadow-lg shadow-red-600/20"
          >
            <Search size={16} />
            Tìm kiếm
          </button>
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
