import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Info, Clock, Calendar, Volume2, VolumeX } from 'lucide-react';
import MoviePoster from '../MoviePoster.jsx';
import { getMovieBannerUrl } from '../../utils/movieImageUtils';
import { getYoutubeEmbedUrl } from '../../utils/trailerUtils';
import HeroImg from '../../assets/imgs/Hero.png';

const IMAGE_SLIDE_MS = 8000;
const VIDEO_SLIDE_MS = 20000;
/** Bỏ qua intro đầu trailer */
const TRAILER_START_SECONDS = 6;
/** Cắt outro / endscreen trước khi hết video */
const TRAILER_END_TRIM_SECONDS = 10;
// Băng chuyền thumbnail chỉ hiển thị tối đa 5 phim cùng lúc, dù carousel xoay qua nhiều phim hơn
const THUMBNAIL_WINDOW = 5;

/** Load YouTube IFrame API một lần, dùng chung cho toàn app. */
let youtubeApiPromise = null;
const loadYouTubeApi = () => {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return youtubeApiPromise;
};

const formatReleaseDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const getGenres = (movie) => {
  const types = movie?.types;
  if (!types) return null;
  const list = Array.isArray(types) ? types : Array.from(types);
  if (list.length === 0) return null;
  return list.slice(0, 3).map((t) => t.typeName).join(', ');
};

const getYoutubeId = (url) => {
  const embed = getYoutubeEmbedUrl(url);
  return embed ? embed.split('/').pop() : null;
};

/**
 * Poster 3D: nghiêng theo vị trí chuột (perspective tilt) kèm vệt sáng sheen.
 * Cập nhật transform trực tiếp trên DOM (không setState mỗi frame).
 */
const TiltPoster = ({ movie }) => {
  const cardRef = useRef(null);
  const sheenRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform =
      `perspective(900px) rotateY(${(px * 16).toFixed(2)}deg) rotateX(${(-py * 16).toFixed(2)}deg) scale(1.04)`;
    if (sheenRef.current) {
      sheenRef.current.style.opacity = '1';
      sheenRef.current.style.background =
        `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.35), transparent 55%)`;
    }
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
    if (sheenRef.current) sheenRef.current.style.opacity = '0';
  };

  return (
    <Link
      to={`/detail/${movie.movieId}`}
      className="hidden lg:block shrink-0 [perspective:900px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={`Chi tiết phim ${movie.movieNameVn || movie.movieNameEnglish}`}
    >
      <div
        ref={cardRef}
        className="relative w-52 xl:w-60 aspect-[2/3] rounded-[20px] overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/20 dark:ring-white/15 transition-transform duration-300 ease-out will-change-transform dark:shadow-[0_20px_60px_rgba(229,9,20,0.25)]"
      >
        <MoviePoster
          movie={movie}
          alt={movie.movieNameVn || movie.movieNameEnglish}
          className="w-full h-full object-cover"
        />
        {/* Vệt sáng chạy theo chuột */}
        <div
          ref={sheenRef}
          className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
        />
        {/* Viền sáng mép trên tạo cảm giác vật liệu */}
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] pointer-events-none" />
      </div>
    </Link>
  );
};

/**
 * Trailer YouTube phủ kín nền hero.
 * Dùng YouTube IFrame API chính thức để mute/unmute hoạt động trong cùng user gesture.
 */
const TrailerBackdrop = forwardRef(function TrailerBackdrop({ videoId, onPlaying, onFailed, ready }, ref) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    /** Gọi trực tiếp từ onClick để giữ user gesture khi bật tiếng. */
    setMuted(nextMuted) {
      const player = playerRef.current;
      // Một số thời điểm API gắn method muộn: thử cả player và iframe postMessage
      try {
        if (player && typeof player.mute === 'function') {
          if (nextMuted) {
            player.mute();
          } else {
            player.unMute();
            player.setVolume?.(100);
            player.playVideo?.();
          }
          return true;
        }
      } catch {
        // fall through
      }

      const iframe =
        hostRef.current?.tagName === 'IFRAME'
          ? hostRef.current
          : hostRef.current?.querySelector?.('iframe');
      if (iframe?.contentWindow) {
        const send = (func, args = []) => {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func, args }),
            '*'
          );
        };
        send(nextMuted ? 'mute' : 'unMute');
        if (!nextMuted) {
          send('setVolume', [100]);
          send('playVideo');
        }
        return true;
      }
      return false;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let player = null;
    let pollId = null;

    const clearPoll = () => {
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    // YouTube chỉ hiện overlay pause/next (endscreen gợi ý video) khi video CHẠM mốc kết thúc thật.
    // Vòng lặp qua `loop:1 + playlist` vẫn đi qua khoảnh khắc đó nên bị flash overlay.
    // => Seek về TRAILER_START_SECONDS trước TRAILER_END_TRIM_SECONDS cuối, không bao giờ "ended" thật.
    const startPoll = () => {
      clearPoll();
      pollId = setInterval(() => {
        if (cancelled || !playerRef.current) return;
        try {
          const duration = playerRef.current.getDuration?.() || 0;
          const current = playerRef.current.getCurrentTime?.() || 0;
          if (duration <= 0 || current <= 0) return;
          const loopAt = Math.max(
            TRAILER_START_SECONDS + 1,
            duration - TRAILER_END_TRIM_SECONDS
          );
          if (current >= loopAt) {
            playerRef.current.seekTo(TRAILER_START_SECONDS, true);
          }
        } catch {
          // ignore
        }
      }, 250);
    };

    const createPlayer = (YT) => {
      if (cancelled || !hostRef.current) return;

      player = new YT.Player(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: videoId,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          start: TRAILER_START_SECONDS,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            playerRef.current = e.target;
            try {
              e.target.mute();
              e.target.playVideo();
            } catch {
              // ignore
            }
            // Hiện video + nút mute ngay khi player sẵn sàng
            onPlaying();
            startPoll();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === 1) {
              // Khi loop chạy lại từ 0, nhảy qua đoạn intro
              try {
                if (e.target.getCurrentTime?.() < TRAILER_START_SECONDS) {
                  e.target.seekTo(TRAILER_START_SECONDS, true);
                }
              } catch {
                // ignore
              }
              onPlaying();
            }
          },
          onError: () => {
            if (cancelled) return;
            playerRef.current = null;
            clearPoll();
            onFailed?.();
          },
        },
      });
      playerRef.current = player;
    };

    loadYouTubeApi()
      .then((YT) => {
        requestAnimationFrame(() => createPlayer(YT));
      })
      .catch(() => onFailed?.());

    return () => {
      cancelled = true;
      clearPoll();
      playerRef.current = null;
      try {
        player?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [videoId, onPlaying, onFailed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-video min-w-full min-h-full scale-[1.35] transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
      >
        <div ref={hostRef} className="w-full h-full" />
      </div>
    </div>
  );
});

/**
 * Hero carousel: nền là trailer phim (nếu có), ảnh banner làm fallback.
 * Tự chuyển slide, dừng khi hover, tôn trọng prefers-reduced-motion.
 */
const HeroComponent = ({ movies = [], loading = false }) => {
  // Ưu tiên phim có trailer YouTube lên đầu carousel. Không giới hạn số phim tham gia xoay vòng
  // (trước đây cắt còn 5) — carousel giờ xoay qua toàn bộ phim đang chiếu, băng chuyền thumbnail
  // bên dưới mới là nơi giới hạn hiển thị đồng thời 5 phim.
  // Backend trả danh sách không có ORDER BY nên thứ tự có thể xáo trộn giữa các lần gọi;
  // sort theo movieId trước để hero luôn ổn định.
  const featured = useMemo(() => {
    const sorted = [...movies].sort((a, b) => String(a.movieId).localeCompare(String(b.movieId)));
    const withTrailer = sorted.filter((m) => Boolean(getYoutubeId(m.trailer)));
    const withoutTrailer = sorted.filter((m) => !getYoutubeId(m.trailer));
    return [...withTrailer, ...withoutTrailer];
  }, [movies]);
  const [active, setActive] = useState(0);
  // Cửa sổ băng chuyền: 5 phim liên tiếp bắt đầu từ slide đang active, cuộn tới khi active đổi
  const thumbnails = useMemo(() => {
    const n = featured.length;
    if (n === 0) return [];
    const size = Math.min(THUMBNAIL_WINDOW, n);
    return Array.from({ length: size }, (_, i) => featured[(active + i) % n]);
  }, [featured, active]);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const pausedRef = useRef(false);
  const trailerRef = useRef(null);
  const onPlayingRef = useRef(() => setVideoReady(true));
  onPlayingRef.current = () => setVideoReady(true);
  const onFailedRef = useRef(() => {
    setVideoReady(false);
    setMuted(true);
  });
  onFailedRef.current = () => {
    setVideoReady(false);
    setMuted(true);
  };

  const movie = featured[active];
  const videoId = movie ? getYoutubeId(movie.trailer) : null;
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showVideo = Boolean(videoId) && !reduceMotion;

  const handlePlaying = useMemo(() => () => onPlayingRef.current(), []);
  const handleFailed = useMemo(() => () => onFailedRef.current(), []);

  const handleToggleMute = (e) => {
    e?.stopPropagation?.();
    const next = !muted;
    // Bắt buộc gọi player trong cùng user gesture, rồi cập nhật icon
    trailerRef.current?.setMuted(next);
    setMuted(next);
  };

  useEffect(() => {
    setActive(0);
  }, [movies]);

  // Reset trạng thái video mỗi lần đổi slide
  useEffect(() => {
    setVideoReady(false);
    setMuted(true);
  }, [active]);

  // Tự chuyển slide: slide có trailer được xem lâu hơn slide ảnh
  useEffect(() => {
    if (featured.length < 2 || reduceMotion) return;
    const delay = showVideo ? VIDEO_SLIDE_MS : IMAGE_SLIDE_MS;
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setActive((prev) => (prev + 1) % featured.length);
      }
    }, delay);
    return () => clearInterval(id);
  }, [featured.length, showVideo, reduceMotion, active]);

  if (loading) {
    return (
      <section className="relative w-full min-h-[600px] md:min-h-[720px] bg-gray-950 dark:bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-white dark:from-[#0A0A0F] dark:via-[#050505] dark:to-[#050505]" />
        <div className="absolute inset-0 hidden dark:block opacity-40 bg-[radial-gradient(ellipse_at_20%_30%,rgba(229,9,20,0.25),transparent_50%)]" />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-16 pt-40 space-y-6">
          <div className="h-6 w-28 rounded-full cine-skeleton" />
          <div className="h-14 w-2/3 max-w-xl rounded-2xl cine-skeleton" />
          <div className="h-4 w-80 max-w-full rounded-lg cine-skeleton" />
          <div className="flex gap-4 pt-4">
            <div className="h-12 w-44 rounded-xl cine-skeleton" />
            <div className="h-12 w-40 rounded-xl cine-skeleton" />
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return (
      <section
        className="relative w-full min-h-[600px] md:min-h-[720px] flex items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white dark:to-gray-950" />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-16 pt-20 pb-24 space-y-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-2xl leading-none">
            TRẢI NGHIỆM ĐIỆN ẢNH ĐỈNH CAO
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl leading-relaxed font-medium">
            Lịch chiếu mới đang được cập nhật. Quay lại sau để không bỏ lỡ những bom tấn sắp ra mắt.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 bg-[#E50914] text-white font-bold text-xs md:text-sm tracking-wider uppercase px-6 py-3.5 rounded-md hover:bg-[#bf0810] transition-all active:scale-95 shadow-lg shadow-red-600/20"
          >
            <Ticket size={16} fill="currentColor" strokeWidth={0} />
            <span>Xem lịch chiếu</span>
          </Link>
        </div>
      </section>
    );
  }

  const genres = getGenres(movie);
  const release = formatReleaseDate(movie.fromDate);

  return (
    <section
      className="relative w-full min-h-[600px] md:min-h-[720px] flex items-end overflow-hidden bg-gray-950 dark:bg-[#050505]"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Lớp ảnh: hiển thị ngay lập tức, crossfade giữa các slide (fallback khi video chưa tải / không có trailer) */}
      {featured.map((m, i) => (
        <div
          key={m.movieId}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === active ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={i !== active}
        >
          <img
            src={getMovieBannerUrl(m)}
            alt=""
            className={`w-full h-full object-cover ${i === active && !videoReady ? 'home-ken-burns' : ''}`}
          />
        </div>
      ))}

      {/* Lớp video trailer: chỉ mount cho slide đang hiển thị */}
      {showVideo && (
        <TrailerBackdrop
          key={videoId}
          ref={trailerRef}
          videoId={videoId}
          ready={videoReady}
          onPlaying={handlePlaying}
          onFailed={handleFailed}
        />
      )}

      {/* Scrim: tối bên trái cho chữ, mờ dần xuống nối vào phần thân trang */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-black/40 to-white dark:to-[#050505] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none hidden dark:block opacity-60 bg-[radial-gradient(ellipse_at_30%_40%,rgba(229,9,20,0.18),transparent_55%)]" />

      {/* Floating particles (dark only) */}
      <div className="hero-particles hidden dark:block" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${6 + ((i * 7) % 88)}%`,
              bottom: `${(i * 11) % 40}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${10 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Nút bật/tắt tiếng trailer */}
      {showVideo && videoReady && (
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={muted ? 'Bật tiếng trailer' : 'Tắt tiếng trailer'}
          aria-pressed={!muted}
          className="absolute top-24 right-6 md:right-10 z-30 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-black/60 dark:hover:shadow-[0_0_24px_rgba(76,201,240,0.35)] transition-all active:scale-95 cursor-pointer"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-16 pb-28 md:pb-32 pt-32 flex items-end justify-between gap-10">

        {/* Nội dung phim: key theo movieId để animation chạy lại mỗi lần đổi slide */}
        <div key={movie.movieId} className="max-w-2xl space-y-5">
          <h1 className="home-fade-up font-display text-4xl md:text-6xl font-black tracking-tight text-white leading-none uppercase drop-shadow-lg hero-title-glow">
            {movie.movieNameVn || movie.movieNameEnglish}
          </h1>

          <div className="home-fade-up flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85 text-xs md:text-sm font-semibold [animation-delay:160ms]">
            {movie.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-[#E50914] dark:text-[#00E5FF]" />
                {movie.duration} phút
              </span>
            )}
            {release && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-[#E50914] dark:text-[#F7B731]" />
                Khởi chiếu {release}
              </span>
            )}
            {genres && <span className="text-white/70 dark:text-white/60">{genres}</span>}
          </div>

          <div className="home-fade-up flex flex-wrap items-center gap-4 pt-2 [animation-delay:240ms]">
            <Link
              to={`/select-showtime/${movie.movieId}`}
              className="cine-btn-primary cine-pulse flex items-center gap-2 bg-[#E50914] text-white font-bold text-xs md:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl hover:bg-[#bf0810] transition-all active:scale-95 shadow-lg shadow-red-600/30"
            >
              <Ticket size={16} fill="currentColor" strokeWidth={0} />
              <span>Đặt vé ngay</span>
            </Link>
            <Link
              to={`/detail/${movie.movieId}`}
              className="cine-btn-ghost flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-xs md:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all active:scale-95"
            >
              <Info size={16} />
              <span>Xem chi tiết</span>
            </Link>
          </div>
        </div>

        {/* Cột phải: poster 3D nghiêng theo chuột + thumbnail chọn phim */}
        <div className="hidden lg:flex flex-col items-end gap-5 shrink-0">
          <TiltPoster key={movie.movieId} movie={movie} />

          {thumbnails.length > 1 && (
            <div className="flex items-end gap-3">
              {thumbnails.map((m, i) => (
                <button
                  key={`${m.movieId}-${i}`}
                  onClick={() => setActive(featured.findIndex((f) => f.movieId === m.movieId))}
                  aria-label={`Xem ${m.movieNameVn || m.movieNameEnglish}`}
                  className={`relative w-14 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                    i === 0
                      ? 'h-24 ring-2 ring-[#E50914] shadow-lg shadow-red-600/30'
                      : 'h-20 opacity-60 hover:opacity-100 ring-1 ring-white/20 hover:-translate-y-1'
                  }`}
                >
                  <MoviePoster
                    movie={m}
                    alt={m.movieNameVn || m.movieNameEnglish}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroComponent;
