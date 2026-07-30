import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Clock, MapPin, Printer, Ticket, User } from 'lucide-react';
import BookingService from '../../services/BookingService';

const EmployeeBookingSuccessPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.bookingDetail || null);
  const [loading, setLoading] = useState(!location.state?.bookingDetail);

  useEffect(() => {
    if (booking) return;

    BookingService.getEmployeeBookingDetail(invoiceId)
      .then((res) => {
        if (res.data.status === 200) {
          setBooking(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải thông tin hóa đơn:', err);
        setLoading(false);
      });
  }, [invoiceId, booking]);

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
          Back to Movie List
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
            Final Ticket Information
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
        <h2 className="text-xl font-black text-[#111827] dark:text-[#F5F7FB] uppercase">Booking Confirmed!</h2>
      </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#C00000] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Ticket size={22} />
            <p className="text-sm font-black uppercase">Hóa Đơn Thanh Toán</p>
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
            <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">Seats & Price</span>
            {(booking.seatPrices || []).map((item) => (
              <div
                key={item.seatLabel}
                className="flex items-center justify-between text-sm font-bold"
              >
                <span className="text-[#374151] dark:text-white/70">
                  {item.seatLabel}
                  {item.convertedByScore && (
                    <span className="ml-2 text-[10px] text-green-600 dark:text-green-400 uppercase">(Score)</span>
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
            <span className="text-sm font-black text-[#6B7280] dark:text-white/50 uppercase">Tổng Tiền Thanh Toán</span>
            <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">
              {new Intl.NumberFormat('vi-VN').format(booking.totalMoney)} VNĐ
            </span>
          </div>

          {booking.memberId && (
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-3">
              <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase flex items-center gap-1">
                <User size={10} /> Member Information
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#4B5563] dark:text-white/60">
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Member ID</span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">{booking.memberId}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Full Name</span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">{booking.memberFullName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Identity Card</span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">{booking.identityCard}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Phone</span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">{booking.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Score Used</span>
                  <span className="text-[#C00000] dark:text-[#ff4d57]">-{booking.useScore || 0} pts</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] dark:text-white/40 uppercase block">Score After</span>
                  <span className="text-[#111827] dark:text-[#F5F7FB]">{booking.memberScoreAfter ?? 0} pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#F5F5F7] dark:bg-white/10 border border-[#1C1C1E]/80 dark:border-white/70 text-[#1C1C1E] dark:text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:bg-[#1C1C1E] dark:hover:bg-white hover:text-white dark:hover:text-[#1C1C1E] transition-all cursor-pointer"
        >
          <Printer size={16} />
          Print Receipt
        </button>
        <button
          type="button"
          onClick={() => navigate('/employee/movies')}
          className="px-8 py-3.5 bg-[#C00000] dark:bg-[#E50914] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:bg-[#a00000] dark:hover:bg-[#ff1a25] transition-all cursor-pointer"
        >
          New Booking
        </button>
      </div>
    </div>
  );
};

export default EmployeeBookingSuccessPage;
