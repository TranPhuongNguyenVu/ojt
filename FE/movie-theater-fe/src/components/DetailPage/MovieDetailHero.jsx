import React from "react";
import { Ticket, Play, Heart, Clock, Film, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { hasYoutubeTrailer } from "../../utils/trailerUtils";
import HeroImg from "../../assets/imgs/Hero.png";
import posterImg from "../../assets/imgs/Vidu_Film.jpeg";

const MovieDetailHero = ({ movie }) => {
  
  // Ánh xạ ảnh nền lớn (Hero Banner) sang ảnh chất lượng cao Unsplash nếu là ảnh mẫu từ CSDL
  const getLargeImageUrl = (image) => {
    if (!image) return HeroImg;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    const mockLargeImages = {
      'large1.jpg': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80', // Inception
      'large2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', // Interstellar
      'large3.jpg': 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80', // The Hangover
      'large4.jpg': 'https://images.unsplash.com/photo-1505635339356-d7b6d926b245?w=1200&auto=format&fit=crop&q=80', // The Conjuring
      'large5.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', // Avatar
    };
    return mockLargeImages[image] || HeroImg;
  };

  // Ánh xạ ảnh dọc (Poster) sang ảnh chất lượng cao Unsplash nếu là ảnh mẫu từ CSDL
  const getSmallImageUrl = (image) => {
    if (!image) return posterImg;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    const mockSmallImages = {
      'small1.jpg': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80', // Inception
      'small2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80', // Interstellar
      'small3.jpg': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80', // The Hangover
      'small4.jpg': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80', // The Conjuring
      'small5.jpg': 'https://images.unsplash.com/photo-1460889418202-14ebd473d78c?w=500&auto=format&fit=crop&q=80', // Avatar
    };
    return mockSmallImages[image] || posterImg;
  };

  // Xác định trạng thái phim dựa trên ngày bắt đầu chiếu
  const getMovieStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    if (movie.fromDate && today < movie.fromDate) {
      return 'SẮP CHIẾU';
    }
    return 'ĐANG CHIẾU';
  };

  // Format ngày tháng DD-MM-YYYY
  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const genres = movie.types && movie.types.length > 0 
    ? movie.types.map(t => t.typeName).join(' / ') 
    : movie.types && movie.types.size > 0 
      ? Array.from(movie.types).map(t => t.typeName).join(' / ')
      : 'Thể loại đang cập nhật';

  const formats = movie.versions && movie.versions.length > 0
    ? movie.versions.map(v => v.versionName)
    : movie.versions && movie.versions.size > 0
      ? Array.from(movie.versions).map(v => v.versionName)
      : ['2D'];

  return (
    <section className="relative w-full min-h-[480px] md:min-h-[550px] flex items-center py-12 px-6 md:px-16 overflow-hidden bg-gray-950">
      
      {/* 1. NỀN PHIM LÀM MỜ NGHỆ THUẬT (Blur Background) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: `url(${getLargeImageUrl(movie.largeImage)})`,
          filter: 'blur(12px) brightness(0.55)',
          transform: 'scale(1.08)',
          opacity: 0.45
        }}
      ></div>
      
      {/* Lớp phủ chuyển sắc tối sang nền tối */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-gray-950/40"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent"></div>

      {/* Container chính */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
        
        {/* ================= KHỐI BÊN TRÁI: POSTER PHIM NỔI ================= */}
        <div className="flex justify-center md:justify-start">
          <div className="w-56 md:w-full max-w-[280px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-black border border-white/10 hover:border-[#E50914]/30 transform hover:scale-[1.03] transition-all duration-300 bg-gray-900">
            <img
              src={getSmallImageUrl(movie.smallImage)}
              alt={`Movie poster of ${movie.movieNameVn || movie.movieNameEnglish}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ================= KHỐI BÊN PHẢI: THÔNG TIN CHI TIẾT PHIM ================= */}
        <div className="md:col-span-2 flex flex-col items-start space-y-6 text-white font-sans">
          
          {/* 1. Các thẻ tags định dạng */}
          <div className="flex flex-wrap gap-2 animate-fadeIn">
            <span className="bg-[#E50914] text-white text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-sm shadow-md shadow-red-950/30">
              {getMovieStatus()}
            </span>
            {formats.map((format, idx) => (
              <span key={idx} className="bg-white/5 backdrop-blur-sm text-white/90 text-[10px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-sm border border-white/10">
                {format}
              </span>
            ))}
          </div>

          {/* 2. Tiêu đề phim (Tên kép) */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight uppercase drop-shadow-md font-sans">
              {movie.movieNameVn || movie.movieNameEnglish}
            </h1>
            {movie.movieNameVn && movie.movieNameEnglish && (
              <p className="text-sm md:text-base font-medium tracking-wider text-gray-400 uppercase drop-shadow-sm">
                {movie.movieNameEnglish}
              </p>
            )}
          </div>

          {/* 3. Khối Đánh giá & Thời lượng & Thể loại */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs md:text-sm font-bold text-gray-300 border-b border-white/5 pb-4 w-full">
            
            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Clock size={15} className="text-[#E50914]" />
              <span>{movie.duration || 120} Phút</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Film size={15} className="text-gray-400" />
              <span>{genres}</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Calendar size={15} className="text-gray-400" />
              <span>Khởi chiếu: {formatReleaseDate(movie.fromDate)}</span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
export default MovieDetailHero;
