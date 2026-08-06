import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Phạm vi áp dụng',
    body: [
      'Chính sách bảo mật này giải thích cách Cinema Elite thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân khi bạn sử dụng website, ứng dụng và dịch vụ đặt vé của chúng tôi.',
    ],
  },
  {
    title: '2. Thông tin chúng tôi thu thập',
    body: [
      'Thông tin tài khoản: họ tên, email, số điện thoại, tên đăng nhập và thông tin hồ sơ bạn cung cấp khi đăng ký hoặc cập nhật.',
      'Thông tin giao dịch: lịch sử đặt vé, suất chiếu, ghế đã chọn, phương thức thanh toán và trạng thái hóa đơn (không lưu đầy đủ dữ liệu thẻ nhạy cảm trên hệ thống của chúng tôi khi thanh toán qua cổng đối tác).',
      'Thông tin kỹ thuật: cookie, nhật ký truy cập, loại thiết bị và dữ liệu cần thiết để duy trì phiên đăng nhập, bảo mật và cải thiện trải nghiệm.',
    ],
  },
  {
    title: '3. Mục đích sử dụng',
    body: [
      'Cung cấp và vận hành dịch vụ đặt vé, xác nhận giao dịch, gửi thông báo liên quan đến suất chiếu hoặc tài khoản.',
      'Hỗ trợ khách hàng, xử lý khiếu nại và ngăn chặn gian lận.',
      'Cải thiện chất lượng dịch vụ, phân tích mức độ sử dụng theo hướng tổng hợp, không nhằm nhận diện cá nhân khi không cần thiết.',
      'Gửi thông tin ưu đãi hoặc chương trình thành viên khi bạn đồng ý nhận thông báo.',
    ],
  },
  {
    title: '4. Chia sẻ thông tin',
    body: [
      'Chúng tôi không bán thông tin cá nhân của bạn.',
      'Thông tin có thể được chia sẻ với đối tác thanh toán, nhà cung cấp hạ tầng kỹ thuật hoặc cơ quan nhà nước có thẩm quyền khi pháp luật yêu cầu — chỉ trong phạm vi cần thiết để thực hiện dịch vụ hoặc nghĩa vụ pháp lý.',
    ],
  },
  {
    title: '5. Lưu trữ và bảo mật',
    body: [
      'Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ, tuân thủ pháp luật hoặc giải quyết tranh chấp.',
      'Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để hạn chế truy cập trái phép, mất mát hoặc lộ thông tin. Tuy nhiên, không phương thức truyền tải nào trên Internet là an toàn tuyệt đối.',
    ],
  },
  {
    title: '6. Quyền của bạn',
    body: [
      'Bạn có quyền yêu cầu xem, cập nhật hoặc chỉnh sửa thông tin cá nhân trong tài khoản.',
      'Bạn có thể yêu cầu hỗ trợ xóa hoặc hạn chế xử lý dữ liệu trong phạm vi pháp luật cho phép, bằng cách liên hệ bộ phận hỗ trợ của Cinema Elite.',
      'Bạn có thể quản lý cookie trên trình duyệt; việc tắt một số cookie có thể ảnh hưởng đến đăng nhập hoặc trải nghiệm đặt vé.',
    ],
  },
  {
    title: '7. Trẻ em',
    body: [
      'Dịch vụ không hướng đến việc thu thập thông tin từ trẻ em dưới độ tuổi theo quy định pháp luật. Nếu phát hiện dữ liệu được cung cấp không phù hợp, chúng tôi sẽ xử lý theo quy trình nội bộ.',
    ],
  },
  {
    title: '8. Cập nhật chính sách',
    body: [
      'Chính sách bảo mật có thể được cập nhật theo thay đổi dịch vụ hoặc quy định pháp luật. Phiên bản mới sẽ được công bố trên website kèm ngày hiệu lực.',
    ],
  },
];

const PrivacyPage = () => {
  return (
    <div className="w-full min-h-[70vh] bg-[#F8F9FA] dark:bg-transparent font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-12 space-y-3">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#C00000] dark:text-[#E50914] uppercase">
            Pháp lý
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Chính sách bảo mật
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Cập nhật lần gần nhất: tháng 8 năm 2026
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-10 space-y-8 transition-colors duration-300">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Cinema Elite cam kết bảo vệ thông tin cá nhân của khách hàng. Chính sách này mô tả rõ dữ liệu nào được
            thu thập và cách chúng tôi sử dụng dữ liệu đó.
          </p>

          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Liên hệ bảo mật / hỗ trợ:{" "}
              <a
                href="mailto:support@cinemaelite.vn"
                className="font-bold text-[#C00000] dark:text-[#E50914] hover:underline"
              >
                support@cinemaelite.vn
              </a>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Hoặc gửi tin nhắn tại trang{" "}
              <Link to="/contact" className="font-bold text-[#C00000] dark:text-[#E50914] hover:underline">
                Liên hệ
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
