import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, CupSoda, Film, MapPin, Minus, Package, Plus, Popcorn, Search, ShoppingBag, Tag, Ticket, User } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import BookingService from '../../services/BookingService';
import CustomerService from '../../services/CustomerService';
import ConcessionService from '../../services/ConcessionService';
import PromotionService from '../../services/PromotionService';
import { getMovieImageUrl } from '../../utils/movieImageUtils';
import { compareSeatsByPosition, getSeatLabel } from '../../utils/seatUtils';
import { BOOKING_CONCESSION_LABELS as CL } from '../../constants/labels';

const POINT_VALUE = 1000;
const MAX_CONCESSION_ITEM_QUANTITY = 10;
const MAX_CONCESSION_TOTAL_QUANTITY = 20;
const CONCESSION_SIZE_LABELS = { NONE: CL.sizeNone, S: CL.sizeS, M: CL.sizeM, L: CL.sizeL };

const getPromoApiError = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

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

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);

  const [concessionTab, setConcessionTab] = useState('combo');
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
    { key: 'combo', type: 'COMBO', label: CL.tabCombo, items: combos, idKey: 'comboId', nameKey: 'comboName' },
    { key: 'food', type: 'FOOD', label: CL.tabFood, items: foods, idKey: 'foodId', nameKey: 'foodName' },
    { key: 'drink', type: 'DRINK', label: CL.tabDrink, items: drinks, idKey: 'drinkId', nameKey: 'drinkName' },
  ];

  const updateConcessionQty = (itemType, itemId, size, name, unitPrice, delta) => {
    const key = `${itemType}-${itemId}-${size}`;
    setConcessionSelections((prev) => {
      const currentQty = prev[key]?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);

      if (delta > 0) {
        if (nextQty > MAX_CONCESSION_ITEM_QUANTITY) {
          alert(`Mỗi món chỉ được chọn tối đa ${MAX_CONCESSION_ITEM_QUANTITY} phần.`);
          return prev;
        }
        const totalOfOthers = Object.entries(prev).reduce(
          (sum, [k, v]) => sum + (k === key ? 0 : v.quantity),
          0
        );
        if (totalOfOthers + nextQty > MAX_CONCESSION_TOTAL_QUANTITY) {
          alert(`Tổng số lượng bắp nước & combo không được vượt quá ${MAX_CONCESSION_TOTAL_QUANTITY} phần.`);
          return prev;
        }
      }

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

    // Quay lại chọn ghế / reload: giữ DRAFT (giống khách hàng).
    // Chỉ bỏ giữ khi đã xác nhận đơn thành công (keepHoldRef = true và ghế đã BOOKED).
    const onLeave = () => {
      if (keepHoldRef.current) return;
      BookingService.confirmBooking(scheduleId, seatIds).catch(() => {});
    };
    const onPageHide = () => onLeave();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      onLeave();
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

  const getSeatTypeLabel = (seat) =>
    seat.seatType === 2 ? 'Đôi' : seat.seatType === 1 ? 'VIP' : 'Thường';

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

  // Gom giá theo loại ghế (Thường / VIP / Đôi) để hiện dòng "Giá vé ..." trong tóm tắt đơn.
  const seatTypePriceGroups = useMemo(() => {
    const typeOrder = [0, 1, 2];
    const groups = new Map();

    seatPrices.forEach(({ seat, price }) => {
      const seatType = seat.seatType ?? 0;
      if (!groups.has(seatType)) {
        groups.set(seatType, {
          seatType,
          label: getSeatTypeLabel(seat),
          count: 0,
          total: 0,
        });
      }
      const group = groups.get(seatType);
      group.count += 1;
      group.total += price;
    });

    return typeOrder
      .filter((type) => groups.has(type))
      .map((type) => {
        const group = groups.get(type);
        return {
          ...group,
          unitPrice: group.count > 0 ? group.total / group.count : 0,
        };
      });
  }, [seatPrices]);

  const maxPointsAllowed = useMemo(() => {
    if (!member) return 0;
    const byTotal = Math.floor(totalAmount / POINT_VALUE);
    const byPercent = Math.floor((totalAmount * 0.2) / POINT_VALUE);
    return Math.min(member.score || 0, byTotal, byPercent);
  }, [member, totalAmount]);

  const activePointsToUse = Math.min(pointsToUse, maxPointsAllowed);
  const pointsDiscount = activePointsToUse * POINT_VALUE;

  const promoDiscountBase = totalAmount + concessionsSubtotal;
  const promoDiscount = appliedPromotion
    ? appliedPromotion.discountType === 'PERCENT'
      ? promoDiscountBase * (parseFloat(appliedPromotion.promotionValue) / 100)
      : Math.min(promoDiscountBase, parseFloat(appliedPromotion.promotionValue))
    : 0;

  const payableTotal = Math.max(
    0,
    Math.max(0, totalAmount - pointsDiscount) + concessionsSubtotal - promoDiscount
  );
  const remainingPoints = member ? Math.max(0, (member.score || 0) - activePointsToUse) : 0;

  const scoreInsufficient =
    member &&
    (pointsToUse > (member.score || 0) ||
      pointsToUse * POINT_VALUE > totalAmount ||
      pointsToUse > maxPointsAllowed);

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi!');
      return;
    }

    setCheckingPromo(true);
    setPromoError('');
    PromotionService.validateByCode(code, scheduleId, member?.memberId)
      .then((res) => {
        if (res.data.status === 200 && res.data.data) {
          setAppliedPromotion(res.data.data);
          setPromoError('');
        } else {
          setAppliedPromotion(null);
          setPromoError(res.data.message || 'Mã khuyến mãi không hợp lệ.');
        }
      })
      .catch((err) => {
        setAppliedPromotion(null);
        setPromoError(getPromoApiError(err, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'));
      })
      .finally(() => setCheckingPromo(false));
  };

  const handleRemovePromo = () => {
    setAppliedPromotion(null);
    setPromoCodeInput('');
    setPromoError('');
  };

  const handleCheckMember = () => {
    const query = memberQuery.trim().replace(/\s+/g, '');
    if (!query) return;

    setCheckingMember(true);
    setMember(null);
    setMemberNotFound(false);
    setMemberChecked(false);
    setPointsToUse(0);
    setPointsInput('');
    setAppliedPromotion(null);
    setPromoError('');

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
      promotionId: appliedPromotion ? appliedPromotion.promotionId : null,
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
          const msg = res.data.message || 'Đặt vé thất bại. Vui lòng thử lại sau.';
          setPromoError(msg);
          alert(msg);
          setSubmitting(false);
        }
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) {
          alert('Không có quyền (403): Vui lòng đăng nhập tài khoản Quản lý/Admin hoặc Nhân viên để xác nhận đặt vé.');
          navigate('/login');
          return;
        }
        const msg = getPromoApiError(err, 'Đặt vé thất bại. Vui lòng thử lại sau.');
        setPromoError(msg);
        alert(msg);
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
            // Giữ ghế đã chọn khi quay lại màn hình chọn ghế
            keepHoldRef.current = true;
            navigate(-1);
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
                  Đặt vé nhân viên
                </p>
                <p className="text-sm font-black uppercase">Chi tiết vé &amp; suất chiếu</p>
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
                      Phòng: {schedule.cinemaRoomName}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-[#C00000] dark:text-[#ff4d57]" />
                      Ngày: {showDate} · Giờ: {showTime}
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
                  Tổng tiền
                </span>
                <span className="text-2xl font-black text-[#C00000] dark:text-[#ff4d57]">{formattedTotal} VNĐ</span>
              </div>
            </div>
          </div>

          {/* Bắp nước tại quầy — layout giống khách hàng */}
          <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#C00000] dark:text-[#ff4d57]" />
                Bắp nước &amp; Combo
              </h2>
              {concessionLines.length > 0 && (
                <span className="text-xs font-bold text-[#C00000] dark:text-[#ff4d57] bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/50">
                  Đã chọn {concessionLines.reduce((sum, line) => sum + line.quantity, 0)} món ({new Intl.NumberFormat('vi-VN').format(concessionsSubtotal)} VNĐ)
                </span>
              )}
            </div>

            <div className="flex border-b border-gray-200 dark:border-white/10 gap-2 overflow-x-auto">
              {CONCESSION_TABS.map((tab) => {
                const Icon = tab.key === 'combo' ? Package : tab.key === 'food' ? Popcorn : CupSoda;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setConcessionTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      concessionTab === tab.key
                        ? 'border-[#C00000] dark:border-[#E50914] text-[#C00000] dark:text-[#ff4d57]'
                        : 'border-transparent text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70'
                    }`}
                  >
                    <Icon size={14} /> {tab.label} ({tab.items.length})
                  </button>
                );
              })}
            </div>

            {CONCESSION_TABS.filter((tab) => tab.key === concessionTab).map((tab) => (
              tab.items.length === 0 ? (
                <div
                  key={tab.key}
                  className="text-center py-6 text-xs text-gray-400 dark:text-white/40 font-bold uppercase tracking-wider bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10"
                >
                  {CL.emptyList}
                </div>
              ) : (
                <div key={tab.key} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {tab.items.map((item) => {
                    const id = item[tab.idKey];
                    const name = item[tab.nameKey];
                    const prices = item.prices || [{ size: 'NONE', price: 0 }];

                    return (
                      <div
                        key={`${tab.key}_${id}`}
                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-300"
                      >
                        <div className="flex items-start gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={name}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-white/10"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-[#ff4d57] flex items-center justify-center shrink-0">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{name}</h4>
                            <p className="text-[10px] text-gray-400 dark:text-white/45 font-medium line-clamp-2 mt-0.5">
                              {item.description || 'Thơm ngon, chuẩn vị rạp chiếu phim'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-gray-200/80 dark:border-white/10">
                          {prices.map((priceRow) => {
                            const unitPrice = parseFloat(priceRow.price) || 0;
                            const key = `${tab.type}-${id}-${priceRow.size}`;
                            const qty = concessionSelections[key]?.quantity || 0;
                            const sizeLabel =
                              priceRow.size === 'NONE'
                                ? 'Mặc định'
                                : `Cỡ ${priceRow.size}`;

                            return (
                              <div
                                key={priceRow.concessionPriceId || priceRow.size}
                                className="flex items-center justify-between text-xs bg-white dark:bg-[#10131A] px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10"
                              >
                                <div>
                                  <span className="font-bold text-gray-700 dark:text-white/70">{sizeLabel}: </span>
                                  <span className="font-black text-[#C00000] dark:text-[#ff4d57] ml-1">
                                    {new Intl.NumberFormat('vi-VN').format(unitPrice)} VNĐ
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {qty > 0 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateConcessionQty(tab.type, id, priceRow.size, name, unitPrice, -1)
                                        }
                                        className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white/80 font-bold flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <span className="font-black text-gray-900 dark:text-white w-4 text-center">{qty}</span>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateConcessionQty(tab.type, id, priceRow.size, name, unitPrice, 1)
                                    }
                                    className="w-6 h-6 rounded-lg bg-[#C00000] dark:bg-[#E50914] hover:bg-[#a00000] dark:hover:bg-[#ff1a25] text-white font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ))}
          </div>

          {/* Mã giảm giá */}
          <div className="bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Tag size={16} className="text-[#C00000] dark:text-[#ff4d57]" />
              Mã giảm giá
            </h2>

            {appliedPromotion ? (
              <div className="p-4 bg-green-50/50 dark:bg-green-950/30 border border-green-200 dark:border-green-500/25 rounded-xl flex items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-bold text-gray-900 dark:text-white">{appliedPromotion.title}</p>
                  <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-0.5">
                    {appliedPromotion.discountType === 'PERCENT'
                      ? `Giảm ${appliedPromotion.promotionValue}%`
                      : `Giảm ${new Intl.NumberFormat('vi-VN').format(appliedPromotion.promotionValue)} VNĐ`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="shrink-0 text-xs font-bold text-gray-500 dark:text-white/50 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  Bỏ mã
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value);
                    setPromoError('');
                  }}
                  placeholder="Nhập mã khuyến mãi"
                  className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold rounded-xl text-gray-800 dark:text-white px-4 py-3 focus:outline-none focus:bg-white dark:focus:bg-[#10131A] focus:border-gray-400 dark:focus:border-white/30 transition-all uppercase placeholder:normal-case"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={checkingPromo || !promoCodeInput.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C00000] hover:bg-[#a00000] dark:bg-[#E50914] dark:hover:bg-[#ff1a25] disabled:bg-gray-300 dark:disabled:bg-white/15 disabled:text-gray-500 dark:disabled:text-white/35 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {checkingPromo ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>
            )}

            {promoError && (
              <div className="p-3 px-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
                {promoError}
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
                Tra cứu
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
                    Tất cả
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-white/50">
                  Tối đa 20% tổng tiền vé, tương đương tối đa {maxPointsAllowed} điểm · Giảm {formattedPointsDiscount} VNĐ
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
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-[#C00000] dark:bg-[#E50914] text-white text-sm font-black rounded-lg shadow-sm"
                    >
                      {getSeatLabel(seat, getRowLetter)}
                      <span className="text-[10px] font-bold opacity-80">({getSeatTypeLabel(seat)})</span>
                    </span>
                  ))}
                </div>
              )}
              {seatTypePriceGroups.length > 0 && (
                <div className="space-y-1.5 pt-1 text-[11px] text-gray-500 dark:text-white/50 font-semibold">
                  {seatTypePriceGroups.map((group) => (
                    <div
                      key={group.seatType}
                      className="flex justify-between items-start gap-2"
                    >
                      <span className="min-w-0">
                        Giá vé {group.label.toLowerCase()}
                        {group.count > 1 ? ` × ${group.count}` : ''}
                        <span className="block text-[10px] font-medium text-gray-400 dark:text-white/40">
                          {new Intl.NumberFormat('vi-VN').format(group.unitPrice)} VNĐ/vé
                        </span>
                      </span>
                      <span className="shrink-0 text-gray-800 dark:text-white/80 font-bold">
                        {new Intl.NumberFormat('vi-VN').format(group.total)} VNĐ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {concessionLines.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <span>Bắp &amp; nước</span>
                  <span className="text-[#C00000] dark:text-[#ff4d57] font-black text-sm">
                    {new Intl.NumberFormat('vi-VN').format(concessionsSubtotal)} VNĐ
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-white/50 font-semibold">
                  {concessionLines.map((line) => {
                    const sizeLabel =
                      line.size && line.size !== 'NONE'
                        ? CONCESSION_SIZE_LABELS[line.size] || line.size
                        : null;
                    return (
                      <div
                        key={`${line.itemType}-${line.itemId}-${line.size}`}
                        className="flex justify-between items-start gap-2"
                      >
                        <span className="min-w-0">
                          {line.name}
                          {sizeLabel ? ` (${sizeLabel})` : ''}
                          {' '}x{line.quantity}
                        </span>
                        <span className="shrink-0 text-gray-800 dark:text-white/80">
                          {new Intl.NumberFormat('vi-VN').format(line.unitPrice * line.quantity)} VNĐ
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {appliedPromotion && promoDiscount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Giảm giá theo mã</span>
                <span>-{new Intl.NumberFormat('vi-VN').format(promoDiscount)} VNĐ</span>
              </div>
            )}
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
            {submitting ? 'Đang xử lý...' : 'Xác nhận đơn đặt vé'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTicketInformationPage;
