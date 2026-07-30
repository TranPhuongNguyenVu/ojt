import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Share2, Mail, MapPin } from 'lucide-react';

const MAP_EMBED_URL =
  'https://maps.google.com/maps?q=123+Nguyen+Hue,+Quan+1,+Ho+Chi+Minh+City&t=&z=15&ie=UTF8&iwloc=&output=embed';

const Footer = () => {
  return (
    <footer className="w-full bg-white dark:bg-transparent text-gray-500 dark:text-white/50 py-14 px-6 md:px-16 border-t border-gray-100 dark:border-white/8 font-sans text-sm transition-colors duration-300 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E50914]/50 to-transparent hidden dark:block" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold tracking-wider text-[#990011] dark:text-white">
            CINEMA <span className="text-[#E50914]">NOIR</span>
          </h2>
          <p className="leading-relaxed text-gray-400 dark:text-white/40 max-w-sm">
            <span className="text-[#E50914] dark:text-[#4CC9F0]">
              Nơi những tuyệt tác điện ảnh được tôn vinh.
            </span>
            <br />
            Trải nghiệm giải trí đẳng cấp trong không gian sang trọng bậc nhất.
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 dark:text-white/35 uppercase mb-1">
            LIÊN KẾT NHANH
          </h3>
          <a href="#about" className="hover:text-gray-800 dark:hover:text-white transition-colors">Về chúng tôi</a>
          <a href="#terms" className="hover:text-gray-800 dark:hover:text-white transition-colors">Điều khoản sử dụng</a>
          <a href="#privacy" className="hover:text-gray-800 dark:hover:text-white transition-colors">Chính sách bảo mật</a>
          <Link to="/contact" className="hover:text-gray-800 dark:hover:text-white transition-colors">Liên hệ</Link>
        </div>

        <div className="flex flex-col justify-between items-start space-y-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 dark:text-white/35 uppercase mb-1">
              THEO DÕI CHÚNG TÔI
            </h3>
            <div className="flex items-center space-x-4 text-gray-400 dark:text-white/40">
              <a href="#" className="hover:text-gray-600 dark:hover:text-[#4CC9F0] transition-colors dark:hover:drop-shadow-[0_0_8px_rgba(76,201,240,0.6)]">
                <Globe size={20} strokeWidth={1.5} />
              </a>
              <a href="#" className="hover:text-gray-600 dark:hover:text-[#7B61FF] transition-colors dark:hover:drop-shadow-[0_0_8px_rgba(123,97,255,0.6)]">
                <Share2 size={20} strokeWidth={1.5} />
              </a>
              <a href="#" className="hover:text-gray-600 dark:hover:text-[#E50914] transition-colors dark:hover:drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                <Mail size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-white/25 font-light">
            &copy; 2024 Cinema Noir. Tất cả quyền được bảo lưu.
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 dark:text-white/35 uppercase mb-1 flex items-center gap-2">
            <MapPin size={12} className="text-[#E50914]" />
            VỊ TRÍ RẠP
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm h-40 md:h-44">
            <iframe
              title="Bản đồ Cinema Noir"
              src={MAP_EMBED_URL}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-white/40">
            123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
