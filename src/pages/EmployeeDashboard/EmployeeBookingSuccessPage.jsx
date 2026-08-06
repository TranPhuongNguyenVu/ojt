import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ChevronLeft, Clock, MapPin, Printer, ShoppingBag, Ticket, TriangleAlert, User } from 'lucide-react';
import BookingService from '../../services/BookingService';

// Che bớt thông tin định danh nhạy cảm trước khi in ra vé giấy,
// tránh bị lợi dụng nếu khách làm mất vé.
const maskSensitive = (value, keepStart = 3, keepEnd = 3) => {
  if (!value) return value;
  const str = String(value);
  if (str.length <= keepStart + keepEnd) return '*'.repeat(str.length);
  return str.slice(0, keepStart) + '*'.repeat(str.length - keepStart - keepEnd) + str.slice(-keepEnd);
};

const EmployeeBookingSuccessPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.bookingDetail || null);
  const [loading, setLoading] = useState(!location.state?.bookingDetail);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    const fetchDetail = () => {
      BookingService.getEmployeeBookingDetail(invoiceId)
        .then((res) => {
          if (cancelled) return;
          if (res.data.status === 200) {
            const detail = res.data.data;
            setBooking(detail);
            // Vé được sinh mã bất đồng bộ sau khi hóa đơn được ghi nhận,
            // nên nếu chưa có ticketCode thì thử tải lại vài lần.
            if (!detail.ticketCode && attempts < maxAttempts) {
              attempts += 1;
              setTimeout(fetchDetail, 1500);
              return;
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Lỗi tải thông tin hóa đơn:', err);
          if (!cancelled) setLoading(false);
        });
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-lg font-bold text-green-600 animate-pulse">
          Đang tạo biên nhận vé...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
        <p className="text-lg font-bold text-[#6B7280] dark:text-white/50">Không tìm thấy thông tin đặt vé này.</p>
        <button
          type="button"
          onClick={() => navigate('/employee/movies')}
          className="px-6 py-2 bg-[#C00000] text-white text-sm font-bold rounded-xl"
        >
          Quay lại danh sách phim
        </button>
      </div>
    );
  }

  const dateStr = booking.showtime
    ? new Date(booking.showtime).toLocaleDateString('vi-VN')
    : '';
  const timeStr = booking.showtime
    ? new Date(booking.showtime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handlePrint = () => window.print();

  const seatTypeLabel = (seatType) => {
    if (seatType === 2) return 'Đôi';
    if (seatType === 1) return 'VIP';
    return 'Thường';
  };

  const concessions = booking.concessions || [];
  const hasConcessions = concessions.length > 0;
  const concessionTotalSum = concessions.reduce(
    (sum, item) => sum + (item.lineTotal ?? item.unitPrice * item.quantity),
    0
  );
  const ticketTotalSum = Math.max(0, booking.totalMoney - concessionTotalSum);

  const seatPrices = booking.seatPrices || [];
  const hasOriginalSeatPrices = seatPrices.length > 0 && seatPrices.every((s) => s.price != null);
  const originalTicketSum = hasOriginalSeatPrices
    ? seatPrices.reduce((sum, s) => sum + s.price, 0)
    : 0;
  const ticketDiscount = hasOriginalSeatPrices ? Math.max(0, originalTicketSum - ticketTotalSum) : 0;

  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex items-center gap-4 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/employee/tickets/history')}
          className="p-2 rounded-full border border-gray-300 dark:border-white/15 bg-white dark:bg-[#10131A] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} className="text-[#374151] dark:text-white/70" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#111827] dark:text-[#F5F7FB] uppercase tracking-tight">
            Thông tin vé cuối cùng
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-white/50 font-semibold mt-1">
            Biên nhận vé đã được xác nhận thành công
          </p>
        </div>
      </div>

      <div className="text-center space-y-3 print:hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-[#111827] dark:text-[#F5F7FB] uppercase">Đặt vé thành công!</h2>
      </div>

      <div className={`cine-print-invoice-grid grid grid-cols-1 ${hasConcessions ? 'lg:grid-cols-2' : ''} gap-6 items-start max-w-6xl mx-auto`}>

        {/* Phiếu 1: Hóa đơn vé xem phim */}
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
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Phim</span>
                <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">{booking.movieName}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                  <MapPin size={10} /> Rạp
                </span>
                <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold">{booking.screen}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Ngày</span>
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
              <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Ghế &amp; Giá</span>
              {(booking.seatPrices || []).map((item) => (
                <div
                  key={item.seatLabel}
                  className="flex items-center justify-between text-sm font-bold"
                >
                  <span className="text-[#374151] dark:text-white/70">
                    {item.seatLabel}
                    <span className="ml-2 text-[10px] text-[#9CA3AF] dark:text-white/40 uppercase">
                      ({seatTypeLabel(item.seatType)})
                    </span>
                    {item.convertedByScore && (
                      <span className="ml-2 text-[10px] text-green-600 dark:text-green-400 uppercase">(Điểm)</span>
                    )}
                  </span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">
                    {item.convertedByScore
                      ? '0 VNĐ'
                      : `${new Intl.NumberFormat('vi-VN').format(item.price)} VNĐ`}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
              <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">
                {hasConcessions ? 'Tiền Vé' : 'Tổng Tiền Thanh Toán'}
              </span>
              <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">
                {new Intl.NumberFormat('vi-VN').format(hasConcessions ? ticketTotalSum : booking.totalMoney)} VNĐ
              </span>
            </div>

            {ticketDiscount > 0 && (
              <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Giá vé gốc</span>
                  <span className="text-[#6B7280] dark:text-white/50 line-through block">{new Intl.NumberFormat('vi-VN').format(originalTicketSum)} VNĐ</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Đã giảm giá</span>
                  <span className="text-green-600 dark:text-green-400 font-black block">-{new Intl.NumberFormat('vi-VN').format(ticketDiscount)} VNĐ</span>
                </div>
              </div>
            )}

          </div>

          {/* Đường nét đứt xé cuống vé */}
          <div className="relative flex items-center justify-between py-2 print:hidden">
            <div className="w-4 h-8 bg-gray-50 dark:bg-[#0A0C10] rounded-r-full border-r border-t border-b border-gray-200/80 dark:border-white/10 -ml-1"></div>
            <div className="border-t border-dashed border-gray-200 dark:border-white/10 flex-1 mx-2"></div>
            <div className="w-4 h-8 bg-gray-50 dark:bg-[#0A0C10] rounded-l-full border-l border-t border-b border-gray-200/80 dark:border-white/10 -mr-1"></div>
          </div>

          {/* Thông tin khách hàng và QR soát vé */}
          <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-1 text-xs font-bold text-[#6B7280] dark:text-white/50">
              <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                <User size={10} /> Khách hàng
              </span>
              <span className="text-[#111827] dark:text-[#F5F7FB] font-extrabold text-sm block">
                {booking.memberFullName || 'Khách lẻ'}
              </span>
              {booking.phoneNumber && (
                <span className="text-[#4B5563] dark:text-white/60 font-bold block">{maskSensitive(booking.phoneNumber, 3, 3)}</span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200/80 dark:border-white/10 pt-6 md:pt-0 md:pl-6 space-y-2">
              {booking.ticketCode ? (
                <div className="w-28 h-28 bg-white border border-gray-200 dark:border-white/10 p-2 rounded-xl shadow-sm flex items-center justify-center">
                  <QRCodeSVG value={booking.ticketCode} size={96} level="M" bgColor="#ffffff" fgColor="#111827" />
                </div>
              ) : (
                <div className="w-28 h-28 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-xl flex items-center justify-center text-center px-3">
                  <span className="text-[9px] font-bold text-[#9CA3AF] dark:text-white/40">Mã vé đang được xử lý, vui lòng kiểm tra lại sau ít phút.</span>
                </div>
              )}
              {booking.ticketCode && (
                <span className="text-sm font-black text-[#111827] dark:text-[#F5F7FB] tracking-widest">{booking.ticketCode}</span>
              )}
              <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 tracking-widest uppercase">Mã soát vé xem phim</span>
            </div>
          </div>
        </div>

        {/* Phiếu 2: Hóa đơn đồ ăn / bắp nước (chỉ hiện khi có đặt đồ ăn) */}
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
                <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Danh sách món đã chọn</span>
                <div className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
                  {concessions.map((item, index) => (
                    <div key={index} className="p-3 flex items-center justify-between text-sm font-bold">
                      <div>
                        <p className="text-[#111827] dark:text-[#F5F7FB] font-extrabold uppercase">
                          {item.quantity}x {item.itemName}
                        </p>
                        {item.size && item.size !== 'NONE' && (
                          <p className="text-[10px] text-[#9CA3AF] dark:text-white/40 font-medium">Cỡ: {item.size}</p>
                        )}
                      </div>
                      <span className="text-[#111827] dark:text-[#F5F7FB]">
                        {new Intl.NumberFormat('vi-VN').format(item.lineTotal ?? item.unitPrice * item.quantity)} VNĐ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
                <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">Tổng Tiền Đồ Ăn</span>
                <span className="text-2xl font-black text-amber-600">
                  {new Intl.NumberFormat('vi-VN').format(concessionTotalSum)} VNĐ
                </span>
              </div>
            </div>

            {/* Phần lưu ý nhận bắp nước tại quầy */}
            <div className="p-6 bg-amber-50/60 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs font-semibold text-amber-900 dark:text-amber-200 text-center md:text-left">
                <p className="font-extrabold uppercase text-amber-800 dark:text-amber-300 inline-flex items-center gap-1.5">
                  <TriangleAlert size={14} /> Hướng Dẫn Nhận Bắp Nước
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Vui lòng xuất trình phiếu này tại quầy bắp nước trước giờ chiếu 15 phút để nhân viên chuẩn bị phần ăn tươi nóng cho khách.
                </p>
              </div>

              {/* Mã vạch Barcode nhận bắp nước */}
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
          <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">Tổng Cộng Thanh Toán</span>
          <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">
            {new Intl.NumberFormat('vi-VN').format(booking.totalMoney)} VNĐ
          </span>
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
          onClick={() => navigate('/employee/movies')}
          className="px-8 py-3.5 bg-[#C00000] dark:bg-[#E50914] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] transition-all cursor-pointer"
        >
          Đặt vé mới
        </button>
      </div>
    </div>
  );
};

export default EmployeeBookingSuccessPage;
