import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Film, MapPin, User, Mail, CreditCard, Phone, Printer, ShoppingBag, Ticket } from 'lucide-react';
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

  useEffect(() => {
    // Lấy thông tin user
    const userLoginStr = localStorage.getItem("USER_LOGIN");
    if (userLoginStr) {
      setUser(JSON.parse(userLoginStr));
    }

    // Lấy danh sách bắp nước combo từ location state hoặc sessionStorage
    const stateConcessions = location.state?.concessions;
    if (stateConcessions && stateConcessions.length > 0) {
      setConcessions(stateConcessions);
    } else {
      const stored = sessionStorage.getItem(`concession_order_${invoiceId}`);
      if (stored) {
        try {
          setConcessions(JSON.parse(stored));
        } catch (e) {
          console.error("Lỗi đọc danh sách bắp nước:", e);
        }
      }
    }

    // Tải lịch sử đặt vé để tìm hóa đơn vừa thanh toán
    BookingService.getBookingHistory()
      .then((res) => {
        const list = res.data.data || [];
        const found = list.find(item => item.invoiceId === parseInt(invoiceId));
        if (found) {
          setBooking(found);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin hóa đơn thành công:", err);
        setLoading(false);
      });
  }, [invoiceId, location.state]);

  if (loading) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-green-600 dark:text-green-400 animate-pulse">
          Đang tạo 2 phiếu biên nhận...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-gray-500 dark:text-white/70">
          Không tìm thấy thông tin đặt vé này.
        </div>
      </div>
    );
  }

  // Tách ngày và giờ từ trường datetime
  const dateStr = booking.datetime ? new Date(booking.datetime).toLocaleDateString('vi-VN') : '';
  const timeStr = booking.datetime ? new Date(booking.datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  const seatList = booking.seats ? booking.seats.split(', ') : [];
  const seatsCount = seatList.length;

  const effectiveConcessions = (concessions && concessions.length > 0) ? concessions : (booking.concessions || []);
  const hasConcessions = effectiveConcessions.length > 0;

  const concessionTotalSum = effectiveConcessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const ticketTotalSum = Math.max(0, booking.totalMoney - concessionTotalSum);
  const avgPrice = seatsCount > 0 ? ticketTotalSum / seatsCount : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cine-booking-canvas bg-[#F8F9FA] dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white pb-20 font-sans print:bg-white print:pb-0 transition-colors duration-300">
      {/* Ẩn stepper khi print */}
      <div className="print:hidden">
        <BookingStepper currentStep={3} />
      </div>

      <div className={`${hasConcessions ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-6 pt-12 space-y-8`}>
        
        {/* ================= THÔNG BÁO THÀNH CÔNG ================= */}
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Đặt Vé Thành Công!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold max-w-md mx-auto">
            {hasConcessions ? (
              <>Hệ thống đã xuất <strong className="text-gray-900 dark:text-white">2 phiếu hóa đơn riêng biệt</strong> cho bạn (Vé Xem Phim & Phiếu Bắp Nước Combo).</>
            ) : (
              <>Hệ thống đã xuất <strong className="text-gray-900 dark:text-white">hóa đơn vé xem phim</strong> thành công cho bạn.</>
            )}
          </p>
        </div>

        {/* ================= KHỐI HÓA ĐƠN (2 CỘT SONG SONG KHI MUA BẮP NƯỚC, 1 PHIẾU KHI KHÔNG MUA) ================= */}
        <div className={`grid grid-cols-1 ${hasConcessions ? 'lg:grid-cols-2' : ''} gap-8 items-start`}>

          {/* ================= PHIẾU 1: HÓA ĐƠN VÉ XEM PHIM ================= */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-lg overflow-hidden relative print:border-none print:shadow-none transition-colors duration-300">
            
            <div className="bg-[#E50914] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Ticket size={20} />
                <span className="text-xs font-black tracking-widest uppercase">PHIẾU 1: HÓA ĐƠN VÉ XEM PHIM</span>
              </div>
              <span className="text-xs font-black uppercase">#INV-{booking.invoiceId}</span>
            </div>

            {/* Phần trên: Chi tiết Vé xem phim */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="text-[10px] font-black text-[#E50914] tracking-widest uppercase block">TÊN PHIM</span>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mt-1">{booking.movieTitle}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase block">RẠP CHIẾU</span>
                  <span className="text-base font-black text-gray-900 dark:text-white uppercase">Cinema Elite</span>
                </div>
              </div>

              {/* Thông tin phòng & suất chiếu */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-bold text-gray-600 dark:text-gray-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><MapPin size={10} /> PHÒNG</span>
                  <span className="text-gray-900 dark:text-white font-extrabold block">{booking.cinema}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><Calendar size={10} /> NGÀY CHIẾU</span>
                  <span className="text-gray-900 dark:text-white font-extrabold block">{dateStr}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><Clock size={10} /> SUẤT CHIẾU</span>
                  <span className="text-gray-900 dark:text-white font-extrabold block">{timeStr}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">SỐ GHẾ</span>
                  <span className="text-[#E50914] font-black block truncate">{booking.seats}</span>
                </div>
              </div>

              {/* Chi tiết tài chính vé */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Số lượng vé</span>
                  <span className="text-gray-900 dark:text-white font-extrabold block">{seatsCount} vé</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Đơn giá vé</span>
                  <span className="text-gray-900 dark:text-white font-extrabold block">{new Intl.NumberFormat('vi-VN').format(avgPrice)} VNĐ</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Tiền vé xem phim</span>
                  <span className="text-lg font-black text-[#E50914] block">{new Intl.NumberFormat('vi-VN').format(ticketTotalSum)} VNĐ</span>
                </div>
              </div>
            </div>

            {/* Đường nét đứt xé cuống vé */}
            <div className="relative flex items-center justify-between py-2 print:hidden">
              <div className="w-4 h-8 bg-[#F8F9FA] dark:bg-[#050505] rounded-r-full border-r border-t border-b border-gray-200/80 dark:border-gray-800 -ml-1"></div>
              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 flex-1 mx-2"></div>
              <div className="w-4 h-8 bg-[#F8F9FA] dark:bg-[#050505] rounded-l-full border-l border-t border-b border-gray-200/80 dark:border-gray-800 -mr-1"></div>
            </div>

            {/* Phần dưới: Thông tin người mua và Barcode nhận vé xem phim */}
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              <div className="md:col-span-2 space-y-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><User size={10} /> HỌ TÊN KHÁCH HÀNG</span>
                  <span className="text-gray-800 dark:text-gray-200 font-extrabold text-sm block">{user.fullName || 'Chưa cập nhật'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><Mail size={10} /> EMAIL</span>
                    <span className="text-gray-800 dark:text-gray-200 font-extrabold block truncate">{user.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase flex items-center gap-1"><Phone size={10} /> SỐ ĐIỆN THOẠI</span>
                    <span className="text-gray-800 dark:text-gray-200 font-extrabold block">{user.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Mã vạch QR Code soát vé */}
              <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200/80 dark:border-gray-700 pt-6 md:pt-0 md:pl-6 space-y-2">
                <div className="w-24 h-24 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 p-2 rounded-xl shadow-sm flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900 dark:text-gray-100">
                    <rect x="10" y="10" width="20" height="20" fill="currentColor"/>
                    <rect x="15" y="15" width="10" height="10" fill="white"/>
                    <rect x="70" y="10" width="20" height="20" fill="currentColor"/>
                    <rect x="75" y="15" width="10" height="10" fill="white"/>
                    <rect x="10" y="70" width="20" height="20" fill="currentColor"/>
                    <rect x="15" y="75" width="10" height="10" fill="white"/>
                    <rect x="35" y="10" width="5" height="10" fill="currentColor"/>
                    <rect x="45" y="15" width="10" height="5" fill="currentColor"/>
                    <rect x="40" y="25" width="20" height="5" fill="currentColor"/>
                    <rect x="10" y="35" width="10" height="5" fill="currentColor"/>
                    <rect x="25" y="35" width="5" height="10" fill="currentColor"/>
                    <rect x="35" y="45" width="15" height="10" fill="currentColor"/>
                    <rect x="55" y="35" width="10" height="15" fill="currentColor"/>
                    <rect x="70" y="35" width="5" height="20" fill="currentColor"/>
                    <rect x="80" y="45" width="10" height="5" fill="currentColor"/>
                    <rect x="10" y="50" width="15" height="5" fill="currentColor"/>
                    <rect x="15" y="60" width="5" height="5" fill="currentColor"/>
                    <rect x="35" y="60" width="15" height="5" fill="currentColor"/>
                    <rect x="35" y="70" width="5" height="15" fill="currentColor"/>
                    <rect x="45" y="75" width="10" height="10" fill="currentColor"/>
                    <rect x="60" y="65" width="25" height="5" fill="currentColor"/>
                    <rect x="60" y="75" width="5" height="15" fill="currentColor"/>
                    <rect x="70" y="80" width="20" height="5" fill="currentColor"/>
                    <rect x="80" y="70" width="5" height="5" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">MÃ SOÁT VÉ XEM PHIM</span>
              </div>

            </div>

          </div>

          {/* ================= PHIẾU 2: PHIẾU BẮP NƯỚC & COMBO (CHỈ HIỆN KHI CÓ MUA BẮP NƯỚC) ================= */}
          {hasConcessions && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-lg overflow-hidden relative print:border-none print:shadow-none transition-colors duration-300">
              
              <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} />
                  <span className="text-xs font-black tracking-widest uppercase">PHIẾU 2: PHIẾU ĐẶT BẮP NƯỚC & COMBO</span>
                </div>
                <span className="text-xs font-black uppercase">#FD-{booking.invoiceId}</span>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 tracking-widest uppercase block">QUẦY DỊCH VỤ</span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mt-1">Concession Counter</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase block">THỜI GIAN ĐẶT</span>
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100">{dateStr} {timeStr}</span>
                  </div>
                </div>

                {/* Danh sách các món Bắp nước đã đặt */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">DANH SÁCH MÓN ĐÃ CHỌN</span>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {effectiveConcessions.map((item, index) => (
                      <div key={index} className="p-3.5 flex items-center justify-between text-xs font-bold bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-extrabold uppercase">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {item.size !== 'NONE' ? `Size: ${item.size}` : 'Phần chuẩn'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 dark:text-white font-black">
                            {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} VNĐ
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            ({new Intl.NumberFormat('vi-VN').format(item.price)} VNĐ / phần)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chi tiết tài chính bắp nước */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm font-bold text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">TỔNG TIỀN BẮP NƯỚC & COMBO</span>
                    <span className="text-xs text-gray-400 font-medium block">(Đã bao gồm thuế & phí phục vụ)</span>
                  </div>
                  <span className="text-xl font-black text-amber-600">
                    {new Intl.NumberFormat('vi-VN').format(concessionTotalSum)} VNĐ
                  </span>
                </div>
              </div>

              {/* Phần lưu ý nhận bắp nước tại quầy */}
              <div className="p-6 md:p-8 bg-amber-50/60 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs font-semibold text-amber-900 dark:text-amber-200 text-center md:text-left">
                  <p className="font-extrabold uppercase text-amber-800 dark:text-amber-300">⚠️ HƯỚNG DẪN NHẬN BẮP NƯỚC</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Vui lòng xuất trình phiếu này tại quầy Concession trước giờ chiếu 15 phút để nhân viên chuẩn bị phần ăn tươi nóng cho bạn.</p>
                </div>

                {/* Mã vạch Barcode nhận bắp nước */}
                <div className="shrink-0 bg-white dark:bg-gray-950 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl text-center shadow-sm">
                  <div className="font-mono text-base font-black tracking-widest text-gray-800 dark:text-gray-200">
                    |||| | |||||| | |||
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mt-0.5">
                    BARCODE #FD-{booking.invoiceId}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ================= KHỐI NÚT HÀNH ĐỘNG ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-gray-900 border border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all transform active:scale-95 cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <Printer size={16} />
            <span>{hasConcessions ? 'IN 2 PHIẾU HÓA ĐƠN' : 'IN HÓA ĐƠN VÉ'}</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded-xl hover:bg-gray-800 dark:hover:bg-white transition-all transform active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <span>QUAY VỀ TRANG CHỦ</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingSuccessPage;
