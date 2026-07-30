import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Film } from 'lucide-react';
import MovieService from '../../services/MovieService';
import ScheduleService from '../../services/ScheduleService';
import BookingService from '../../services/BookingService';
import { subscribeSeatUpdates, applySeatStatusEvent } from '../../services/seatSocket';
import posterImg from "../../assets/imgs/Vidu_Film.jpeg";
import BookingStepper from '../../components/BookingStepper';
import SeatGrid from '../../components/SeatGrid';
import {
  compareSeatsByPosition,
  getSeatLabel,
  validateAdjacentSeats,
} from '../../utils/seatUtils';
import {
  loadTabHeldSeatIds,
  addTabHeldSeatIds,
  removeTabHeldSeatIds,
  clearTabHeldSeatIds,
  saveTabHeldSeatIds,
} from '../../utils/tabSeatHold';

const EmployeeBookingSeatPage = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [holdingSeatId, setHoldingSeatId] = useState(null);
  const [tabHeldSeatIds, setTabHeldSeatIds] = useState(() => loadTabHeldSeatIds(`emp_${scheduleId}`));
  const navigatingNextRef = useRef(false);
  const selectedSeatIdsRef = useRef([]);
  const tabHeldSeatIdsRef = useRef(tabHeldSeatIds);
  const empHoldKey = `emp_${scheduleId}`;

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeats.map((s) => s.seatId);
  }, [selectedSeats]);

  useEffect(() => {
    tabHeldSeatIdsRef.current = tabHeldSeatIds;
  }, [tabHeldSeatIds]);

  useEffect(() => {
    setTabHeldSeatIds(loadTabHeldSeatIds(empHoldKey));
  }, [scheduleId]);

  const isSeatLocked = (seat) =>
    seat.bookingStatus === 1 ||
    (seat.bookingStatus === 2 && !tabHeldSeatIds.has(Number(seat.seatId)));

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
        const loaded = seatsRes.data.data || [];
        setMovie(movieRes.data.data);
        setSeats(loaded);
        const tabIds = loadTabHeldSeatIds(empHoldKey);
        const stillHeld = loaded.filter(
          (s) => s.bookingStatus === 2 && tabIds.has(Number(s.seatId))
        );
        const validIds = new Set(stillHeld.map((s) => Number(s.seatId)));
        saveTabHeldSeatIds(empHoldKey, validIds);
        setTabHeldSeatIds(validIds);
        setSelectedSeats(stillHeld);
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
      setTabHeldSeatIds((prev) => {
        const next = new Set(prev);
        (event.seats || []).forEach((u) => {
          if (u.bookingStatus === 0 || u.bookingStatus === 1) {
            next.delete(Number(u.seatId));
          }
        });
        saveTabHeldSeatIds(empHoldKey, next);
        tabHeldSeatIdsRef.current = next;
        return next;
      });
      setSelectedSeats((prev) =>
        prev.filter((s) => {
          const update = event.seats?.find((u) => u.seatId === s.seatId);
          if (!update) return true;
          if (update.bookingStatus === 1 || update.bookingStatus === 0) return false;
          if (update.bookingStatus === 2) {
            return tabHeldSeatIdsRef.current.has(Number(s.seatId));
          }
          return true;
        })
      );
    });
  }, [scheduleId]);

  useEffect(() => {
    if (!scheduleId) return undefined;
    const releaseHeld = () => {
      if (navigatingNextRef.current) return;
      const ids = [...tabHeldSeatIdsRef.current];
      if (!ids.length) return;
      BookingService.releaseSeats(scheduleId, ids).catch(() => {});
      clearTabHeldSeatIds(empHoldKey);
    };
    window.addEventListener('pagehide', releaseHeld);
    return () => {
      window.removeEventListener('pagehide', releaseHeld);
      releaseHeld();
    };
  }, [scheduleId]);

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

  const handleSeatClick = (seat) => {
    if (isSeatLocked(seat) || holdingSeatId != null) return;

    const isSelected =
      selectedSeats.some((s) => s.seatId === seat.seatId) ||
      tabHeldSeatIds.has(Number(seat.seatId));

    if (isSelected) {
      setHoldingSeatId(seat.seatId);
      BookingService.releaseSeats(scheduleId, [seat.seatId])
        .then(() => {
          const nextHeld = removeTabHeldSeatIds(empHoldKey, [seat.seatId]);
          setTabHeldSeatIds(nextHeld);
          setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
          setSeats((prev) =>
            prev.map((s) =>
              s.seatId === seat.seatId
                ? { ...s, bookingStatus: 0, reservedBy: null, reservedAt: null }
                : s
            )
          );
        })
        .catch(() => alert('Không thể hủy giữ ghế.'))
        .finally(() => setHoldingSeatId(null));
      return;
    }

    if (selectedSeats.length >= 8) {
      alert('Bạn chỉ được chọn tối đa 8 ghế trong một lần đặt vé!');
      return;
    }

    setHoldingSeatId(seat.seatId);
    BookingService.confirmBooking(scheduleId, [seat.seatId])
      .then((res) => {
        if (res.data.status !== 200) {
          throw new Error(res.data.message || 'Không thể giữ ghế');
        }
        const heldInfo = res.data.data || {};
        const nextHeld = addTabHeldSeatIds(empHoldKey, [seat.seatId]);
        setTabHeldSeatIds(nextHeld);
        const held = {
          ...seat,
          bookingStatus: 2,
          reservedBy: heldInfo.reservedBy || currentAccountId,
          reservedAt: heldInfo.reservedAt || new Date().toISOString(),
        };
        setSelectedSeats((prev) => [...prev, held]);
        setSeats((prev) => prev.map((s) => (s.seatId === seat.seatId ? held : s)));
      })
      .catch((err) => {
        alert(err.response?.data?.message || err.message || 'Ghế đang được người khác giữ!');
        BookingService.getSeatsByScheduleId(scheduleId).then((seatsRes) => {
          const loaded = seatsRes.data.data || [];
          setSeats(loaded);
          const valid = new Set(
            [...loadTabHeldSeatIds(empHoldKey)].filter((id) => {
              const fresh = loaded.find((x) => Number(x.seatId) === Number(id));
              return fresh && fresh.bookingStatus === 2;
            })
          );
          saveTabHeldSeatIds(empHoldKey, valid);
          setTabHeldSeatIds(valid);
          setSelectedSeats(loaded.filter((s) => valid.has(Number(s.seatId))));
        });
      })
      .finally(() => setHoldingSeatId(null));
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0 && tabHeldSeatIds.size === 0) {
      alert('Vui lòng chọn ít nhất một ghế trước khi tiếp tục!');
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
          navigatingNextRef.current = true;
          const seatsForNext =
            selectedSeats.length > 0
              ? selectedSeats
              : seats.filter((s) => tabHeldSeatIds.has(Number(s.seatId)));
          navigate(`/employee/booking/ticket/${scheduleId}`, {
            state: {
              selectedSeats: seatsForNext,
              showtimeState: location.state,
            },
          });
        } else {
          alert(res.data.message || 'Không thể giữ ghế. Vui lòng thử lại!');
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
        console.error('Lỗi giữ ghế:', err);
        alert(err.response?.data?.message || 'Ghế đang được người khác giữ!');
        BookingService.getSeatsByScheduleId(scheduleId).then((seatsRes) => {
          setSeats(seatsRes.data.data || []);
          setSelectedSeats([]);
        });
      });
  };

  if (loading || !movie || !schedule) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-lg font-bold text-[#E50914] animate-pulse">
          Đang tải sơ đồ phòng chiếu...
        </div>
      </div>
    );
  }

  const totalAmount = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);
  const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount);

  const genres =
    movie.types && movie.types.length > 0
      ? movie.types.map((t) => t.typeName).join(', ')
      : 'Thể loại đang cập nhật';

  return (
    <div className="bg-[#F8F9FA] dark:bg-transparent min-h-screen text-gray-900 dark:text-gray-100 pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      <BookingStepper currentStep={2} />
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8">
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Chọn ghế
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">
            {movie.movieNameVn || movie.movieNameEnglish} · {formatShowtime(schedule.startTime)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6 transition-colors duration-300">
          <div className="space-y-2 pt-2">
            <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full shadow-sm" />
            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 text-center tracking-[0.4em] uppercase">
              MÀN HÌNH
            </p>
          </div>

          <SeatGrid
            seats={seats}
            selectedSeats={selectedSeats}
            tabHeldSeatIds={tabHeldSeatIds}
            onSeatClick={(seat) => handleSeatClick(seat)}
          />

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">
            Danh sách ghế đang chọn: {selectedSeats.length} / 8
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600" />
              <span>TRỐNG</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-white dark:bg-gray-900 border-2 border-[#E50914]" />
              <span>VIP</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-4 rounded bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <span>COUPLE</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-amber-400 border border-amber-600" />
              <span>ĐANG CHỌN</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-amber-300 border border-amber-500" />
              <span>ĐANG GIỮ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-400 dark:bg-gray-600" />
              <span>ĐÃ ĐẶT</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-250 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 line-through" />
              <span>INACTIVE</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6 transition-colors duration-300">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
            Thông tin suất chiếu
          </h2>

          <div className="flex gap-4">
            <div className="w-16 aspect-[3/4] rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <img
                src={getSmallImageUrl(movie.smallImage)}
                alt={movie.movieNameVn || movie.movieNameEnglish}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase">
                {movie.movieNameVn || movie.movieNameEnglish}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wide">
                {schedule.movieFormat || '2D'} | T18
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                <Film size={12} /> {genres}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                <Clock size={12} /> {formatShowtime(schedule.startTime)}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                Phòng: {schedule.cinemaRoomName}
              </p>
              {Number(schedule.goldenHourExtra) > 0 && (
                <p className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold w-fit">
                  🌟 Giờ vàng {(schedule.goldenHourStart || '').substring(0, 5)}–{(schedule.goldenHourEnd || '').substring(0, 5)}
                  {' '}(+{Number(schedule.goldenHourExtra).toLocaleString('vi-VN')}đ/ghế)
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase">
              Ghế đã chọn
            </p>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {[...selectedSeats]
                  .sort(compareSeatsByPosition)
                  .map((seat) => (
                    <span
                      key={seat.seatId}
                      className="px-3 py-1 rounded bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] text-xs font-bold"
                    >
                      {getSeatLabel(seat, getRowLetter)}
                    </span>
                  ))}
              </div>
            ) : (
              <p className="text-xs italic text-gray-400 dark:text-gray-500">Chưa chọn ghế nào</p>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase">
              Tổng cộng
            </span>
            <span className="text-lg font-black text-[#E50914]">{formattedTotal} VNĐ</span>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0 || holdingSeatId != null}
            onClick={handleContinue}
            className={`w-full py-4 font-extrabold text-xs md:text-sm tracking-wider uppercase rounded-xl transition-all ${
              selectedSeats.length > 0 && holdingSeatId == null
                ? 'bg-[#E50914] hover:bg-[#ff0f1b] text-white shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {holdingSeatId != null ? 'Đang giữ ghế...' : 'Tiếp tục'}
          </button>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default EmployeeBookingSeatPage;
