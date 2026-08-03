import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import BookingService from '../../services/BookingService';
import { subscribeSeatUpdates, applySeatStatusEvent } from '../../services/seatSocket';
import posterImg from "../../assets/imgs/Vidu_Film.jpeg";
import BookingStepper from '../../components/BookingStepper';
import {
  compareSeatsByPosition,
  getSeatLabel,
  getSeatColumnOrder,
  splitSeatsInRow,
  validateAdjacentSeats,
} from '../../utils/seatUtils';
import {
  MOMO_HOLD_MS,
  getMomoSeatHold,
  clearMomoSeatHold,
  formatHoldCountdown,
  saveMomoSeatHold,
} from '../../utils/momoSeatHold';
import {
  loadTabHeldSeatIds,
  addTabHeldSeatIds,
  removeTabHeldSeatIds,
  clearTabHeldSeatIds,
  saveTabHeldSeatIds,
} from '../../utils/tabSeatHold';

const BookingSeatPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const currentAccountId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('USER_LOGIN') || '{}');
      return user.accountId || null;
    } catch {
      return null;
    }
  }, []);

  const [movie, setMovie] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holdRemainingMs, setHoldRemainingMs] = useState(0);
  const [holdingSeatId, setHoldingSeatId] = useState(null);
  /** Ghế do CHÍNH tab này giữ thành công — chỉ tab này hiện đỏ */
  const [tabHeldSeatIds, setTabHeldSeatIds] = useState(() => loadTabHeldSeatIds(scheduleId));
  const navigatingToPaymentRef = useRef(false);
  const selectedSeatIdsRef = useRef([]);
  const tabHeldSeatIdsRef = useRef(tabHeldSeatIds);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeats.map((s) => s.seatId);
  }, [selectedSeats]);

  useEffect(() => {
    tabHeldSeatIdsRef.current = tabHeldSeatIds;
  }, [tabHeldSeatIds]);

  useEffect(() => {
    setTabHeldSeatIds(loadTabHeldSeatIds(scheduleId));
  }, [scheduleId]);

  /** Chỉ ghế tab này đã hold mới coi là "của mình" (đỏ) */
  const isHeldByThisTab = (seat) =>
    seat.bookingStatus === 2 && tabHeldSeatIds.has(Number(seat.seatId));

  /** Ghế đôi: tìm ghế còn lại trong cặp (seatType 2 = ghế đôi) */
  const getSeatPartner = (seat) => {
    if (!seat || seat.seatType !== 2 || seat.pairSeatId == null) return null;
    return seats.find((s) => Number(s.seatId) === Number(seat.pairSeatId)) || null;
  };

  /** Ghế đôi bị khoá nếu MỘT TRONG HAI ghế của cặp đã đặt/đang được người khác giữ */
  const isSeatLocked = (seat) => {
    const selfLocked =
      seat.bookingStatus === 1 ||
      (seat.bookingStatus === 2 && !tabHeldSeatIds.has(Number(seat.seatId)));
    if (selfLocked) return true;

    const partner = getSeatPartner(seat);
    if (!partner) return false;
    return (
      partner.bookingStatus === 1 ||
      (partner.bookingStatus === 2 && !tabHeldSeatIds.has(Number(partner.seatId)))
    );
  };

  const markSeatsHeldLocally = (seatIds, reservedBy, reservedAt) => {
    const idSet = new Set(seatIds.map(Number));
    setSeats((prev) =>
      prev.map((s) =>
        idSet.has(Number(s.seatId))
          ? {
              ...s,
              bookingStatus: 2,
              reservedBy: reservedBy || currentAccountId,
              reservedAt: reservedAt || new Date().toISOString(),
            }
          : s
      )
    );
  };

  const markSeatsAvailableLocally = (seatIds) => {
    const idSet = new Set(seatIds.map(Number));
    setSeats((prev) =>
      prev.map((s) =>
        idSet.has(Number(s.seatId))
          ? { ...s, bookingStatus: 0, reservedBy: null, reservedAt: null }
          : s
      )
    );
  };

  const computeHoldRemaining = (heldIds) => {
    const ids = heldIds || tabHeldSeatIdsRef.current;
    if (!ids || ids.size === 0) {
      const fromStorage = getMomoSeatHold(scheduleId);
      if (fromStorage?.expiresAt) {
        // Chỉ đếm nếu tab này vẫn còn ghế đang giữ
        return 0;
      }
      return 0;
    }
    const fromStorage = getMomoSeatHold(scheduleId);
    if (fromStorage?.expiresAt) {
      return Math.max(0, fromStorage.expiresAt - Date.now());
    }
    return MOMO_HOLD_MS;
  };

  useEffect(() => {
    setLoading(true);
    ScheduleService.getScheduleById(scheduleId)
      .then((res) => {
        const sched = res.data.data;
        setSchedule(sched);
        return Promise.all([
          MovieService.getMovieById(sched.movieId),
          BookingService.getSeatsByScheduleId(scheduleId),
        ]);
      })
      .then(([movieRes, seatsRes]) => {
        const loadedSeats = seatsRes.data.data || [];
        setMovie(movieRes.data.data);
        setSeats(loadedSeats);

        // Chỉ khôi phục ghế mà CHÍNH tab này đã giữ (sessionStorage)
        const tabIds = loadTabHeldSeatIds(scheduleId);
        const stillHeld = loadedSeats.filter(
          (s) => s.bookingStatus === 2 && tabIds.has(Number(s.seatId))
        );
        const validIds = new Set(stillHeld.map((s) => Number(s.seatId)));
        saveTabHeldSeatIds(scheduleId, validIds);
        setTabHeldSeatIds(validIds);
        setSelectedSeats(stillHeld);
        setHoldRemainingMs(validIds.size > 0 ? computeHoldRemaining(validIds) : 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi lấy dữ liệu đặt ghế:', err);
        setLoading(false);
      });
  }, [scheduleId, currentAccountId]);

  useEffect(() => {
    if (!scheduleId) return undefined;
    return subscribeSeatUpdates(scheduleId, (event) => {
      setSeats((prev) => applySeatStatusEvent(prev, event));

      // Cập nhật tập ghế tab này đang giữ theo event
      setTabHeldSeatIds((prev) => {
        const next = new Set(prev);
        (event.seats || []).forEach((u) => {
          const id = Number(u.seatId);
          if (u.bookingStatus === 0 || u.bookingStatus === 1) {
            next.delete(id);
          }
        });
        saveTabHeldSeatIds(scheduleId, next);
        tabHeldSeatIdsRef.current = next;
        setHoldRemainingMs(computeHoldRemaining(next));
        return next;
      });

      setSelectedSeats((prev) =>
        prev.filter((s) => {
          const update = event.seats?.find((u) => u.seatId === s.seatId);
          if (!update) return true;
          if (update.bookingStatus === 1 || update.bookingStatus === 0) return false;
          // DRAFT: chỉ giữ selection nếu tab này đã hold ghế đó
          if (update.bookingStatus === 2) {
            return tabHeldSeatIdsRef.current.has(Number(s.seatId));
          }
          return true;
        })
      );
    });
  }, [scheduleId]);

  // Rời trang chọn ghế (không sang thanh toán) → nhả ghế tab này đã giữ
  useEffect(() => {
    if (!scheduleId) return undefined;

    const releaseHeld = () => {
      if (navigatingToPaymentRef.current) return;
      const ids = [...tabHeldSeatIdsRef.current];
      if (ids.length === 0) return;
      BookingService.releaseSeats(scheduleId, ids).catch(() => {});
      clearTabHeldSeatIds(scheduleId);
      clearMomoSeatHold(scheduleId);
    };

    window.addEventListener('pagehide', releaseHeld);
    return () => {
      window.removeEventListener('pagehide', releaseHeld);
      releaseHeld();
    };
  }, [scheduleId]);

  useEffect(() => {
    if (holdRemainingMs <= 0) return undefined;

    const timer = setInterval(() => {
      setHoldRemainingMs((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next <= 0) {
          const ids = [...tabHeldSeatIdsRef.current];
          clearMomoSeatHold(scheduleId);
          clearTabHeldSeatIds(scheduleId);
          setTabHeldSeatIds(new Set());
          if (ids.length) {
            BookingService.releaseSeats(scheduleId, ids).catch(() => {});
          }
          BookingService.getSeatsByScheduleId(scheduleId).then((seatsRes) => {
            const loaded = seatsRes.data.data || [];
            setSeats(loaded);
            setSelectedSeats([]);
          });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [holdRemainingMs > 0, scheduleId]);

  const getSmallImageUrl = (image) => {
    if (!image) return posterImg;
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
    return mockSmallImages[image] || posterImg;
  };

  const formatShowtime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split('T');
    if (parts.length !== 2) return dateTimeStr;
    const time = parts[1].substring(0, 5);
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return dateTimeStr;
    return `${time} | ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  };

  const getRowLetter = (rowNum) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return letters[rowNum - 1] || `${rowNum}`;
  };

  const getSeatPrice = (seat) => (seat.price != null ? parseFloat(seat.price) : 0);

  const handleSeatClick = (seat) => {
    if (isSeatLocked(seat) || holdingSeatId != null) return;

    // Ghế đôi: luôn chọn/bỏ chọn cả cặp cùng lúc
    const partner = getSeatPartner(seat);
    const group = partner ? [seat, partner] : [seat];
    const groupIds = group.map((s) => s.seatId);

    const isSelected = group.some(
      (s) =>
        selectedSeats.some((sel) => sel.seatId === s.seatId) ||
        tabHeldSeatIds.has(Number(s.seatId))
    );

    // Bỏ chọn → nhả DRAFT ngay (cả cặp ghế đôi)
    if (isSelected) {
      setHoldingSeatId(seat.seatId);
      BookingService.releaseSeats(scheduleId, groupIds)
        .then(() => {
          const nextHeld = removeTabHeldSeatIds(scheduleId, groupIds);
          setTabHeldSeatIds(nextHeld);
          setSelectedSeats((prev) => prev.filter((s) => !groupIds.includes(s.seatId)));
          markSeatsAvailableLocally(groupIds);
          setHoldRemainingMs(computeHoldRemaining(nextHeld));
          if (nextHeld.size === 0) clearMomoSeatHold(scheduleId);
        })
        .catch(() => {
          alert('Không thể hủy giữ ghế. Vui lòng thử lại.');
        })
        .finally(() => setHoldingSeatId(null));
      return;
    }

    if (selectedSeats.length + groupIds.length > 8) {
      alert('Bạn chỉ được chọn tối đa 8 ghế trong một lần đặt vé!');
      return;
    }

    // Chọn ghế → giữ DRAFT ngay cho cả cặp ghế đôi; chỉ tab này được gắn ghế đỏ
    setHoldingSeatId(seat.seatId);
    BookingService.confirmBooking(scheduleId, groupIds)
      .then((res) => {
        if (res.data.status !== 200) {
          throw new Error(res.data.message || 'Không thể giữ ghế');
        }
        const held = res.data.data || {};
        const reservedBy = held.reservedBy || currentAccountId;
        const reservedAt = held.reservedAt || new Date().toISOString();
        const nextHeld = addTabHeldSeatIds(scheduleId, groupIds);
        setTabHeldSeatIds(nextHeld);

        const heldSeats = group.map((s) => ({
          ...s,
          bookingStatus: 2,
          reservedBy,
          reservedAt,
        }));
        setSelectedSeats((prev) => [...prev, ...heldSeats]);
        markSeatsHeldLocally(groupIds, reservedBy, reservedAt);
        saveMomoSeatHold(scheduleId, [...nextHeld]);
        setHoldRemainingMs(MOMO_HOLD_MS);
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          err.message ||
          (partner
            ? 'Ghế đôi đang được người khác giữ! Vui lòng chọn cặp ghế khác.'
            : 'Ghế đang được người khác giữ! Vui lòng chọn ghế khác.');
        alert(msg);
        BookingService.getSeatsByScheduleId(scheduleId).then((seatsRes) => {
          const loaded = seatsRes.data.data || [];
          setSeats(loaded);
          const nextHeld = loadTabHeldSeatIds(scheduleId);
          const still = [...nextHeld].filter((id) => {
            const fresh = loaded.find((x) => Number(x.seatId) === Number(id));
            return fresh && fresh.bookingStatus === 2;
          });
          const valid = new Set(still);
          saveTabHeldSeatIds(scheduleId, valid);
          setTabHeldSeatIds(valid);
          setSelectedSeats(loaded.filter((s) => valid.has(Number(s.seatId))));
        });
      })
      .finally(() => setHoldingSeatId(null));
  };

  const getSeatClass = (seat, isSelected) => {
    const partner = getSeatPartner(seat);

    // Đã đặt (chính ghế hoặc ghế còn lại trong cặp đôi)
    if (seat.bookingStatus === 1 || (partner && partner.bookingStatus === 1)) {
      return 'bg-gray-400 dark:bg-gray-600 text-white/50 cursor-not-allowed';
    }

    const heldByThisTab = isHeldByThisTab(seat) || (partner && isHeldByThisTab(partner));
    const heldByOther =
      (seat.bookingStatus === 2 && !tabHeldSeatIds.has(Number(seat.seatId))) ||
      (partner && partner.bookingStatus === 2 && !tabHeldSeatIds.has(Number(partner.seatId)));

    // DRAFT của tab/user khác → vàng, không chọn được
    if (heldByOther && !heldByThisTab) {
      return 'bg-amber-400 text-amber-950 cursor-not-allowed';
    }
    // Ghế tab này đang giữ / đang chọn → đỏ
    if (isSelected || heldByThisTab) {
      return 'bg-[#E50914] text-white font-black shadow-md shadow-red-500/20';
    }
    if (holdingSeatId === seat.seatId || (partner && holdingSeatId === partner.seatId)) {
      return 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 animate-pulse';
    }
    // Ghế đôi (chưa chọn)
    if (seat.seatType === 2) {
      return 'bg-white dark:bg-gray-900 border-2 border-pink-500 text-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-950/30';
    }
    if (seat.seatType === 1) {
      return 'bg-white dark:bg-gray-900 border-2 border-[#E50914] text-[#E50914] hover:bg-red-50/50 dark:hover:bg-red-950/30';
    }
    return 'bg-[#E2E8F0] dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200';
  };

  const handlePayment = () => {
    if (selectedSeats.length === 0 && tabHeldSeatIds.size === 0) {
      alert('Vui lòng chọn ít nhất một ghế trước khi thanh toán!');
      return;
    }

    const validation = validateAdjacentSeats(selectedSeats);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    if (holdingSeatId != null) {
      alert('Đang giữ ghế, vui lòng đợi giây lát...');
      return;
    }

    const seatIds =
      selectedSeats.length > 0
        ? selectedSeats.map((s) => s.seatId)
        : [...tabHeldSeatIds];

    BookingService.confirmBooking(scheduleId, seatIds)
      .then((res) => {
        if (res.data.status === 200) {
          navigatingToPaymentRef.current = true;
          saveMomoSeatHold(scheduleId, seatIds);
          const seatsForPayment =
            selectedSeats.length > 0
              ? selectedSeats
              : seats.filter((s) => tabHeldSeatIds.has(Number(s.seatId)));
          navigate(`/booking/payment/${scheduleId}`, {
            state: { selectedSeats: seatsForPayment },
          });
        } else {
          alert(res.data.message || 'Đặt vé thất bại. Vui lòng thử lại!');
          return BookingService.getSeatsByScheduleId(scheduleId);
        }
      })
      .then((seatsRes) => {
        if (seatsRes) {
          setSeats(seatsRes.data.data || []);
          setSelectedSeats([]);
        }
      })
      .catch((err) => {
        console.error('Lỗi xác nhận đặt ghế:', err);
        if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert('Ghế này đã có người đặt trước! Vui lòng chọn ghế khác.');
        }
        BookingService.getSeatsByScheduleId(scheduleId).then((seatsRes) => {
          setSeats(seatsRes.data.data || []);
          setSelectedSeats([]);
        });
      });
  };

  if (loading) {
    return (
      <div className="cine-booking-canvas min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
        <div className="text-xl font-bold text-[#E50914] animate-pulse">
          Đang tải sơ đồ phòng chiếu...
        </div>
      </div>
    );
  }

  const seatsByRow = seats.reduce((acc, seat) => {
    const r = seat.seatRow;
    if (!acc[r]) acc[r] = [];
    acc[r].push(seat);
    return acc;
  }, {});

  Object.keys(seatsByRow).forEach((r) => {
    seatsByRow[r].sort(
      (a, b) => getSeatColumnOrder(a.seatColumn) - getSeatColumnOrder(b.seatColumn)
    );
  });

  const totalAmount = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);
  const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount);

  const genres =
    movie.types && movie.types.length > 0
      ? movie.types.map((t) => t.typeName).join(', ')
      : 'Thể loại đang cập nhật';

  return (
    <div className="cine-booking-canvas bg-[#F8F9FA] dark:bg-[#050505] min-h-screen text-gray-900 dark:text-white pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      <BookingStepper currentStep={2} />
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8">
        {holdRemainingMs > 0 && tabHeldSeatIds.size > 0 && (
          <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Ghế MoMo đang được giữ — vui lòng hoàn tất thanh toán trước khi hết giờ.
            </p>
            <span className="text-lg font-black tabular-nums text-[#E50914]">
              {formatHoldCountdown(holdRemainingMs)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-[#E50914] tracking-widest uppercase border-l-2 border-[#E50914] pl-2 block">
                ĐANG CHỌN GHẾ
              </span>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                {movie.movieNameVn || movie.movieNameEnglish}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
                <span>📍 CINE LUXE Long Biên</span>
                <span>•</span>
                <span>📅 {formatShowtime(schedule.startTime)}</span>
                <span>•</span>
                <span className="text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Phòng: {schedule.cinemaRoomName}
                </span>
                {Number(schedule.goldenHourExtra) > 0 && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 normal-case tracking-normal">
                      🌟 Giờ vàng {(schedule.goldenHourStart || '').substring(0, 5)}–
                      {(schedule.goldenHourEnd || '').substring(0, 5)} (+
                      {Number(schedule.goldenHourExtra).toLocaleString('vi-VN')}đ/ghế)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full shadow-sm"></div>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 text-center tracking-[0.4em] uppercase">
                MÀN HÌNH
              </p>
            </div>

            <div className="overflow-x-auto py-6 flex justify-center">
              <div className="inline-block min-w-[640px] space-y-2.5">
                {Object.keys(seatsByRow)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((rowNum) => {
                    const rowLetter = getRowLetter(rowNum);
                    const { leftSeats, rightSeats } = splitSeatsInRow(seatsByRow[rowNum]);
                    // Tránh render ghế còn lại của cặp ghế đôi 2 lần trong cùng 1 hàng
                    const renderedSeatIds = new Set();

                    const renderSeatCell = (seat) => {
                      if (renderedSeatIds.has(seat.seatId)) return null;

                      const partner = getSeatPartner(seat);
                      renderedSeatIds.add(seat.seatId);
                      if (partner) renderedSeatIds.add(partner.seatId);

                      const group = partner ? [seat, partner] : [seat];
                      const isSelected = group.some((s) =>
                        selectedSeats.some((sel) => sel.seatId === s.seatId)
                      );
                      const label = partner
                        ? [seat, partner]
                            .sort(
                              (a, b) =>
                                getSeatColumnOrder(a.seatColumn) - getSeatColumnOrder(b.seatColumn)
                            )
                            .map((s) => s.seatColumn)
                            .join('-')
                        : seat.seatColumn;

                      return (
                        <label key={seat.seatId} className="relative cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isSeatLocked(seat) || holdingSeatId != null}
                            checked={isSelected || isHeldByThisTab(seat) || (partner && isHeldByThisTab(partner))}
                            onChange={() => handleSeatClick(seat)}
                            className="sr-only"
                          />
                          <span
                            className={`h-8 ${partner ? 'w-[4.5rem]' : 'w-8'} rounded text-[10px] font-bold flex items-center justify-center transition-all ${getSeatClass(seat, isSelected)}`}
                          >
                            {label}
                          </span>
                        </label>
                      );
                    };

                    return (
                      <div key={rowNum} className="flex items-center justify-between">
                        <span className="w-6 text-xs font-bold text-gray-400 dark:text-gray-500 text-center">
                          {rowLetter}
                        </span>

                        <div className="flex gap-2">{leftSeats.map(renderSeatCell)}</div>

                        <div className="w-8"></div>

                        <div className="flex gap-2">{rightSeats.map(renderSeatCell)}</div>

                        <span className="w-6 text-xs font-bold text-gray-400 dark:text-gray-500 text-center">
                          {rowLetter}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">
              Danh sách ghế đang chọn: {selectedSeats.length} / 8
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-[#E2E8F0] dark:bg-gray-700"></div>
                <span>TRỐNG</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-white dark:bg-gray-900 border-2 border-[#E50914]"></div>
                <span>VIP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-white dark:bg-gray-900 border-2 border-pink-500"></div>
                <span>GHẾ ĐÔI</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-[#E50914]"></div>
                <span>ĐANG CHỌN</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-amber-400"></div>
                <span>ĐANG GIỮ</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-gray-400 dark:bg-gray-600"></div>
                <span>ĐÃ ĐẶT</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6 transition-colors duration-300">
            <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
              THÔNG TIN ĐẶT VÉ
            </h2>

            <div className="flex gap-4">
              <div className="w-16 aspect-[3/4] rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <img
                  src={getSmallImageUrl(movie.smallImage)}
                  alt="Poster"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase">
                  {movie.movieNameVn || movie.movieNameEnglish}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wide">
                  {schedule.movieFormat} | T18
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{genres}</p>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase">
                GHẾ ĐÃ CHỌN
              </p>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {[...selectedSeats]
                    .sort(compareSeatsByPosition)
                    .map((seat) => {
                      const label = getSeatLabel(seat, getRowLetter);
                      return (
                        <span
                          key={seat.seatId}
                          className="px-3 py-1 rounded bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] text-xs font-bold"
                        >
                          {label}
                        </span>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs italic text-gray-450 dark:text-gray-500">Chưa chọn ghế nào</p>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase">
                TỔNG CỘNG
              </span>
              <span className="text-lg font-black text-[#E50914]">{formattedTotal} VNĐ</span>
            </div>

            <button
              disabled={selectedSeats.length === 0}
              onClick={handlePayment}
              className={`w-full py-4 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded transition-all text-center ${
                selectedSeats.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-[#E50914] hover:bg-[#ff0f1b] text-white shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer'
              }`}
            >
              TIẾP TỤC THANH TOÁN
            </button>

            <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
              Bằng việc nhấn tiếp tục, bạn đồng ý với các <br />
              <span className="underline hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                điều khoản của Cinema Elite
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSeatPage;
