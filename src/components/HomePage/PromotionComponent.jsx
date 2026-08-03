import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Crown } from 'lucide-react';

const MEMBER_BG =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&auto=format&fit=crop&q=80';

const PromotionComponent = () => {
  return (
    <section className="w-full bg-white dark:bg-transparent pt-6 pb-4 px-6 md:px-16 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative">
        <div className="relative rounded-[20px] overflow-hidden min-h-[220px] md:min-h-[260px] flex flex-col md:flex-row border border-transparent dark:border-white/10 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <img
            src={MEMBER_BG}
            alt="Phòng chiếu phim"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 to-gray-950/40 dark:from-[#050505]/95 dark:via-[#0A0A0F]/80 dark:to-[#050505]/35" />
          <div className="absolute inset-0 opacity-0 dark:opacity-40 bg-[radial-gradient(ellipse_at_70%_20%,rgba(123,97,255,0.35),transparent_55%)] pointer-events-none" />

          <div className="relative z-10 flex-1 p-7 md:p-10 flex flex-col justify-center space-y-4">
            <div className="inline-flex items-center gap-2 self-start bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full font-display">
              <Crown size={12} className="text-[#E50914] dark:text-[#F7B731]" />
              Thành viên Cinema Elite
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-black tracking-tight text-white uppercase leading-[1.05] hero-title-glow">
              Xem nhiều hơn, trả ít hơn
            </h2>
            <p className="font-sans text-white/80 text-sm md:text-base leading-relaxed font-medium max-w-xl">
              Tích điểm mỗi lần đặt vé, đổi vé miễn phí và nhận đặc quyền suất chiếu sớm dành riêng cho thành viên.
            </p>
            <div className="pt-1">
              <Link
                to="/register"
                className="cine-btn-primary inline-block bg-[#E50914] text-white text-xs md:text-sm font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl hover:bg-[#bf0810] transition-all active:scale-95 shadow-lg shadow-red-950/40 font-display"
              >
                Đăng ký thành viên
              </Link>
            </div>
          </div>

          <div className="relative z-10 md:w-[280px] shrink-0 m-5 md:m-6 md:ml-0 p-6 rounded-[16px] bg-white/10 dark:bg-white/8 backdrop-blur-md border border-white/15 flex flex-col justify-between gap-4">
            <div className="w-12 h-12 bg-[#FFF0F2]/15 rounded-full flex items-center justify-center text-[#4CC9F0] border border-[#4CC9F0]/25">
              <QrCode size={22} strokeWidth={2} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                Vé điện tử QR
              </h3>
              <p className="font-sans text-white/65 text-xs md:text-sm leading-relaxed">
                Quét mã tại cửa và vào phòng chiếu ngay, không cần xếp hàng đổi vé.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionComponent;
