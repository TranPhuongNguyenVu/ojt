import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Chấp nhận điều khoản',
    body: [
      'Khi truy cập website, ứng dụng hoặc sử dụng dịch vụ đặt vé của Cinema Elite, bạn xác nhận đã đọc, hiểu và đồng ý với các Điều khoản sử dụng này.',
      'Nếu bạn không đồng ý, vui lòng ngừng sử dụng dịch vụ của chúng tôi.',
    ],
  },
  {
    title: '2. Tài khoản người dùng',
    body: [
      'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.',
      'Thông tin đăng ký phải chính xác, đầy đủ. Cinema Elite có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện hành vi gian lận, lạm dụng hoặc vi phạm điều khoản.',
    ],
  },
  {
    title: '3. Đặt vé và thanh toán',
    body: [
      'Vé điện tử chỉ có hiệu lực khi giao dịch thanh toán thành công và được hệ thống xác nhận.',
      'Giá vé, phụ thu và khuyến mãi có thể thay đổi theo suất chiếu, loại ghế hoặc chương trình đang áp dụng tại thời điểm đặt.',
      'Bạn cần đến đúng giờ và mang theo mã vé / thông tin đặt chỗ để soát vé tại rạp.',
    ],
  },
  {
    title: '4. Đổi, hủy và hoàn tiền',
    body: [
      'Vé đã thanh toán thành công không thể hủy hoặc hoàn tiền bởi khách hàng trên hệ thống.',
      'Trường hợp suất chiếu bị hủy hoặc thay đổi bởi rạp, chúng tôi sẽ hỗ trợ đổi suất phù hợp hoặc hoàn tiền theo quy định hiện hành.',
    ],
  },
  {
    title: '5. Quy định tại rạp',
    body: [
      'Khách hàng cần tuân thủ nội quy rạp: không quay phim, không làm ồn ảnh hưởng người khác, và tuân theo hướng dẫn của nhân viên.',
      'Cinema Elite được quyền từ chối phục vụ nếu khách hàng có hành vi gây rối, đe dọa an toàn hoặc vi phạm pháp luật.',
    ],
  },
  {
    title: '6. Sở hữu trí tuệ',
    body: [
      'Toàn bộ nội dung trên website (logo, hình ảnh, giao diện, văn bản) thuộc quyền sở hữu của Cinema Elite hoặc đối tác được cấp phép.',
      'Nghiêm cấm sao chép, phân phối hoặc sử dụng nội dung cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.',
    ],
  },
  {
    title: '7. Giới hạn trách nhiệm',
    body: [
      'Chúng tôi nỗ lực duy trì hệ thống ổn định, nhưng không cam kết dịch vụ luôn không gián đoạn do sự cố kỹ thuật, bảo trì hoặc yếu tố bất khả kháng.',
      'Cinema Elite không chịu trách nhiệm đối với thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ, trong phạm vi pháp luật cho phép.',
    ],
  },
  {
    title: '8. Thay đổi điều khoản',
    body: [
      'Cinema Elite có thể cập nhật Điều khoản sử dụng theo thời gian. Phiên bản mới có hiệu lực khi được đăng tải trên website.',
      'Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.',
    ],
  },
];

const TermsPage = () => {
  return (
    <div className="w-full min-h-[70vh] bg-[#F8F9FA] dark:bg-transparent font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-12 space-y-3">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#C00000] dark:text-[#E50914] uppercase">
            Pháp lý
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Điều khoản sử dụng
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Cập nhật lần gần nhất: tháng 8 năm 2026
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-10 space-y-8 transition-colors duration-300">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Các điều khoản dưới đây quy định quyền và nghĩa vụ khi bạn sử dụng nền tảng đặt vé và dịch vụ của{' '}
            <span className="font-semibold text-gray-900 dark:text-white">Cinema Elite</span>.
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

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Nếu cần hỗ trợ thêm, vui lòng xem{' '}
              <Link to="/privacy" className="font-bold text-[#C00000] dark:text-[#E50914] hover:underline">
                Chính sách bảo mật
              </Link>{' '}
              hoặc{' '}
              <Link to="/contact" className="font-bold text-[#C00000] dark:text-[#E50914] hover:underline">
                Liên hệ
              </Link>{' '}
              với chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
