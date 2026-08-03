import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Film, MapPin, Search, Ticket, User } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import BookingService from '../../services/BookingService';
import CustomerService from '../../services/CustomerService';
import ConcessionService from '../../services/ConcessionService';
import { getMovieImageUrl } from '../../utils/movieImageUtils';
import { compareSeatsByPosition, getSeatLabel } from '../../utils/seatUtils';
import { BOOKING_CONCESSION_LABELS as CL } from '../../constants/labels';

const POINT_VALUE = 1000;
const CONCESSION_SIZE_LABELS = { NONE: CL.sizeNone, S: CL.sizeS, M: CL.sizeM, L: CL.sizeL };

const EmployeeTicketInformationPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedSeats = location.state?.selectedSeats || [];
  const showtimeState = location.state?.showtimeState || {};
  const keepHoldRef = useRef(false);

  const [movie, setMovie] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [memberQuery, setMemberQuery] = useState('');
  const [member, setMember] = useState(null);
  const [memberChecked, setMemberChecked] = useState(false);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [checkingMember, setCheckingMember] = useState(false);

  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsInput, setPointsInput] = useState('');

  const [concessionTab, setConcessionTab] = useState('food');
  const [foods, setFoods] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [combos, setCombos] = useState([]);
  const [concessionSelections, setConcessionSelections] = useState({});

  useEffect(() => {
    Promise.all([
      ConcessionService.getAllFoods(),
      ConcessionService.getAllDrinks(),
      ConcessionService.getAllCombos(),
    ])
      .then(([foodRes, drinkRes, comboRes]) => {
        setFoods(foodRes.data.data || []);
        setDrinks(drinkRes.data.data || []);
        setCombos(comboRes.data.data || []);
      })
      .catch((err) => console.error('Lỗi tải danh sách bắp nước:', err));
  }, []);

  const CONCESSION_TABS = [
    { key: 'food', type: 'FOOD', label: CL.tabFood, items: foods, idKey: 'foodId', nameKey: 'foodName' },
    { key: 'drink', type: 'DRINK', label: CL.tabDrink, items: drinks, idKey: 'drinkId', nameKey: 'drinkName' },
    { key: 'combo', type: 'COMBO', label: CL.tabCombo, items: combos, idKey: 'comboId', nameKey: 'comboName' },
  ];

  const updateConcessionQty = (itemType, itemId, size, name, unitPrice, delta) => {
    const key = `${itemType}-${itemId}-${size}`;
    setConcessionSelections((prev) => {
      const currentQty = prev[key]?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);
      if (nextQty === 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { itemType, itemId, size, name, unitPrice, quantity: nextQty } };
    });
  };

  const concessionLines = Object.values(concessionSelections);
  const concessionsSubtotal = concessionLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  useEffect(() => {
    if (!selectedSeats.length || !scheduleId) {
      navigate('/employee/showtime', { replace: true });
      return;
    }

    const seatIds = selectedSeats.map((s) => s.seatId);
    BookingService.confirmBooking(scheduleId, seatIds).catch(() => {});

    const release = () => {
      if (keepHoldRef.current) return;
      BookingService.releaseSeats(scheduleId, seatIds).catch(() => {});
    };
    const onPageHide = () => release();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, selectedSeats.map((s) => s.seatId).join(',')]);

  useEffect(() => {
    if (!selectedSeats.length || !scheduleId) {
      return;
    }

    setLoading(true);
    ScheduleService.getScheduleById(scheduleId)
      .then((res) => {
        setSchedule(res.data.data);
        return MovieService.getMovieById(res.data.data.movieId);
      })
      .then((movieRes) => {
        setMovie(movieRes.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải thông tin vé:', err);
        setLoading(false);
      });
  }, [scheduleId, selectedSeats.length, navigate]);

  const getRowLetter = (rowNum) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return letters[rowNum - 1] || `${rowNum}`;
  };

  const getSeatPrice = (seat) => (seat.price != null ? parseFloat(seat.price) : 0);

  const sortedSeats = useMemo(
    () => [...selectedSeats].sort(compareSeatsByPosition),
    [selectedSeats]
  );

  const seatPrices = useMemo(
    () =>
      sortedSeats
        .map((seat) => ({ seat, price: getSeatPrice(seat) }))
        .sort((a, b) => a.price - b.price),
    [sortedSeats, schedule]
  );

  const totalAmount = seatPrices.reduce((sum, item) => sum + item.price, 0);

  const maxPointsAllowed = useMemo(() => {
    if (!member) return 0;
    const byTotal = Math.floor(totalAmount / POINT_VALUE);
    return Math.min(member.score || 0, byTotal);
  }, [member, totalAmount]);

  const activePointsToUse = Math.min(pointsToUse, maxPointsAllowed);
  const pointsDiscount = activePointsToUse * POINT_VALUE;
  const payableTotal = Math.max(0, totalAmount - pointsDiscount) + concessionsSubtotal;
  const remainingPoints = member ? Math.max(0, (member.score || 0) - activePointsToUse) : 0;

  const scoreInsufficient =
    member &&
    (pointsToUse > (member.score || 0) || pointsToUse * POINT_VALUE > totalAmount);

  const handleCheckMember = () => {
    const query = memberQuery.trim().replace(/\s+/g, '');
    if (!query) return;

    setCheckingMember(true);
    setMember(null);
    setMemberNotFound(false);
    setMemberChecked(false);
    setPointsToUse(0);
    setPointsInput('');

    CustomerService.lookupMember(query)
      .then((res) => {
        if (res.data.status === 200 && res.data.data) {
          setMember(res.data.data);
          setMemberNotFound(false);
        } else {
          setMember(null);
          setMemberNotFound(true);
        }
        setMemberChecked(true);
        setCheckingMember(false);
      })
      .catch(() => {
        setMember(null);
        setMemberNotFound(true);
        setMemberChecked(true);
        setCheckingMember(false);
      });
  };

  const handlePointsInputChange = (e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    setPointsInput(val);
    const numPoints = val === '' ? 0 : parseInt(val, 10);

    if (numPoints > maxPointsAllowed) {
      setPointsToUse(maxPointsAllowed);
      setPointsInput(String(maxPointsAllowed));
    } else {
      setPointsToUse(numPoints);
    }
  };

  const handleUseAllPoints = () => {
    setPointsToUse(maxPointsAllowed);
    setPointsInput(String(maxPointsAllowed));
  };

  const handleConfirmBooking = () => {
    if (scoreInsufficient) return;

    setSubmitting(true);
    const seatIds = selectedSeats.map((s) => s.seatId);
    const bookingData = {
      seatIds,
      memberId: member?.memberId || null,
      pointsToUse: member ? activePointsToUse : 0,
      concessions: concessionLines.map((line) => ({
        itemType: line.itemType,
        itemId: line.itemId,
        size: line.size,
        quantity: line.quantity,
      })),
    };

    BookingService.employeeConfirmBooking(scheduleId, bookingData)
      .then((res) => {
        if (res.data.status === 200 && res.data.data) {
          keepHoldRef.current = true;
          navigate(`/employee/booking/success/${res.data.data.invoiceId}`, {
            state: { bookingDetail: res.data.data },
          });
        } else {
          alert(res.data.message || 'Booking failed. Please try again later.');
          setSubmitting(false);
        }
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) {
          alert('Forbidden (403): Please login as Manager/Admin or Employee to confirm booking ticket.');
          navigate('/login');
          return;
        }
        alert(err.response?.data?.message || 'Booking failed. Please try again later.');
        setSubmitting(false);
      });
  };

  if (loading || !movie || !schedule) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-lg font-bold text-[#E50914] animate-pulse">
          Đang tải thông tin vé...
        </div>
      </div>
    );
  }

  const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount);
  const formattedPayable = new Intl.NumberFormat('vi-VN').format(payableTotal);
  const formattedPointsDiscount = new Intl.NumberFormat('vi-VN').format(pointsDiscount);
  const showDate = showtimeState.date || schedule.startTime?.substring(0, 10);
  const showTime = showtimeState.time || schedule.startTime?.substring(11, 16);
  const movieName = movie.movieNameVn || movie.movieNameEnglish;

  const formatClock = (value) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  };

  const showtimeRange = (() => {
    const startRaw = schedule.startTime;
    if (!startRaw) return showTime || "—";

    const startAt = new Date(startRaw);
    if (Number.isNaN(startAt.getTime())) return showTime || "—";

    const durationMinutes = Number(movie.duration || 0);
    if (!durationMinutes) return formatClock(startAt);

    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
    return `${formatClock(startAt)} ~ ${formatClock(endAt)}`;
  })();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            const seatIds = selectedSeats.map((s) => s.seatId);
            BookingService.releaseSeats(scheduleId, seatIds)
              .catch(() => {})
              .finally(() => {
                keepHoldRef.current = true; // đã release thủ công, tránh release trùng ở cleanup
                navigate(-1);
              });
          }}
          className="p-2 rounded-full border border-gray-300 dark:border-white/15 bg-white dark:bg-[#10131A] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} className="text-gray-700 dark:text-white/70" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Thông tin chi tiết vé
          </h1>
          <p className="text-xs text-gray-500 dark:text-white/50 font-semibold mt-1">
            Xác nhận thông tin vé và áp dụng ưu đãi thành viên
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-6">
          {/* AC-01: Read-only ticket & showtime details */}
          <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#C00000] px-6 py-4 flex items-center gap-3 text-white">
              <Ticket size={22} />
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase opacity-80">
                  Employee Booking
                </p>
                <p className="text-sm font-black uppercase">Ticket & Showtime Details</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-5">
                <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm bg-gray-50 dark:bg-white/5 flex-shrink-0">
                  <img
                    src={getMovieImageUrl(movie)}
                    alt={movieName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase">{movieName}</h2>
                  <div className="space-y-1 text-xs font-bold text-gray-600 dark:text-white/70">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#C00000] dark:text-[#ff4d57]" />
                      Screen: {schedule.cinemaRoomName}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-[#C00000] dark:text-[#ff4d57]" />
                      Date: {showDate} · Time: {showTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <Film size={14} className="text-[#C00000] dark:text-[#ff4d57]" />
                      {schedule.movieFormat || '2D DIGITAL'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
                <span className="text-sm font-black text-gray-500 dark:text-white/50 uppercase tracking-wider">
                  Total
                </span>
                <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">{formattedTotal} VNĐ</span>
              </div>
            </div>
          </div>

          {/* Bắp nước tại quầy */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">{CL.stepTitle}</h2>

            <div className="flex gap-2">
              {CONCESSION_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setConcessionTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    concessionTab === tab.key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-100">
              {CONCESSION_TABS.filter((tab) => tab.key === concessionTab).map((tab) => (
                tab.items.length === 0 ? (
                  <p key={tab.key} className="text-xs text-gray-400 font-semibold text-center py-6">{CL.emptyList}</p>
                ) : (
                  tab.items.map((item) => (
                    <div key={item[tab.idKey]} className="py-3 flex items-center gap-4">
                      <span className="flex-1 text-sm font-black text-gray-800 truncate">{item[tab.nameKey]}</span>
                      <div className="flex flex-col gap-2">
                        {(item.prices || []).map((priceRow) => {
                          const unitPrice = parseFloat(priceRow.price) || 0;
                          const key = `${tab.type}-${item[tab.idKey]}-${priceRow.size}`;
                          const qty = concessionSelections[key]?.quantity || 0;
                          return (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <span className="text-[11px] font-bold text-gray-500 w-28">
                                {CONCESSION_SIZE_LABELS[priceRow.size] || priceRow.size} · {new Intl.NumberFormat('vi-VN').format(unitPrice)}{CL.currencyUnit}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateConcessionQty(tab.type, item[tab.idKey], priceRow.size, item[tab.nameKey], unitPrice, -1)}
                                  disabled={qty <= 0}
                                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 font-black disabled:opacity-30 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-sm font-black text-gray-800">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateConcessionQty(tab.type, item[tab.idKey], priceRow.size, item[tab.nameKey], unitPrice, 1)}
                                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 font-black hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              ))}
            </div>

            {concessionLines.length > 0 && (
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{CL.concessionsSubtotalLabel}</span>
                <span className="text-sm font-black text-[#C00000]">{new Intl.NumberFormat('vi-VN').format(concessionsSubtotal)} VNĐ</span>
              </div>
            )}
          </div>

          {/* AC-02 to AC-06: Member lookup & score conversion */}
          <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-[#C00000] dark:text-[#ff4d57]" />
              Ưu đãi thành viên
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                inputMode="tel"
                value={memberQuery}
                onChange={(e) => {
                  setMemberQuery(e.target.value);
                  setMemberChecked(false);
                  setMemberNotFound(false);
                }}
                placeholder="Số điện thoại"
                className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl text-gray-800 dark:text-white px-4 py-3 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-white/30 transition-all"
              />
              <button
                type="button"
                onClick={handleCheckMember}
                disabled={checkingMember || !memberQuery.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C00000] hover:bg-[#a00000] dark:bg-[#E50914] dark:hover:bg-[#ff1a25] disabled:bg-gray-300 dark:disabled:bg-white/15 disabled:text-gray-500 dark:disabled:text-white/35 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Search size={14} />
                Check
              </button>
            </div>

            {memberChecked && memberNotFound && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-300 text-center">
                Không tìm thấy thành viên!
              </div>
            )}

            {member && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-green-200 dark:border-green-500/25 bg-green-50/50 dark:bg-green-950/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase">Họ tên</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{member.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase">CMND/CCCD</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{member.identityCard}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase">Số điện thoại</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{member.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase">Điểm thành viên</p>
                  <p className="text-lg font-black text-[#C00000] dark:text-[#ff4d57]">{member.score ?? 0} điểm</p>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-white/45 mt-0.5">1 điểm = 1000 VNĐ</p>
                </div>
              </div>
            )}

            {member && (
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-gray-400 dark:text-white/40 uppercase">
                  Sử dụng điểm thành viên
                </label>
                <div className="flex gap-3 max-w-md">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pointsInput}
                    onChange={handlePointsInputChange}
                    placeholder="0"
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl text-gray-800 dark:text-white px-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-white/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleUseAllPoints}
                    disabled={maxPointsAllowed <= 0}
                    className="shrink-0 bg-[#1C1C1E] hover:bg-black dark:bg-white dark:hover:bg-white/90 dark:text-[#1C1C1E] disabled:bg-gray-300 dark:disabled:bg-white/15 disabled:text-gray-500 dark:disabled:text-white/35 text-white text-xs font-black px-5 py-3.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
                  >
                    All
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-white/50">
                  Tối đa {maxPointsAllowed} điểm · Giảm {formattedPointsDiscount} VNĐ
                </p>
                {activePointsToUse > 0 && (
                  <>
                    <p className="text-xs font-semibold text-[#C00000] dark:text-[#ff4d57]">
                      Còn lại {remainingPoints} điểm sau khi dùng {activePointsToUse} điểm
                    </p>
                    <p className="text-xs font-semibold text-gray-500 dark:text-white/50">
                      Còn phải trả: {formattedPayable} VNĐ
                    </p>
                  </>
                )}
              </div>
            )}

            {scoreInsufficient && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-300 text-center">
                Điểm thành viên không đủ hoặc vượt quá số tiền đơn hàng
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-xs font-black text-gray-400 dark:text-white/45 tracking-wider uppercase border-b border-gray-100 dark:border-white/10 pb-2">
            Thông tin đơn đặt vé
          </h2>

          <div className="space-y-3 text-xs font-bold text-gray-600 dark:text-white/60">
            <div className="flex justify-between">
              <span>Phim</span>
              <span className="text-gray-900 dark:text-white text-right max-w-[60%] truncate">{movieName}</span>
            </div>
            <div className="flex justify-between">
              <span>Rạp</span>
              <span className="text-gray-900 dark:text-white">{schedule.cinemaRoomName}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày</span>
              <span className="text-gray-900 dark:text-white">{showDate}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Thời gian chiếu dự kiến</span>
              <span className="text-gray-900 dark:text-white text-right whitespace-nowrap">{showtimeRange}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Ghế</span>
                <span className="text-[#C00000] dark:text-[#ff4d57] font-black text-sm">{selectedSeats.length}</span>
              </div>
              {sortedSeats.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sortedSeats.map((seat) => (
                    <span
                      key={seat.seatId}
                      className="inline-flex items-center justify-center px-2.5 py-1 bg-[#C00000] dark:bg-[#E50914] text-white text-sm font-black rounded-lg shadow-sm"
                    >
                      {getSeatLabel(seat, getRowLetter)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {member && activePointsToUse > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Giảm bằng điểm</span>
                <span>-{formattedPointsDiscount} VNĐ ({activePointsToUse} điểm)</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 dark:text-white/45 tracking-wider uppercase">
              Số tiền cần thanh toán
            </span>
            <span className="text-xl font-black text-[#C00000] dark:text-[#ff4d57]">{formattedPayable} VNĐ</span>
          </div>

          <button
            type="button"
            disabled={submitting || scoreInsufficient}
            onClick={handleConfirmBooking}
            className={`w-full py-4 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded-xl transition-all ${
              !submitting && !scoreInsufficient
                ? 'bg-[#C00000] hover:bg-[#a00000] dark:bg-[#E50914] dark:hover:bg-[#ff1a25] text-white shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer'
                : 'bg-gray-300 dark:bg-white/15 text-gray-500 dark:text-white/35 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Processing...' : 'Xác nhận đơn đặt vé'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTicketInformationPage;
