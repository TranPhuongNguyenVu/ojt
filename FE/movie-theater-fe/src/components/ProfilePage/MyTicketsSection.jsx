/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V4 */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Armchair,
  MapPin,
  AlertCircle,
  X,
  QrCode,
  Ticket,
  FileText,
  Printer,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import BookingService from '../../services/BookingService';

/** Pending invoices created by retrying the same film booking — keep newest only. */
const dedupePendingTickets = (list) => {
  const sorted = [...list].sort(
    (a, b) => Number(b.invoiceId || 0) - Number(a.invoiceId || 0)
  );
  const seenPendingMovies = new Set();
  const result = [];

  for (const ticket of sorted) {
    if (ticket.status === 'pending') {
      const key = (ticket.movieTitle || '').trim().toLowerCase();
      if (seenPendingMovies.has(key)) continue;
      seenPendingMovies.add(key);
    }
    result.push(ticket);
  }

  return result;
};

const MyTicketsSection = ({ tab = 'booked', onCancelSuccess }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);

  const fetchTickets = () => {
    setLoading(true);
    BookingService.getBookingHistory()
      .then((res) => {
        // API returns invoiceId DESC — first match per movie is newest
        setTickets(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi lấy lịch sử đặt vé:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, [tab]);

  const handleCancelTicket = (invoiceId) => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn hủy vé này? Điểm tích lũy liên quan sẽ bị thu hồi / hoàn trả.'
      )
    ) {
      BookingService.cancelTicket(invoiceId)
        .then(() => {
          alert('Hủy vé thành công!');
          fetchTickets();
          if (onCancelSuccess) onCancelSuccess();
        })
        .catch((err) => {
          console.error('Lỗi hủy vé:', err);
          alert(err.response?.data?.message || 'Không thể hủy vé. Vui lòng thử lại sau!');
        });
    }
  };

  const handleRepayMomo = (invoiceId) => {
    BookingService.recreateMomoPayment(invoiceId)
      .then((res) => {
        if (res.data && res.data.payUrl) {
          window.location.href = res.data.payUrl;
        } else {
          alert('Không tạo được liên kết thanh toán. Vui lòng thử lại sau.');
        }
      })
      .catch((err) => {
        console.error('Lỗi thanh toán lại:', err);
        alert(
          err.response?.data?.error ||
            'Không thể khởi tạo thanh toán lại. Vui lòng thử lại sau.'
        );
      });
  };

  const getSmallImageUrl = (image) => {
    const fallback =
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
    if (!image) return fallback;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    const mockSmallImages = {
      'small1.jpg':
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      'small2.jpg':
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
      'small3.jpg':
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80',
      'small4.jpg':
        'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
      'small5.jpg':
        'https://images.unsplash.com/photo-1460889418202-14ebd473d78c?w=500&auto=format&fit=crop&q=80',
    };
    return mockSmallImages[image] || fallback;
  };

  const formatShowtime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = String(dateTimeStr).split('T');
    if (parts.length !== 2) return dateTimeStr;
    const time = parts[1].substring(0, 5);
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateTimeStr;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} - ${time}`;
  };

  const displayTickets = useMemo(() => {
    const byTab = tickets.filter((ticket) =>
      tab === 'canceled' ? ticket.status === 'canceled' : ticket.status !== 'canceled'
    );
    return dedupePendingTickets(byTab);
  }, [tickets, tab]);

  const getStoredConcessions = (invoiceId) => {
    try {
      const stored = sessionStorage.getItem(`concession_order_${invoiceId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      /* ignore */
    }
    return [];
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-bold text-[#9CA3AF] dark:text-white/40 animate-pulse uppercase tracking-wider">
        Đang tải danh sách vé...
      </div>
    );
  }

  const isCanceledTab = tab === 'canceled';

  const statusBadgeClass = (status) => {
    if (status === 'canceled')
      return 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30';
    if (status === 'booked')
      return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
    if (status === 'pending')
      return 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
    if (status === 'checked_in')
      return 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
    return 'bg-gray-100 dark:bg-white/10 text-[#6B7280] dark:text-white/45 border-gray-200 dark:border-white/10';
  };

  const cardShellClass = (status) => {
    if (status === 'canceled')
      return 'border-red-100/80 dark:border-red-500/20 opacity-80';
    if (status === 'pending')
      return 'border-amber-200/90 dark:border-amber-500/25 ring-1 ring-amber-100/80 dark:ring-amber-500/10';
    if (status === 'booked')
      return 'border-gray-200/80 dark:border-white/10 hover:border-[#C00000]/35 dark:hover:border-[#E50914]/40';
    return 'border-gray-150 dark:border-white/8 opacity-85';
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex items-end justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C00000] dark:text-[#ff4d57]">
            Vé của bạn
          </p>
          <h3 className="mt-1 text-base font-black text-[#111827] dark:text-white tracking-tight">
            {isCanceledTab ? 'Vé đã hủy' : 'Vé đã đặt'}
          </h3>
        </div>
        <span className="text-[10px] font-black text-[#6B7280] dark:text-white/45 uppercase tracking-widest bg-gray-100 dark:bg-white/8 px-2.5 py-1 rounded-lg">
          {displayTickets.length} vé
        </span>
      </div>

      {displayTickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {displayTickets.map((ticket) => {
            const isBooked = ticket.status === 'booked';
            const isCheckedIn = ticket.status === 'checked_in';
            const isExpired = ticket.status === 'expired';
            const isPending = ticket.status === 'pending';
            const isCanceled = ticket.status === 'canceled';

            return (
              <div
                key={ticket.invoiceId}
                className={`bg-white dark:bg-[#10131A]/90 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 transition-colors duration-300 shadow-sm ${cardShellClass(
                  ticket.status
                )}`}
              >
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0 border border-gray-200/80 dark:border-white/10">
                  <img
                    src={getSmallImageUrl(ticket.moviePoster)}
                    alt={ticket.movieTitle}
                    className={`w-full h-full object-cover ${
                      isCanceled || (!isBooked && !isPending) ? 'grayscale-[40%]' : ''
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-black text-[#111827] dark:text-white leading-tight">
                      {ticket.movieTitle}
                    </h4>
                    <span
                      className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusBadgeClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.statusText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-semibold text-[#6B7280] dark:text-white/50">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar size={14} className="shrink-0 text-[#9CA3AF] dark:text-white/35" />
                      <span className="truncate">{formatShowtime(ticket.datetime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Armchair size={14} className="shrink-0 text-[#9CA3AF] dark:text-white/35" />
                      <span className="truncate">
                        Ghế:{' '}
                        <span className="text-[#111827] dark:text-white font-bold">{ticket.seats}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="shrink-0 text-[#9CA3AF] dark:text-white/35" />
                      <span className="truncate">{ticket.cinema}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRepayMomo(ticket.invoiceId)}
                          className="bg-[#C00000] dark:bg-[#E50914] hover:bg-red-700 dark:hover:bg-[#ff1a25] text-white text-[10px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer"
                        >
                          Thanh toán ngay
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalState({ type: 'INVOICE', ticket })}
                          className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/8 text-[#374151] dark:text-white/80 text-[10px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer"
                        >
                          Xem hóa đơn
                        </button>
                      </>
                    )}
                    {(isBooked || isCheckedIn || isExpired) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalState({ type: 'TICKET', ticket })}
                          className="bg-[#111827] dark:bg-white dark:text-[#111827] hover:bg-black dark:hover:bg-white/90 text-white text-[10px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        >
                          <QrCode size={13} />
                          Xem mã vé
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalState({ type: 'INVOICE', ticket })}
                          className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/8 text-[#374151] dark:text-white/80 text-[10px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText size={13} />
                          Xem hóa đơn
                        </button>
                      </>
                    )}
                    {isBooked && (
                      <button
                        type="button"
                        onClick={() => handleCancelTicket(ticket.invoiceId)}
                        className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 text-[#C00000] dark:text-[#ff4d57] border border-red-200 dark:border-red-500/25 text-[10px] font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer"
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
        <div className="border border-dashed border-gray-200 dark:border-white/15 p-10 rounded-2xl text-center text-[#9CA3AF] dark:text-white/40 font-bold text-sm flex flex-col items-center justify-center gap-2">
          <AlertCircle className="text-gray-300 dark:text-white/25" size={24} />
          <span>
            {isCanceledTab ? 'Không có vé đã hủy nào.' : 'Không tìm thấy vé đã đặt nào.'}
          </span>
        </div>
      )}

      {modalState && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="ticket-invoice-modal bg-white dark:bg-[#10131A] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-transparent dark:border-white/10">
            <div
              className={`px-6 py-4 flex items-center justify-between text-white ${
                modalState.type === 'TICKET' ? 'bg-[#C00000] dark:bg-[#E50914]' : 'bg-[#111827]'
              }`}
            >
              <div className="flex items-center gap-2">
                {modalState.type === 'TICKET' ? <Ticket size={20} /> : <FileText size={20} />}
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {modalState.type === 'TICKET'
                    ? 'Chi tiết mã vé'
                    : 'Chi tiết hóa đơn'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {modalState.type === 'TICKET' && (
              <div className="p-6 space-y-6 text-center">
                <div>
                  <span className="text-[10px] font-black text-[#C00000] dark:text-[#ff4d57] tracking-widest uppercase block">
                    Mã đặt vé
                  </span>
                  <h4 className="text-xl font-black text-[#111827] dark:text-white uppercase tracking-tight mt-1">
                    {modalState.ticket.movieTitle}
                  </h4>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3 flex flex-col items-center justify-center">
                  {modalState.ticket.ticketCode ? (
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                      <QRCodeSVG
                        value={modalState.ticket.ticketCode}
                        size={168}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#111827"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-white dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/15 rounded-2xl flex items-center justify-center text-center px-4">
                      <span className="text-[10px] font-bold text-[#9CA3AF] dark:text-white/40">
                        Mã vé đang được xử lý, vui lòng kiểm tra lại sau ít phút.
                      </span>
                    </div>
                  )}
                  {modalState.ticket.ticketCode && (
                    <div>
                      <span className="text-[10px] font-black text-[#9CA3AF] dark:text-white/40 tracking-wider uppercase block">
                        Mã vé soát vé
                      </span>
                      <span className="text-lg font-black text-[#111827] dark:text-white tracking-wider">
                        {modalState.ticket.ticketCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-left text-[#4B5563] dark:text-white/65">
                  <div>
                    <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                      Suất chiếu
                    </span>
                    <span className="text-[#111827] dark:text-white font-extrabold">
                      {formatShowtime(modalState.ticket.datetime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                      Phòng & ghế
                    </span>
                    <span className="text-[#C00000] dark:text-[#ff4d57] font-extrabold">
                      {modalState.ticket.cinema} | Ghế {modalState.ticket.seats}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalState(null);
                    navigate(`/booking/success/${modalState.ticket.invoiceId}`);
                  }}
                  className="w-full py-3 bg-[#C00000] dark:bg-[#E50914] hover:bg-red-700 dark:hover:bg-[#ff1a25] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  Xem & in hóa đơn đầy đủ
                </button>
              </div>
            )}

            {modalState.type === 'INVOICE' && (
              <div className="p-6 space-y-5 text-left text-xs font-bold text-[#374151] dark:text-white/70">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-white/10 pb-3 gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-[#9CA3AF] dark:text-white/40 uppercase block">
                      Hóa đơn đặt vé
                    </span>
                    <h4 className="text-lg font-black text-[#111827] dark:text-white uppercase mt-0.5 truncate">
                      {modalState.ticket.movieTitle}
                    </h4>
                  </div>
                  <span className="shrink-0 text-xs font-black text-[#C00000] dark:text-[#ff4d57] bg-red-50 dark:bg-red-500/15 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-500/25">
                    #INV-{modalState.ticket.invoiceId}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-3 py-1">
                    <span className="text-[#6B7280] dark:text-white/45">Suất chiếu & phòng:</span>
                    <span className="text-[#111827] dark:text-white font-extrabold text-right">
                      {formatShowtime(modalState.ticket.datetime)} ({modalState.ticket.cinema})
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-3 py-1 border-t border-gray-100 dark:border-white/10">
                    <span className="text-[#6B7280] dark:text-white/45">Danh sách ghế:</span>
                    <span className="text-[#C00000] dark:text-[#ff4d57] font-extrabold">
                      {modalState.ticket.seats}
                    </span>
                  </div>

                  {getStoredConcessions(modalState.ticket.invoiceId).length > 0 && (
                    <div className="py-2 border-t border-gray-100 dark:border-white/10 space-y-1 bg-amber-50/60 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20">
                      <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                        <ShoppingBag size={12} /> Bắp nước đã đặt
                      </span>
                      {getStoredConcessions(modalState.ticket.invoiceId).map((c, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-[11px] text-amber-900 dark:text-amber-200 font-semibold gap-2"
                        >
                          <span>
                            {c.name} {c.size !== 'NONE' ? `(Size ${c.size})` : ''} x{c.quantity}
                          </span>
                          <span>
                            {new Intl.NumberFormat('vi-VN').format(c.price * c.quantity)} VNĐ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-white/10 text-amber-700 dark:text-amber-300">
                    <span className="flex items-center gap-1">
                      <Coins size={13} /> Điểm tích lũy nhận được:
                    </span>
                    <span className="font-extrabold">+{modalState.ticket.addScore || 0} điểm</span>
                  </div>

                  {modalState.ticket.useScore > 0 && (
                    <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-white/10 text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1">
                        <Coins size={13} /> Điểm đã sử dụng:
                      </span>
                      <span className="font-extrabold">
                        -{modalState.ticket.useScore} điểm (-
                        {new Intl.NumberFormat('vi-VN').format(modalState.ticket.useScore * 1000)}{' '}
                        VNĐ)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-white/15 text-sm gap-3">
                    <span className="font-black text-[#111827] dark:text-white uppercase">
                      Tổng thanh toán
                    </span>
                    <span className="font-black text-lg text-[#C00000] dark:text-[#ff4d57]">
                      {new Intl.NumberFormat('vi-VN').format(modalState.ticket.totalMoney)} VNĐ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalState(null);
                    navigate(`/booking/success/${modalState.ticket.invoiceId}`);
                  }}
                  className="w-full py-3.5 bg-[#111827] dark:bg-white dark:text-[#111827] hover:bg-black dark:hover:bg-white/90 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  Xem & in hóa đơn chi tiết
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyTicketsSection;
