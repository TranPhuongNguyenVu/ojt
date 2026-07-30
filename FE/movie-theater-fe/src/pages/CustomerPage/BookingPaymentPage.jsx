import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Star, Clock, Film, Gift, Coins, Tag, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import BookingService from '../../services/BookingService';
import AuthService from '../../services/AuthService';
import ConcessionService from '../../services/ConcessionService';
import posterImg from "../../assets/imgs/Vidu_Film.jpeg";
import BookingStepper from '../../components/BookingStepper';
import { saveMomoSeatHold, getMomoSeatHold, clearMomoSeatHold, formatHoldCountdown, MOMO_HOLD_MS } from '../../utils/momoSeatHold';

const BookingPaymentPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận danh sách ghế từ màn hình trước chuyển qua
  const selectedSeats = location.state?.selectedSeats || [];
  const keepHoldRef = useRef(false);
  const holdExpiredRef = useRef(false);

  // Lấy dữ liệu tài khoản thành viên
  const userLoginStr = localStorage.getItem("USER_LOGIN");
  const user = userLoginStr ? JSON.parse(userLoginStr) : {};

  const [movie, setMovie] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [memberScore, setMemberScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [holdRemainingMs, setHoldRemainingMs] = useState(MOMO_HOLD_MS);

  // States chọn bắp nước & combo
  const [concessionTab, setConcessionTab] = useState('combos'); // 'combos' | 'foods' | 'drinks'
  const [concessionsData, setConcessionsData] = useState({ foods: [], drinks: [], combos: [] });
  const [selectedConcessions, setSelectedConcessions] = useState({});

  // States chọn voucher & điểm
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [pointsInput, setPointsInput] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [txnCode, setTxnCode] = useState('');

  // Sinh mã giao dịch ngẫu nhiên
  useEffect(() => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setTxnCode(`CLX-${randomNum}`);
  }, []);

  // Giữ ghế + bắt đầu / tiếp tục bộ đếm 3 phút khi vào trang thanh toán
  useEffect(() => {
    const seatIds = selectedSeats.map((s) => s.seatId);
    if (!scheduleId || seatIds.length === 0) return undefined;

    BookingService.confirmBooking(scheduleId, seatIds).catch(() => {});

    const existing = getMomoSeatHold(scheduleId);
    if (!existing) {
      saveMomoSeatHold(scheduleId, seatIds);
    }

    const syncRemaining = () => {
      const hold = getMomoSeatHold(scheduleId);
      if (!hold) {
        setHoldRemainingMs(0);
        return 0;
      }
      const remaining = Math.max(0, hold.expiresAt - Date.now());
      setHoldRemainingMs(remaining);
      return remaining;
    };

    syncRemaining();
    const timer = setInterval(() => {
      const remaining = syncRemaining();
      if (remaining <= 0) {
        clearInterval(timer);
        holdExpiredRef.current = true;
        clearMomoSeatHold(scheduleId);
        BookingService.releaseSeats(scheduleId, seatIds).catch(() => {});
        alert('Hết thời gian giữ ghế. Vui lòng chọn lại ghế.');
        navigate(-1);
      }
    }, 1000);

    const onLeave = () => {
      if (keepHoldRef.current || holdExpiredRef.current) return;
      // Back ra khỏi trang thanh toán → reset bộ đếm 3 phút
      BookingService.confirmBooking(scheduleId, seatIds).catch(() => {});
      saveMomoSeatHold(scheduleId, seatIds);
    };

    const onPageHide = () => onLeave();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', onPageHide);
      onLeave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, selectedSeats.map((s) => s.seatId).join(',')]);

  // Tải thông tin phim, suất chiếu, điểm & danh sách bắp nước/combo
  useEffect(() => {
    if (selectedSeats.length === 0 || !scheduleId) {
      alert("Chưa có thông tin đặt vé. Vui lòng quay lại chọn ghế.");
      navigate(-1);
      return;
    }

    setLoading(true);
    ScheduleService.getScheduleById(scheduleId)
      .then((res) => {
        const sched = res.data.data;
        setSchedule(sched);

        return Promise.all([
          MovieService.getMovieById(sched.movieId),
          BookingService.getMemberScore(),
          ConcessionService.getAllFoods().catch(() => ({ data: { data: [] } })),
          ConcessionService.getAllDrinks().catch(() => ({ data: { data: [] } })),
          ConcessionService.getAllCombos().catch(() => ({ data: { data: [] } }))
        ]);
      })
      .then(([movieRes, scoreRes, foodsRes, drinksRes, combosRes]) => {
        setMovie(movieRes.data.data);
        setMemberScore(scoreRes.data.data || 0);

        const foods = foodsRes.data?.data || [];
        const drinks = drinksRes.data?.data || [];
        const combos = combosRes.data?.data || [];

        setConcessionsData({ foods, drinks, combos });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu thanh toán:", err);
        setLoading(false);
      });
  }, [scheduleId, selectedSeats, navigate]);

  const getSeatPrice = (seat) => (seat.price != null ? parseFloat(seat.price) : 0);

  // Thêm / bớt số lượng bắp nước combo
  const handleQuantityChange = (item, type, sizeObj, delta) => {
    const size = sizeObj?.size || 'NONE';
    const price = sizeObj?.price || 0;
    const key = `${type}_${item.foodId || item.drinkId || item.comboId}_${size}`;

    setSelectedConcessions((prev) => {
      const current = prev[key] || {
        key,
        id: item.foodId || item.drinkId || item.comboId,
        type,
        name: item.foodName || item.drinkName || item.comboName,
        size,
        price,
        quantity: 0,
        image: item.image
      };

      const newQty = Math.max(0, current.quantity + delta);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: { ...current, quantity: newQty }
      };
    });
  };

  // Áp dụng mã giảm giá
  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) {
      alert("Vui lòng nhập mã khuyến mãi!");
      return;
    }

    AuthService.get(`promotions/validate?code=${promoCodeInput.trim()}`)
      .then((res) => {
        if (res.data.status === 200) {
          setAppliedPromotion(res.data.data);
          alert("Áp dụng mã giảm giá thành công!");
        } else {
          alert(res.data.message || "Mã giảm giá không hợp lệ.");
          setAppliedPromotion(null);
        }
      })
      .catch((err) => {
        console.error("Lỗi áp dụng voucher:", err);
        alert(err.response?.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
        setAppliedPromotion(null);
      });
  };

  // Xác nhận thanh toán qua MoMo
  const handleConfirmPayment = () => {
    if (!txnCode || selectedSeats.length === 0) {
      alert("Dữ liệu đặt vé không hợp lệ. Vui lòng quay lại chọn ghế.");
      return;
    }

    const concessionList = Object.values(selectedConcessions);
    const seatIds = selectedSeats.map(s => s.seatId);
    const paymentData = {
      scheduleId: parseInt(scheduleId),
      seatIds,
      promotionId: appliedPromotion ? appliedPromotion.promotionId : null,
      useScore: activePointsToUse,
      totalMoney: finalTotal,
      paymentMethod: 'MOMO'
    };

    const saveConcessionOrder = (invId) => {
      if (invId) {
        sessionStorage.setItem(`concession_order_${invId}`, JSON.stringify(concessionList));
      }
    };

    keepHoldRef.current = true;
    BookingService.createMomoPayment(paymentData)
      .then((res) => {
        if (res.data && res.data.payUrl) {
          saveConcessionOrder(res.data.invoiceId);
          saveMomoSeatHold(scheduleId, seatIds);
          window.location.href = res.data.payUrl;
        } else {
          keepHoldRef.current = false;
          alert("Không khởi tạo được link thanh toán MoMo. Vui lòng thử lại sau.");
        }
      })
      .catch((err) => {
        keepHoldRef.current = false;
        console.error("Lỗi tạo link thanh toán MoMo:", err);
        alert(err.response?.data?.error || "Booking failed. Please try again later.");
      });
  };

  if (loading) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-[#E50914] animate-pulse">
          Đang tải thông tin thanh toán...
        </div>
      </div>
    );
  }

  // Quy đổi hàng số sang chữ cái A-J
  const getRowLetter = (rowNum) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return letters[rowNum - 1] || `${rowNum}`;
  };

  // Tính tiền vé ban đầu
  const ticketPriceSum = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);

  // Tính tiền bắp nước & combo chọn thêm
  const concessionSum = Object.values(selectedConcessions).reduce(
    (sum, c) => sum + (c.price * c.quantity),
    0
  );

  // Tạm tính trước giảm giá
  const subTotal = ticketPriceSum + concessionSum;

  // Tính tiền giảm từ Voucher khuyến mại
  let voucherDiscount = 0;
  if (appliedPromotion) {
    if (appliedPromotion.discountType === 'PERCENT') {
      voucherDiscount = subTotal * (parseFloat(appliedPromotion.promotionValue) / 100);
    } else {
      voucherDiscount = Math.min(subTotal, parseFloat(appliedPromotion.promotionValue));
    }
  }

  // Tạm tính sau khi áp Voucher
  const amountAfterVoucher = Math.max(0, subTotal - voucherDiscount);

  // Tối đa 20% tiền vé sử dụng bằng điểm tích lũy
  const maxAllowedByPercent = Math.floor((ticketPriceSum * 0.20) / 1000);
  const maxAllowed = Math.min(memberScore, Math.floor(amountAfterVoucher / 1000), maxAllowedByPercent);
  const activePointsToUse = Math.min(pointsToUse, maxAllowed);
  const pointsDiscount = activePointsToUse * 1000;

  // Tổng giảm giá & tổng tiền thực trả
  const totalDiscount = voucherDiscount + pointsDiscount;
  const finalTotal = Math.max(0, subTotal - totalDiscount);

  const formattedTicketPrice = new Intl.NumberFormat('vi-VN').format(ticketPriceSum);
  const formattedConcessionPrice = new Intl.NumberFormat('vi-VN').format(concessionSum);
  const formattedPointsDiscount = new Intl.NumberFormat('vi-VN').format(pointsDiscount);
  const formattedFinalTotal = new Intl.NumberFormat('vi-VN').format(finalTotal);

  const handlePointsInputChange = (e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    setPointsInput(val);
    const numPoints = val === '' ? 0 : parseInt(val, 10);
    if (numPoints > maxAllowed) {
      setPointsToUse(maxAllowed);
      setPointsInput(String(maxAllowed));
    } else {
      setPointsToUse(numPoints);
    }
  };

  const seatsLabel = [...selectedSeats]
    .sort((a, b) => (a.seatRow !== b.seatRow ? a.seatRow - b.seatRow : parseInt(a.seatColumn) - parseInt(b.seatColumn)))
    .map((s) => `${getRowLetter(s.seatRow)}${s.seatColumn}`)
    .join(', ');

  const showtimeDateStr = schedule.startTime ? schedule.startTime.substring(0, 10).split('-').reverse().join('/') : '';
  const showtimeTimeStr = schedule.startTime ? schedule.startTime.substring(11, 16) : '';

  // Render danh sách món bắp nước combo theo Tab
  const renderConcessionItems = () => {
    const items = concessionTab === 'combos'
      ? concessionsData.combos
      : concessionTab === 'foods'
      ? concessionsData.foods
      : concessionsData.drinks;

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          Chưa có sản phẩm trong danh mục này.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const id = item.foodId || item.drinkId || item.comboId;
          const name = item.foodName || item.drinkName || item.comboName;
          const prices = item.prices || [{ size: 'NONE', price: 0 }];

          return (
            <div key={`${concessionTab}_${id}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-300">
              <div className="flex items-start gap-3">
                {item.image ? (
                  <img src={item.image} alt={name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-gray-700" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50914] flex items-center justify-center shrink-0">
                    <ShoppingBag size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{name}</h4>
                  <p className="text-[10px] text-gray-400 font-medium line-clamp-2 mt-0.5">{item.description || 'Thơm ngon, chuẩn vị rạp chiếu phim'}</p>
                </div>
              </div>

              {/* Lựa chọn Size & Giá tiền */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {prices.map((p) => {
                  const sizeLabel = p.size === 'NONE' ? 'Mặc định' : `Size ${p.size}`;
                  const key = `${concessionTab.slice(0, -1).toUpperCase()}_${id}_${p.size}`;
                  const selectedObj = selectedConcessions[key];
                  const qty = selectedObj ? selectedObj.quantity : 0;

                  return (
                    <div key={p.concessionPriceId || p.size} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl">
                      <div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{sizeLabel}: </span>
                        <span className="font-black text-[#E50914] ml-1">
                          {new Intl.NumberFormat('vi-VN').format(p.price)} VNĐ
                        </span>
                      </div>
                      
                      {/* Stepper Tăng / Giảm */}
                      <div className="flex items-center space-x-2">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, concessionTab.slice(0, -1).toUpperCase(), p, -1)}
                              className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-black text-gray-900 dark:text-white w-4 text-center">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item, concessionTab.slice(0, -1).toUpperCase(), p, 1)}
                          className="w-6 h-6 rounded-lg bg-[#E50914] hover:bg-red-700 text-white font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
    );
  };

  return (
    <div className="cine-booking-canvas bg-[#F8F9FA] dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      <BookingStepper currentStep={3} />
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8">
        
        {/* Lưới bố cục chính */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* ================= KHỐI BÊN TRÁI: DỊCH VỤ & PHƯƠNG THỨC ================= */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header thông tin chi tiết */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-250/50 dark:border-gray-800 pb-5 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#E50914] tracking-widest uppercase border-l-2 border-[#E50914] pl-2 block">
                  THANH TOÁN CHI TIẾT
                </span>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                  {movie ? (movie.movieNameVn || movie.movieNameEnglish) : 'Phim'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
                  <span>📍 {schedule.cinemaRoomName}</span>
                  <span>•</span>
                  <span>📅 {showtimeTimeStr} | {showtimeDateStr}</span>
                  <span>•</span>
                  <span className="text-gray-900 dark:text-gray-100 font-extrabold uppercase">
                    Ghế: {seatsLabel}
                  </span>
                </div>
              </div>

              {/* Mã giao dịch */}
              <div className="text-left sm:text-right flex-shrink-0">
                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">
                  MÃ ĐẶT VÉ / BOOKING ID
                </span>
                <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {txnCode}
                </span>
              </div>
            </div>

            {/* ================= BẮP NƯỚC & COMBO ================= */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#E50914]" />
                  Bắp nước & Combo
                </h2>
                {Object.keys(selectedConcessions).length > 0 && (
                  <span className="text-xs font-bold text-[#E50914] bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/50">
                    Đã chọn {Object.values(selectedConcessions).reduce((sum, c) => sum + c.quantity, 0)} món ({formattedConcessionPrice} VNĐ)
                  </span>
                )}
              </div>

              {/* Bộ chuyển Tab dải danh mục */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2">
                <button
                  type="button"
                  onClick={() => setConcessionTab('combos')}
                  className={`py-2 px-4 text-xs font-black uppercase border-b-2 transition-all cursor-pointer ${
                    concessionTab === 'combos'
                      ? 'border-[#E50914] text-[#E50914]'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  🍿 Gói Combo ({concessionsData.combos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConcessionTab('foods')}
                  className={`py-2 px-4 text-xs font-black uppercase border-b-2 transition-all cursor-pointer ${
                    concessionTab === 'foods'
                      ? 'border-[#E50914] text-[#E50914]'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  🌽 Bắp Rang ({concessionsData.foods.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConcessionTab('drinks')}
                  className={`py-2 px-4 text-xs font-black uppercase border-b-2 transition-all cursor-pointer ${
                    concessionTab === 'drinks'
                      ? 'border-[#E50914] text-[#E50914]'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  🥤 Nước Ngọt ({concessionsData.drinks.length})
                </button>
              </div>

              {/* Danh sách thẻ chọn Món */}
              {renderConcessionItems()}
            </div>

            {/* ================= THANH TOÁN BẰNG ĐIỂM ================= */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Điểm tích lũy thành viên
              </h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="flex items-center space-x-3.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="p-3.5 rounded-xl bg-yellow-500/10 text-yellow-600">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase">Sử dụng Điểm tích lũy</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                      Điểm hiện có: {memberScore} điểm (~{new Intl.NumberFormat('vi-VN').format(memberScore * 1000)} VNĐ)
                    </p>
                  </div>
                </div>
                
                {memberScore > 0 ? (
                  <div className="space-y-3 text-left">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Nhập số điểm muốn sử dụng (Tối đa 20% tổng tiền vé, tương đương tối đa {maxAllowed} điểm):</span>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        placeholder={`Nhập điểm (VD: ${maxAllowed})`}
                        value={pointsInput}
                        onChange={handlePointsInputChange}
                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder-gray-300 dark:placeholder-gray-500 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPointsToUse(maxAllowed);
                          setPointsInput(String(maxAllowed));
                        }}
                        className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                      >
                        Dùng tối đa
                      </button>
                    </div>
                    {activePointsToUse > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold">
                        Áp dụng giảm giá: -{new Intl.NumberFormat('vi-VN').format(activePointsToUse * 1000)} VNĐ
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-wider">
                    Bạn chưa có điểm tích lũy nào để sử dụng.
                  </div>
                )}
              </div>
            </div>

            {/* ================= MÃ GIẢM GIÁ ================= */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Mã giảm giá
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Nhập mã khuyến mãi (Ví dụ: KM10, GIAM50K)"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors uppercase placeholder:normal-case placeholder:text-gray-400 dark:placeholder-gray-500"
                  />
                  <Tag size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={handleApplyPromo}
                  className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all transform active:scale-95 cursor-pointer"
                >
                  ÁP DỤNG
                </button>
              </div>
              {appliedPromotion && (
                <div className="p-3 px-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <Gift size={14} />
                  <span>
                    Đang áp dụng: <strong>{appliedPromotion.title}</strong> - {appliedPromotion.content} ({appliedPromotion.discountType === 'PERCENT' ? `${appliedPromotion.promotionValue}%` : `${new Intl.NumberFormat('vi-VN').format(appliedPromotion.promotionValue)} VNĐ`})
                  </span>
                </div>
              )}
            </div>

            {/* ================= PHƯƠNG THỨC THANH TOÁN ================= */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Phương thức thanh toán
                </h2>
                {holdRemainingMs > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5">
                    <Clock size={14} className="text-amber-700" />
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      Giữ ghế còn
                    </span>
                    <span className="text-sm font-black tabular-nums text-[#E50914]">
                      {formatHoldCountdown(holdRemainingMs)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 rounded-2xl flex items-center justify-between border-2 border-[#E50914] ring-2 ring-[#E50914]/10 bg-white dark:bg-gray-900">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-extrabold flex items-center justify-center text-xs">
                    MoMo
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black text-gray-850 dark:text-gray-100 uppercase leading-none">
                      Ví MoMo
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      Thanh toán qua ví điện tử
                    </p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border border-[#E50914] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#E50914]"></div>
                </div>
              </div>
            </div>

          </div>

          {/* ================= KHỐI BÊN PHẢI: CHI TIẾT ĐƠN HÀNG ================= */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6 transition-colors duration-300">
            <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
              Chi tiết đơn hàng
            </h2>

            {/* Danh sách các dòng tiền */}
            <div className="space-y-4 text-xs font-bold text-gray-600 dark:text-gray-300 dark:text-gray-300">
              
              {/* Vé xem phim */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Vé xem phim ({selectedSeats.length})</span>
                  <span className="text-gray-900 dark:text-white font-extrabold">{formattedTicketPrice} VNĐ</span>
                </div>
                {/* Chi tiết từng vé */}
                <div className="pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                  {selectedSeats.map(seat => {
                    const label = `${getRowLetter(seat.seatRow)}${seat.seatColumn}`;
                    const isVIP = seat.seatType === 1;
                    const price = getSeatPrice(seat);
                    const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);
                    return (
                      <div key={seat.seatId} className="flex justify-between items-center">
                        <span>Ghế {label} ({isVIP ? 'VIP' : 'Thường'})</span>
                        <span>{formattedPrice} VNĐ</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bắp & Nước chọn thêm */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span>Bắp & Nước Combo</span>
                  <span className="text-gray-900 dark:text-white font-extrabold">{formattedConcessionPrice} VNĐ</span>
                </div>

                {Object.values(selectedConcessions).length > 0 && (
                  <div className="pl-3 border-l-2 border-red-200 space-y-1.5 text-[11px] text-gray-500 font-semibold">
                    {Object.values(selectedConcessions).map((item) => (
                      <div key={item.key} className="flex justify-between items-center">
                        <span>{item.name} {item.size !== 'NONE' ? `(Size ${item.size})` : ''} x{item.quantity}</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} VNĐ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Giảm giá */}
              <div className="flex items-center justify-between text-red-600 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                <span>Giảm giá</span>
                <span>-{new Intl.NumberFormat('vi-VN').format(totalDiscount)} VNĐ</span>
              </div>

            </div>

            {/* Tổng cộng tiền */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase block leading-none">
                  TỔNG CỘNG
                </span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1">(Đã bao gồm VAT)</span>
              </div>
              <span className="text-xl font-black text-[#E50914]">
                {formattedFinalTotal} VNĐ
              </span>
            </div>

            {/* Nút xác nhận thanh toán */}
            <button
              onClick={handleConfirmPayment}
              disabled={holdRemainingMs <= 0}
              className={`w-full py-4 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded shadow-lg transition-all transform active:scale-95 text-center block ${
                holdRemainingMs > 0
                  ? 'bg-[#E50914] hover:bg-[#ff0f1b] text-white shadow-red-600/20 cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              TIẾP TỤC THANH TOÁN
            </button>

            {/* Lưu ý footer */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700 text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-start space-x-2">
              <span className="text-[#E50914] font-black">⚠️</span>
              <p className="leading-relaxed">
                Vui lòng đến trước 15 phút để nhận vé. Vé không hỗ trợ hoàn trả.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default BookingPaymentPage;
