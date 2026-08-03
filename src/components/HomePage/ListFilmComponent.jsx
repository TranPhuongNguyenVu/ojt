import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Ticket, Clock, Calendar, Play, Heart, Clapperboard } from 'lucide-react';
import MoviePoster from '../MoviePoster.jsx';

const getRating = (movieId) => {
  if (!movieId) return '9.0';
  let sum = 0;
  for (let i = 0; i < movieId.length; i++) {
    sum += movieId.charCodeAt(i);
  }
  return ((sum % 16) / 10 + 8.0).toFixed(1);
};

const getGenres = (movie, limit = 2) => {
  const types = movie?.types;
  if (!types) return [];
  const list = Array.isArray(types) ? types : Array.from(types);
  return list.slice(0, limit).map((t) => t.typeName);
};

const getFirstGenre = (movie) => {
  const genres = getGenres(movie, 1);
  return genres[0] || null;
};

const formatReleaseDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const getSectionGlow = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('sắp')) return 'section-glow-scifi';
  if (t.includes('đang')) return 'section-glow-trending';
  if (t.includes('hành')) return 'section-glow-action';
  if (t.includes('tình')) return 'section-glow-romance';
  return 'section-glow-trending';
};

const SectionHeader = ({ title, linkTo }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center space-x-3">
      <span className="w-[4px] h-7 bg-gradient-to-b from-[#E50914] to-[#7B61FF] rounded-full block shadow-[0_0_12px_rgba(229,9,20,0.55)]" />
      <h2 className="font-display text-xl md:text-2xl font-black tracking-tight text-gray-950 dark:text-white uppercase">
        {title}
      </h2>
    </div>
    <Link
      to={linkTo}
      className="flex items-center text-xs md:text-sm font-bold text-[#E50914] dark:text-[#4CC9F0] hover:underline transition-all"
    >
      <span>Xem tất cả</span>
      <ChevronRight size={16} className="ml-0.5" />
    </Link>
  </div>
);

const PosterHoverActions = ({ movie, onBook }) => (
  <div className="poster-reveal absolute inset-0 z-20 flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/95 via-black/45 to-black/10">
    <div className="flex items-start justify-between gap-2">
      <div className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/15">
        <Star size={10} className="text-[#F7B731]" fill="currentColor" />
        <span className="text-[10px] font-extrabold text-white tracking-tight">
          {getRating(movie.movieId)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="poster-action"
          aria-label="Yêu thích"
        >
          <Heart size={14} />
        </button>
        {movie.trailer && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(movie.trailer, '_blank', 'noopener,noreferrer');
            }}
            className="poster-action"
            aria-label="Xem trailer"
          >
            <Clapperboard size={14} />
          </button>
        )}
      </div>
    </div>

    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-white/80">
        {movie.duration && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
            <Clock size={10} className="text-[#00E5FF]" />
            {movie.duration} phút
          </span>
        )}
        {getGenres(movie).map((g) => (
          <span key={g} className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
            {g}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBook?.();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#E50914] hover:bg-[#ff1a25] text-white text-[11px] font-bold tracking-wider uppercase py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-red-600/30"
        >
          <Play size={12} fill="currentColor" strokeWidth={0} />
          Đặt vé
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBook?.();
          }}
          className="poster-action !w-10 !h-10"
          aria-label="Đặt vé"
        >
          <Ticket size={15} />
        </button>
      </div>
    </div>
  </div>
);

const NowShowingCard = ({ movie, index }) => {
  const navigate = useNavigate();
  const name = movie.movieNameVn || movie.movieNameEnglish;
  const genre = getFirstGenre(movie);

  return (
    <div
      className="home-fade-up group"
      style={{ animationDelay: `${Math.min(index, 9) * 60}ms` }}
    >
      <Link
        to={`/detail/${movie.movieId}`}
        className="poster-card relative aspect-[3/4] w-full rounded-[20px] overflow-hidden shadow-md bg-gray-900 block ring-1 ring-black/5 dark:ring-white/10"
      >
        <MoviePoster
          movie={movie}
          alt={`Poster phim ${name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/55 dark:backdrop-blur-md px-2 py-1 rounded-md flex items-center space-x-1 shadow-sm z-10 border border-transparent dark:border-white/15 group-hover:opacity-0 transition-opacity">
          <Star size={10} className="text-[#E50914] dark:text-[#F7B731]" fill="currentColor" />
          <span className="text-[10px] font-extrabold text-gray-900 dark:text-white tracking-tighter">
            {getRating(movie.movieId)}
          </span>
        </div>

        <div className="hidden dark:block">
          <PosterHoverActions
            movie={movie}
            onBook={() => navigate(`/select-showtime/${movie.movieId}`)}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-4 dark:hidden">
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate(`/select-showtime/${movie.movieId}`);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#bf0810] text-white text-xs font-bold tracking-wider uppercase py-3 rounded-lg translate-y-2 group-hover:translate-y-0 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Ticket size={14} fill="currentColor" strokeWidth={0} />
            Đặt vé
          </button>
        </div>
      </Link>

      <div className="pt-3 space-y-1">
        <Link
          to={`/detail/${movie.movieId}`}
          className="block text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#E50914] dark:group-hover:text-[#4CC9F0] transition-colors"
        >
          {name}
        </Link>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400 dark:text-white/45">
          {genre && <span className="line-clamp-1">{genre}</span>}
          {movie.duration && (
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock size={11} />
              {movie.duration}'
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ComingSoonCard = ({ movie }) => {
  const name = movie.movieNameVn || movie.movieNameEnglish;
  const release = formatReleaseDate(movie.fromDate);
  const navigate = useNavigate();

  return (
    <Link
      to={`/detail/${movie.movieId}`}
      className="group relative w-44 md:w-52 shrink-0 snap-start"
    >
      <div className="poster-card relative aspect-[3/4] rounded-[20px] overflow-hidden shadow-md bg-gray-900 ring-1 ring-black/5 dark:ring-white/10">
        <MoviePoster
          movie={movie}
          alt={`Poster phim ${name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {release && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-3 px-3 group-hover:opacity-0 dark:group-hover:opacity-0 transition-opacity">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white">
              <Calendar size={12} className="text-[#E50914] dark:text-[#00E5FF]" />
              {release}
            </span>
          </div>
        )}
        <div className="hidden dark:block">
          <PosterHoverActions
            movie={movie}
            onBook={() => navigate(`/detail/${movie.movieId}`)}
          />
        </div>
      </div>
      <p className="pt-3 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#E50914] dark:group-hover:text-[#4CC9F0] transition-colors">
        {name}
      </p>
    </Link>
  );
};

const GridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="aspect-[3/4] w-full rounded-[20px] bg-gray-100 cine-skeleton" />
        <div className="h-4 w-3/4 bg-gray-100 rounded cine-skeleton" />
        <div className="h-3 w-1/2 bg-gray-100 rounded cine-skeleton" />
      </div>
    ))}
  </div>
);

const ListFilmComponent = ({ title, movies, loading = false, variant = 'grid' }) => {
  const linkTo = title?.includes('sắp') ? '/movies?tab=coming-soon' : '/movies';
  const isRow = variant === 'row';
  const glowClass = getSectionGlow(title);

  return (
    <section
      className={`relative w-full py-14 px-6 md:px-16 font-sans transition-colors duration-300 ${glowClass} ${
        isRow
          ? 'bg-[#F8F9FA] dark:bg-transparent'
          : 'bg-white dark:bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader title={title || 'DANH SÁCH PHIM'} linkTo={linkTo} />

        {loading ? (
          <GridSkeleton />
        ) : movies && movies.length > 0 ? (
          isRow ? (
            <div className="home-scroll-row flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              {movies.map((movie) => (
                <ComingSoonCard key={movie.movieId} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
              {movies.map((movie, index) => (
                <NowShowingCard key={movie.movieId} movie={movie} index={index} />
              ))}
            </div>
          )
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 cine-glass">
            <p className="text-gray-500 dark:text-white/60 font-semibold">
              Hiện tại chưa có phim nào trong mục này.
            </p>
            <p className="text-gray-400 dark:text-white/40 text-sm mt-1">
              Lịch phim mới được cập nhật hàng tuần, quay lại sau nhé.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ListFilmComponent;
