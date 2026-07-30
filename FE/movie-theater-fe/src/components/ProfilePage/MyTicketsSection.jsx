import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Armchair, MapPin, AlertCircle, X, QrCode, Ticket, FileText, Printer, ShoppingBag, Coins, CreditCard, CheckCircle2 } from 'lucide-react';
import BookingService from '../../services/BookingService';

const MyTicketsSection = ({ tab = 'booked', onCancelSuccess }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Modal xem Mã vé hoặc Hóa đơn
  // modalState: { type: 'TICKET' | 'INVOICE', ticket: object } | null
  const [modalState, setModalState] = useState(null);

  const fetchTickets = () => {
    setLoading(true);
    BookingService.getBookingHistory()
      .then((res) => {
        setTickets(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy lịch sử đặt vé:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, [tab]);

  // Hủy vé đặt trực tuyến (AC-04)
  const handleCancelTicket = (invoiceId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy vé này? Điểm tích lũy liên quan sẽ bị thu hồi / hoàn trả.")) {
      BookingService.cancelTicket(invoiceId)
        .then(() => {
          alert("Hủy vé thành công!");
          fetchTickets();
          if (onCancelSuccess) onCancelSuccess();
        })
        .catch((err) => {
          console.error("Lỗi hủy vé:", err);
          alert(err.response?.data?.message || "Không thể hủy vé. Vui lòng thử lại sau!");
        });
    }
  };

  // Thanh toán lại hóa đơn MoMo chờ thanh toán
  const handleRepayMomo = (invoiceId) => {
    BookingService.recreateMomoPayment(invoiceId)
      .then((res) => {
        if (res.data && res.data.payUrl) {
          window.location.href = res.data.payUrl;
        } else {
          alert("Không tạo được liên kết thanh toán. Vui lòng thử lại sau.");
        }
      })
      .catch((err) => {
        console.error("Lỗi thanh toán lại:", err);
        alert(err.response?.data?.error || "Không thể khởi tạo thanh toán lại. Vui lòng thử lại sau.");
      });
  };

  // Quy đổi ảnh
  const getSmallImageUrl = (image) => {
    const fallback = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
    if (!image) return fallback;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    const mockSmallImages = {
      'small1.jpg': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      'small2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
      'small3.jpg': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80',
      'small4.jpg': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
      'small5.jpg': 'https://images.unsplash.com/photo-1460889418202-14ebd473d78c?w=500&auto=format&fit=crop&q=80',
    };
    return mockSmallImages[image] || fallback;
  };

  // Định dạng ngày chiếu DD/MM/YYYY - HH:mm
  const formatShowtime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split('T');
    if (parts.length !== 2) return dateTimeStr;
    const time = parts[1].substring(0, 5);
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateTimeStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} - ${time}`;
  };

  // Lọc vé hiển thị theo Tab tương ứng
  const displayTickets = tickets.filter(ticket => {
    if (tab === 'canceled') {
      return ticket.status === 'canceled';
    } else {
      return ticket.status !== 'canceled';
    }
  });

  if (loading) {
    return (
      <div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse uppercase tracking-wider">
        Đang tải danh sách vé...
      </div>
    );
  }

  const isCanceledTab = tab === 'canceled';

  // Lấy bắp nước từ lưu trữ local nếu có
  const getStoredConcessions = (invoiceId) => {
    try {
      const stored = sessionStorage.getItem(`concession_order_${invoiceId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Tiêu đề mục */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-black text-gray-900 tracking-tight uppercase">
          {isCanceledTab ? 'Vé đã hủy / Canceled Tickets' : 'Vé đã đặt / Booked Tickets'}
        </h3>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-sm">
          Tổng số: {displayTickets.length}
        </span>
      </div>

      {/* Danh sách vé */}
      {displayTickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {displayTickets.map((ticket) => {
            const isUpcoming = ticket.status === 'upcoming';
            const isCanceled = ticket.status === 'canceled';
            return (
              <div 
                key={ticket.invoiceId} 
                className={`bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 transition-all shadow-sm ${
                  isCanceled
                    ? 'border-red-100 bg-red-50/10 filter grayscale-[50%] opacity-80'
                    : isUpcoming 
                      ? 'border-gray-200/80 hover:border-gray-300' 
                      : 'border-gray-150 bg-gray-50/20 filter grayscale opacity-75'
                }`}
              >
                
                {/* Poster Phim */}
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-200/80">
                  <img 
                    src={getSmallImageUrl(ticket.moviePoster)} 
                    alt={ticket.movieTitle} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thông tin vé */}
                <div className="flex-1 w-full text-left space-y-3.5">
                  
                  {/* Tên phim & Tag trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-black text-gray-800 leading-tight">
                      {ticket.movieTitle}
                    </h4>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isCanceled
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : isUpcoming 
                          ? 'bg-green-50 text-green-700 border border-green-150' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {ticket.statusText}
                    </span>
                  </div>

                  {/* Chi tiết suất chiếu & ghế */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold text-gray-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{formatShowtime(ticket.datetime)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Armchair size={14} className="text-gray-400" />
                      <span>Ghế: <span className="text-gray-850 font-bold">{ticket.seats}</span></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="truncate">{ticket.cinema}</span>
                    </div>
                  </div>

                  {/* Các nút hành động */}
                  <div className="flex flex-wrap gap-2.5 pt-1.5">
                    {ticket.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleRepayMomo(ticket.invoiceId)}
                          className="bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black tracking-wider uppercase px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Thanh toán ngay
                        </button>
                        <button 
                          onClick={() => setModalState({ type: 'INVOICE', ticket })}
                          className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-black tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Xem hóa đơn
                        </button>
                      </>
                    )}
                    {(ticket.status === 'upcoming' || ticket.status === 'completed') && (
                      <>
                        <button 
                          onClick={() => setModalState({ type: 'TICKET', ticket })}
                          className="bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-black tracking-wider uppercase px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        >
                          <QrCode size={13} />
                          Xem mã vé
                        </button>
                        <button 
                          onClick={() => setModalState({ type: 'INVOICE', ticket })}
                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-black tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText size={13} />
                          Xem hóa đơn
                        </button>
                      </>
                    )}
                    {isUpcoming && (
                      <button 
                        onClick={() => handleCancelTicket(ticket.invoiceId)}
                        className="bg-red-50 hover:bg-red-100/80 text-[#C00000] border border-red-200 text-[10px] font-black tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Hủy vé
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-10 rounded-2xl text-center text-gray-400 dark:text-gray-500 font-bold text-sm flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="text-gray-300" size={24} />
          <span>
            {isCanceledTab 
              ? 'Không có vé đã hủy nào.' 
              : 'Không tìm thấy vé đã đặt nào.'
            }
          </span>
        </div>
      )}

      {/* ================= MODAL HIỂN THỊ CHI TIẾT MÃ VÉ HẶC HÓA ĐƠN ================= */}
      {modalState && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header Modal */}
            <div className={`px-6 py-4 flex items-center justify-between text-white ${
              modalState.type === 'TICKET' ? 'bg-[#E50914]' : 'bg-gray-900'
            }`}>
              <div className="flex items-center gap-2">
                {modalState.type === 'TICKET' ? <Ticket size={20} /> : <FileText size={20} />}
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {modalState.type === 'TICKET' ? 'Chi Tiết Mã Vé Xem Phim' : 'Chi Tiết Hóa Đơn Thanh Toán'}
                </h3>
              </div>
              <button 
                onClick={() => setModalState(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Modal: Xem Mã Vé */}
            {modalState.type === 'TICKET' && (
              <div className="p-6 space-y-6 text-center">
                <div>
                  <span className="text-[10px] font-black text-[#E50914] tracking-widest uppercase block">MÃ ĐẶT VÉ VÀ KHÓA VÉ</span>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1">
                    {modalState.ticket.movieTitle}
                  </h4>
                </div>

                {/* Khung Mã Vạch / QR Code */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 flex flex-col items-center justify-center">
                  <div className="w-36 h-36 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 p-2 rounded-2xl shadow-sm flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900">
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
                  <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase block">MÃ VÉ HÓA ĐƠN</span>
                    <span className="text-lg font-black text-gray-900 tracking-wider">#INV-{modalState.ticket.invoiceId}</span>
                  </div>
                </div>

                {/* Chi tiết suất & ghế */}
                <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-left text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Suất Chiếu</span>
                    <span className="text-gray-900 font-extrabold">{formatShowtime(modalState.ticket.datetime)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Phòng & Ghế</span>
                    <span className="text-[#E50914] font-extrabold">{modalState.ticket.cinema} | Ghế {modalState.ticket.seats}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setModalState(null);
                      navigate(`/booking/success/${modalState.ticket.invoiceId}`);
                    }}
                    className="flex-1 py-3 bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Printer size={15} />
                    <span>Xem & In 2 Phiếu Hóa Đơn Full</span>
                  </button>
                </div>
              </div>
            )}

            {/* Content Modal: Xem Hóa Đơn */}
            {modalState.type === 'INVOICE' && (
              <div className="p-6 space-y-5 text-left text-xs font-bold text-gray-700">
                
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase block">HÓA ĐƠN ĐẶT VÉ</span>
                    <h4 className="text-lg font-black text-gray-900 uppercase mt-0.5">{modalState.ticket.movieTitle}</h4>
                  </div>
                  <span className="text-xs font-black text-[#E50914] bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    #INV-{modalState.ticket.invoiceId}
                  </span>
                </div>

                {/* Các dòng chi tiết tiền tệ */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Suất chiếu & Phòng:</span>
                    <span className="text-gray-900 font-extrabold">{formatShowtime(modalState.ticket.datetime)} ({modalState.ticket.cinema})</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-t border-gray-100">
                    <span className="text-gray-500">Danh sách ghế:</span>
                    <span className="text-[#E50914] font-extrabold">{modalState.ticket.seats}</span>
                  </div>

                  {/* Bắp nước nếu có */}
                  {getStoredConcessions(modalState.ticket.invoiceId).length > 0 && (
                    <div className="py-2 border-t border-gray-100 space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1">
                        <ShoppingBag size={12} /> BẮP NƯỚC ĐÃ ĐẶT:
                      </span>
                      {getStoredConcessions(modalState.ticket.invoiceId).map((c, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-amber-900 font-semibold">
                          <span>{c.name} {c.size !== 'NONE' ? `(Size ${c.size})` : ''} x{c.quantity}</span>
                          <span>{new Intl.NumberFormat('vi-VN').format(c.price * c.quantity)} VNĐ</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Điểm thưởng & Điểm dùng */}
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 text-yellow-700">
                    <span className="flex items-center gap-1"><Coins size={13} /> Điểm tích lũy nhận được:</span>
                    <span className="font-extrabold">+{modalState.ticket.addScore || 0} điểm</span>
                  </div>

                  {modalState.ticket.useScore > 0 && (
                    <div className="flex justify-between items-center py-1 border-t border-gray-100 text-green-700">
                      <span className="flex items-center gap-1"><Coins size={13} /> Điểm đã sử dụng:</span>
                      <span className="font-extrabold">-{modalState.ticket.useScore} điểm (-{new Intl.NumberFormat('vi-VN').format(modalState.ticket.useScore * 1000)} VNĐ)</span>
                    </div>
                  )}

                  {/* Tổng tiền */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-sm">
                    <span className="font-black text-gray-900 uppercase">TỔNG TIỀN THANH TOÁN:</span>
                    <span className="font-black text-lg text-[#E50914]">
                      {new Intl.NumberFormat('vi-VN').format(modalState.ticket.totalMoney)} VNĐ
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      setModalState(null);
                      navigate(`/booking/success/${modalState.ticket.invoiceId}`);
                    }}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Printer size={15} />
                    <span>Xem & In 2 Phiếu Hóa Đơn Chi Tiết</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default MyTicketsSection;
