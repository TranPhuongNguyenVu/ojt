import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, MapPin, User, Printer, ShoppingBag, Ticket, MailCheck, TriangleAlert } from 'lucide-react';
import BookingService from '../../services/BookingService';
import BookingStepper from '../../components/BookingStepper';

const BookingSuccessPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [concessions, setConcessions] = useState([]);
  const [showEmailBanner, setShowEmailBanner] = useState(true);

  useEffect(() => {
    const userLoginStr = localStorage.getItem('USER_LOGIN');
    if (userLoginStr) {
      setUser(JSON.parse(userLoginStr));
    }

    const stateConcessions = location.state?.concessions;
    if (stateConcessions && stateConcessions.length > 0) {
      setConcessions(stateConcessions);
    } else {
      const stored = sessionStorage.getItem(`concession_order_${invoiceId}`);
      if (stored) {
        try {
          setConcessions(JSON.parse(stored));
        } catch (e) {
          console.error('Lỗi đọc danh sách bắp nước:', e);
        }
      }
    }

    BookingService.getBookingHistory()
      .then((res) => {
        const list = res.data.data || [];
        const found = list.find((item) => item.invoiceId === parseInt(invoiceId));
        if (found) {
          setBooking(found);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải thông tin hóa đơn thành công:', err);
        setLoading(false);
      });
  }, [invoiceId, location.state]);

  useEffect(() => {
    if (booking?.movieTitle) {
      document.title = `Vé xem Phim - ${booking.movieTitle}`;
    }
  }, [booking]);

  useEffect(() => {
    if (!booking?.emailSent) {
      return undefined;
    }
    const timer = setTimeout(() => setShowEmailBanner(false), 10000);
    return () => clearTimeout(timer);
  }, [booking]);

  if (loading) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-lg font-bold text-green-600 animate-pulse">Đang tạo biên nhận vé...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="cine-booking-canvas min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <p className="text-lg font-bold text-[#6B7280] dark:text-white/50">Không tìm thấy thông tin đặt vé này.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[#C00000] text-white text-sm font-bold rounded-xl"
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  const dateStr = booking.datetime ? new Date(booking.datetime).toLocaleDateString('vi-VN') : '';
  const timeStr = booking.datetime
    ? new Date(booking.datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const seatTypeLabel = (seatType) => {
    if (seatType === 2) return 'Đôi';
    if (seatType === 1) return 'VIP';
    return 'Thường';
  };

  const seatList = booking.seats ? booking.seats.split(', ') : [];
  const seatDetails =
    booking.seatDetails && booking.seatDetails.length > 0
      ? booking.seatDetails
      : seatList.map((label) => ({ seatLabel: label, seatType: 0 }));

  const rawConcessions = concessions.length > 0 ? concessions : booking.concessions || [];
  // sessionStorage: { name, price } — API lịch sử: { itemName, unitPrice, lineTotal }
  const effectiveConcessions = rawConcessions.map((item) => {
    const quantity = item.quantity ?? 0;
    const price =
      item.price ?? item.unitPrice ?? (quantity > 0 ? item.lineTotal / quantity : 0) ?? 0;
    return {
      ...item,
      name: item.name ?? item.itemName ?? '',
      price,
      quantity,
    };
  });
  const hasConcessions = effectiveConcessions.length > 0;

  const concessionTotalSum = effectiveConcessions.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const ticketTotalSum = Math.max(0, booking.totalMoney - concessionTotalSum);

  const hasOriginalSeatPrices = seatDetails.length > 0 && seatDetails.every((s) => s.price != null);
  const originalTicketSum = hasOriginalSeatPrices
    ? seatDetails.reduce((sum, s) => sum + s.price, 0)
    : 0;
  const ticketDiscount = hasOriginalSeatPrices ? Math.max(0, originalTicketSum - ticketTotalSum) : 0;

  const handlePrint = () => window.print();

  return (
    <div className="cine-booking-canvas bg-[#F8F9FA] dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white pb-20 font-sans print:bg-white print:pb-0 transition-colors duration-300">
      <div className="print:hidden">
        <BookingStepper currentStep={3} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12 space-y-8 print:space-y-4">
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black text-[#111827] dark:text-[#F5F7FB] uppercase">Đặt vé thành công!</h1>
        </div>

        <div
          className={`cine-print-invoice-grid grid grid-cols-1 ${hasConcessions ? 'lg:grid-cols-2' : ''} gap-6 items-start max-w-6xl mx-auto`}
        >
          {/* Phiếu 1: Hóa đơn vé xem phim — UI giống employee */}
          <div className="cine-print-invoice bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#C00000] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Ticket size={22} />
                <p className="text-sm font-black uppercase">Hóa Đơn Vé Xem Phim</p>
              </div>
              <span className="text-xs font-black uppercase">#INV-{booking.invoiceId}</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold text-[#4B5563] dark:text-white/60">
                <div>
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                    Phim
                  </span>
                  <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">
                    {booking.movieTitle}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                    <MapPin size={10} /> Rạp
                  </span>
                  <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">
                    {booking.cinema}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                    Ngày
                  </span>
                  <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">{dateStr}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                    <Clock size={10} /> Thời gian
                  </span>
                  <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">{timeStr}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-2">
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                  Ghế &amp; Giá
                </span>
                {seatDetails.map((item) => (
                  <div
                    key={item.seatLabel}
                    className="flex items-center justify-between text-sm font-bold"
                  >
                    <span className="text-[#374151] dark:text-white/70">
                      {item.seatLabel}
                      <span className="ml-2 text-[10px] text-[#9CA3AF] dark:text-white/40 uppercase">
                        ({seatTypeLabel(item.seatType)})
                      </span>
                    </span>
                    <span className="text-[#111827] dark:text-[#F5F7FB]">
                      {item.price != null
                        ? `${new Intl.NumberFormat('vi-VN').format(item.price)} VNĐ`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
                <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">
                  {hasConcessions ? 'Tiền Vé' : 'Tổng Tiền Thanh Toán'}
                </span>
                <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">
                  {new Intl.NumberFormat('vi-VN').format(
                    hasConcessions ? ticketTotalSum : booking.totalMoney
                  )}{' '}
                  VNĐ
                </span>
              </div>

              {ticketDiscount > 0 && (
                <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                      Giá vé gốc
                    </span>
                    <span className="text-[#6B7280] dark:text-white/50 line-through block">
                      {new Intl.NumberFormat('vi-VN').format(originalTicketSum)} VNĐ
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                      Đã giảm giá
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-black block">
                      -{new Intl.NumberFormat('vi-VN').format(ticketDiscount)} VNĐ
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-between py-2 print:hidden">
              <div className="w-4 h-8 bg-gray-50 dark:bg-[#0A0C10] rounded-r-full border-r border-t border-b border-gray-200/80 dark:border-white/10 -ml-1" />
              <div className="border-t border-dashed border-gray-200 dark:border-white/10 flex-1 mx-2" />
              <div className="w-4 h-8 bg-gray-50 dark:bg-[#0A0C10] rounded-l-full border-l border-t border-b border-gray-200/80 dark:border-white/10 -mr-1" />
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-1 text-xs font-bold text-[#6B7280] dark:text-white/50">
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                  <User size={10} /> Khách hàng
                </span>
                <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold text-sm block">
                  {user.fullName || 'Chưa cập nhật'}
                </span>
                {user.phoneNumber && (
                  <span className="text-[#4B5563] dark:text-white/60 font-bold block">
                    {user.phoneNumber}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200/80 dark:border-white/10 pt-6 md:pt-0 md:pl-6 space-y-2">
                {booking.ticketCode ? (
                  <div className="w-28 h-28 bg-white border border-gray-200 dark:border-white/10 p-2 rounded-xl shadow-sm flex items-center justify-center">
                    <QRCodeSVG
                      value={booking.ticketCode}
                      size={96}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#111827"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-xl flex items-center justify-center text-center px-3">
                    <span className="text-[9px] font-bold text-[#9CA3AF] dark:text-white/40">
                      Mã vé đang được xử lý, vui lòng kiểm tra lại sau ít phút.
                    </span>
                  </div>
                )}
                {booking.ticketCode && (
                  <span className="text-sm font-black text-[#111827] dark:text-[#F5F7FB] tracking-widest">
                    {booking.ticketCode}
                  </span>
                )}
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 tracking-widest uppercase">
                  Mã soát vé xem phim
                </span>
              </div>
            </div>
          </div>

          {/* Phiếu 2: Bắp nước — UI giống employee */}
          {hasConcessions && (
            <div className="cine-print-invoice cine-print-invoice--food bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={22} />
                  <p className="text-sm font-black uppercase">Hóa Đơn Đồ Ăn / Bắp Nước</p>
                </div>
                <span className="text-xs font-black uppercase">#FD-{booking.invoiceId}</span>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                    Danh sách món đã chọn
                  </span>
                  <div className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
                    {effectiveConcessions.map((item, index) => (
                      <div key={index} className="p-3 flex items-center justify-between text-sm font-bold">
                        <div>
                          <p className="text-[#111827] dark:text-[#F5F7FB] font-extrabold uppercase">
                            {item.quantity}x {item.name}
                          </p>
                          {item.size && item.size !== 'NONE' && (
                            <p className="text-[10px] text-[#9CA3AF] dark:text-white/40 font-medium">
                              Cỡ: {item.size}
                            </p>
                          )}
                        </div>
                        <span className="text-[#111827] dark:text-[#F5F7FB]">
                          {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} VNĐ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
                  <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">
                    Tổng Tiền Đồ Ăn
                  </span>
                  <span className="text-2xl font-black text-amber-600">
                    {new Intl.NumberFormat('vi-VN').format(concessionTotalSum)} VNĐ
                  </span>
                </div>
              </div>

              <div className="p-6 bg-amber-50/60 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs font-semibold text-amber-900 dark:text-amber-200 text-center md:text-left">
                  <p className="font-extrabold uppercase text-amber-800 dark:text-amber-300 inline-flex items-center gap-1.5">
                    <TriangleAlert size={14} /> Hướng Dẫn Nhận Bắp Nước
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Vui lòng xuất trình phiếu này tại quầy bắp nước trước giờ chiếu 15 phút để nhân viên
                    chuẩn bị phần ăn tươi nóng cho bạn.
                  </p>
                </div>

                <div className="shrink-0 bg-white dark:bg-[#10131A] border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl text-center shadow-sm">
                  <div className="font-mono text-base font-black tracking-widest text-gray-800 dark:text-gray-200">
                    |||| | |||||| | |||
                  </div>
                  <span className="text-[8px] font-black text-[#9CA3AF] dark:text-white/40 uppercase tracking-widest block mt-0.5">
                    MÃ VẠCH #FD-{booking.invoiceId}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasConcessions && (
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 bg-[#F5F5F7] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl print:hidden">
            <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">
              Tổng Cộng Thanh Toán
            </span>
            <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">
              {new Intl.NumberFormat('vi-VN').format(booking.totalMoney)} VNĐ
            </span>
          </div>
        )}

        {showEmailBanner && booking.emailSent && booking.maskedEmail && (
          <div className="print:hidden flex items-center justify-center gap-2.5 text-center bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-2xl px-5 py-3.5 max-w-xl mx-auto transition-opacity duration-500">
            <MailCheck size={18} className="text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs font-semibold text-green-800 dark:text-green-300">
              Đã gửi vé qua email tới <strong>{booking.maskedEmail}</strong>. Không thấy email? Vui lòng
              kiểm tra hộp thư Spam.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#F5F5F7] dark:bg-white/10 border border-[#1C1C1E]/80 dark:border-white/70 text-[#1C1C1E] dark:text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:bg-[#1C1C1E] dark:hover:bg-white hover:text-white dark:hover:text-[#1C1C1E] transition-all cursor-pointer"
          >
            <Printer size={16} />
            {hasConcessions ? 'In 2 biên nhận' : 'In biên nhận'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-[#C00000] dark:bg-[#E50914] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] transition-all cursor-pointer"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
