import { Link } from 'react-router-dom';
import { Film, Armchair, Sparkles, MapPin } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Film,
    title: 'Điện ảnh chọn lọc',
    text: 'Chương trình chiếu kết hợp bom tấn quốc tế và những tác phẩm nghệ thuật được tuyển chọn kỹ lưỡng.',
  },
  {
    icon: Armchair,
    title: 'Không gian xem phim',
    text: 'Phòng chiếu hiện đại, ghế ngồi êm ái và hệ thống âm thanh hình ảnh được hiệu chỉnh cho trải nghiệm tập trung.',
  },
  {
    icon: Sparkles,
    title: 'Dịch vụ tận tâm',
    text: 'Đặt vé trực tuyến, ưu đãi thành viên và đội ngũ hỗ trợ sẵn sàng đồng hành trước – trong – sau suất chiếu.',
  },
];

const AboutPage = () => {
  return (
    <div className="w-full min-h-[70vh] bg-[#F8F9FA] dark:bg-transparent font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14 space-y-3">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#C00000] dark:text-[#E50914] uppercase">
            Cinema Elite
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Về chúng tôi
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Nơi những tuyệt tác điện ảnh được tôn vinh — trải nghiệm giải trí đẳng cấp trong không gian sang trọng.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-10 mb-8 transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                Câu chuyện của chúng tôi
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Cinema Elite ra đời với mong muốn mang đến một không gian xem phim chỉn chu: lịch chiếu rõ ràng,
                đặt vé nhanh chóng và dịch vụ thân thiện. Chúng tôi tin rằng mỗi suất chiếu đều xứng đáng được
                chuẩn bị như một buổi trình diễn.
              </p>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                Từ phim đang chiếu đến suất sắp tới, từ ghế ngồi đến ưu đãi thành viên — mọi thứ được thiết kế
                để bạn chỉ cần tập trung vào câu chuyện trên màn ảnh.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-950 via-[#1a0a0c] to-[#C00000]/40 min-h-[220px] flex flex-col justify-end p-6 md:p-8">
              <p className="font-display text-2xl md:text-3xl font-bold tracking-wider text-white">
                CINEMA <span className="text-[#E50914]">ELITE</span>
              </p>
              <p className="mt-2 text-sm text-white/70 max-w-sm leading-relaxed">
                Trải nghiệm giải trí đẳng cấp trong không gian sang trọng bậc nhất.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-8">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 transition-colors duration-300"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-[#E50914] mb-4">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-[#E50914]">
              <MapPin size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                Địa chỉ rạp
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-[#C00000] hover:bg-[#990011] text-white text-sm font-bold px-6 py-3 transition-colors"
          >
            Liên hệ với chúng tôi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
