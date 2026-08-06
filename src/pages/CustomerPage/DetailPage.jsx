import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clapperboard, Building2, Calendar, Clock, Film, Ticket, ArrowLeft,
} from 'lucide-react';
import MovieDetailHero from '../../components/DetailPage/MovieDetailHero.jsx';
import MovieService from '../../services/MovieService';
import { getYoutubeEmbedUrl } from '../../utils/trailerUtils';

// Trích chữ cái viết tắt từ tên diễn viên làm avatar
const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatReleaseDate = (dateStr) => {
  if (!dateStr) return 'Chưa cập nhật';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const SectionTitle = ({ children }) => (
  <div className="flex items-center space-x-3">
    <span className="w-[4px] h-6 bg-[#E50914] rounded-sm block"></span>
    <h2 className="text-lg md:text-xl font-black tracking-tight text-gray-950 dark:text-white uppercase">
      {children}
    </h2>
  </div>
);

/** Một dòng thông tin trong panel "Thông tin phim" */
const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
    <div className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 text-[#E50914] flex items-center justify-center">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 leading-snug">
        {children}
      </div>
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="bg-[#F8F9FA] dark:bg-transparent min-h-screen animate-pulse transition-colors duration-300">
    <div className="w-full h-[480px] bg-gray-200 dark:bg-gray-900" />
    <div className="max-w-7xl mx-auto px-6 md:px-16 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </div>
  </div>
);

const DetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    MovieService.getMovieById(id)
      .then((response) => {
        setMovie(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Lỗi lấy chi tiết phim:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#F8F9FA] dark:bg-transparent px-6 text-center transition-colors duration-300">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
          <Film size={28} />
        </div>
        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
          Không tìm thấy thông tin bộ phim này.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#E50914] hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(movie.trailer);
  const actors = movie.actor ? movie.actor.split(',').map((a) => a.trim()).filter(Boolean) : [];
  const typesList = movie.types ? (Array.isArray(movie.types) ? movie.types : Array.from(movie.types)) : [];
  const genres = typesList.length > 0 ? typesList.map((t) => t.typeName).join(', ') : 'Đang cập nhật';
  const versionsList = movie.versions ? (Array.isArray(movie.versions) ? movie.versions : Array.from(movie.versions)) : [];
  const formats = versionsList.length > 0 ? versionsList.map((v) => v.versionName) : ['2D'];

  return (
    <div className="bg-[#F8F9FA] dark:bg-transparent min-h-screen text-gray-900 dark:text-gray-100 pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      {/* 1. Banner hero */}
      <MovieDetailHero movie={movie} />

      <div className="max-w-7xl mx-auto px-6 md:px-16 mt-12 space-y-16">

        {/* 2. Trailer + Nội dung (trái) và panel Thông tin phim (phải) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          <div className="lg:col-span-2 space-y-10">
            {embedUrl && (
              <div id="trailer-section" className="space-y-5 scroll-mt-24">
                <SectionTitle>Trailer chính thức</SectionTitle>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl shadow-gray-950/10 dark:shadow-black/50 ring-1 ring-gray-200 dark:ring-gray-800">
                  <iframe
                    src={embedUrl}
                    title="Official Trailer"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <SectionTitle>Nội dung phim</SectionTitle>
              <div className="text-sm md:text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed space-y-4 max-w-[70ch]">
                {movie.content ? (
                  movie.content.split('\n').map((para, idx) => <p key={idx}>{para}</p>)
                ) : (
                  <p className="italic text-gray-400 dark:text-gray-500">
                    Đang cập nhật nội dung tóm tắt cốt truyện của phim...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Panel thông tin: thay cho 3 card rời rạc cũ */}
          <aside className="lg:sticky lg:top-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm p-6 md:p-7 transition-colors duration-300">
            <h2 className="text-sm font-black tracking-widest text-gray-950 dark:text-white uppercase pb-4 border-b border-gray-100 dark:border-gray-800">
              Thông tin phim
            </h2>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 pt-2">
              <InfoRow icon={Clapperboard} label="Đạo diễn">
                {movie.director || 'Đang cập nhật'}
              </InfoRow>
              <InfoRow icon={Building2} label="Hãng sản xuất">
                {movie.movieProductionCompany || 'Đang cập nhật'}
              </InfoRow>
              <InfoRow icon={Calendar} label="Khởi chiếu">
                {formatReleaseDate(movie.fromDate)}
              </InfoRow>
              <InfoRow icon={Clock} label="Thời lượng">
                {movie.duration || 120} phút
              </InfoRow>
              <InfoRow icon={Film} label="Thể loại">
                {genres}
              </InfoRow>
            </div>

            {/* Định dạng chiếu */}
            <div className="pt-5 mt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-2.5">
                Định dạng
              </p>
              <div className="flex flex-wrap gap-2">
                {formats.map((format, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold uppercase tracking-wider"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to={`/select-showtime/${movie.movieId}`}
              className="mt-7 w-full flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#bf0810] text-white font-bold text-sm tracking-wider uppercase py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
            >
              <Ticket size={16} fill="currentColor" strokeWidth={0} />
              Đặt vé ngay
            </Link>
          </aside>
        </div>

        {/* 3. Diễn viên */}
        <div className="space-y-6">
          <SectionTitle>Diễn viên</SectionTitle>

          {actors.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {actors.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-full pl-1.5 pr-5 py-1.5 shadow-sm hover:border-[#E50914]/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <span className="text-gray-700 dark:text-gray-200 text-xs font-black tracking-tight">
                      {getInitials(actor)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {actor}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="italic text-gray-400 dark:text-gray-500 text-sm">
              Thông tin diễn viên đang được cập nhật...
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default DetailPage;
