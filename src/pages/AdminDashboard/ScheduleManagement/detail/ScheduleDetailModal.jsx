import React, { useEffect, useState } from "react";
import { Clock, DoorOpen, Film, Ticket } from "lucide-react";
import MovieService from "../../../../services/MovieService";
import BookingService from "../../../../services/BookingService";
import ModalShell from "../../../../components/ModalShell";
import SeatGrid from "../../../../components/SeatGrid";
import SeatLegend from "../../CinemaRoomManagement/shared/SeatLegend";
import { formatDateTime, getApiErrorMessage } from "../shared/scheduleFormConstants";
import { SCHEDULE_LABELS } from "../../../../constants/labels";
import ScheduleStatusBadge from "../shared/ScheduleStatusBadge";

const ScheduleDetailModal = ({ schedule, movieName, roomName, onClose, onEdit }) => {
  const [movie, setMovie] = useState(null);
  const [movieError, setMovieError] = useState("");
  const [seats, setSeats] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [seatError, setSeatError] = useState("");

  useEffect(() => {
    let cancelled = false;

    MovieService.getMovieByIdAdmin(schedule.movieId)
      .then((res) => {
        if (cancelled) return;
        setMovie(res.data?.data || res.data || null);
      })
      .catch((error) => {
        if (cancelled) return;
        setMovieError(getApiErrorMessage(error, SCHEDULE_LABELS.detailMovieError));
      });

    setIsLoadingSeats(true);
    setSeatError("");
    BookingService.getSeatsByScheduleId(schedule.scheduleId)
      .then((res) => {
        if (cancelled) return;
        setSeats(res.data?.data || res.data || []);
      })
      .catch((error) => {
        if (cancelled) return;
        setSeatError(getApiErrorMessage(error, SCHEDULE_LABELS.detailSeatError));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSeats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schedule.movieId, schedule.scheduleId]);

  const soldCount = seats.filter((s) => s.bookingStatus === 1).length;
  const totalCount = seats.length;
  const isGolden = Number(schedule.goldenHourExtra) > 0;

  return (
    <ModalShell
      title={`${SCHEDULE_LABELS.detailTitle} #${schedule.scheduleId}`}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100 dark:border-gray-800">
          <div className="shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mx-auto sm:mx-0">
            {movie?.smallImage ? (
              <img src={movie.smallImage} alt={movie.movieNameVn} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <Film size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {movie?.movieNameVn || movieName || `Movie #${schedule.movieId}`}
            </h4>
            {movieError && (
              <p className="text-xs text-red-500 dark:text-red-400">{movieError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <ScheduleStatusBadge displayStatus={schedule.displayStatus} />
              {schedule.movieFormat && (
                <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  {schedule.movieFormat}
                </span>
              )}
              {movie?.duration && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <Clock size={12} />
                  {movie.duration} phút
                </span>
              )}
              {isGolden && (
                <span
                  className="inline-flex items-center px-2 py-1 text-[11px] font-bold rounded text-white"
                  style={{ backgroundColor: "var(--cine-gold)" }}
                >
                  Giờ vàng +{Number(schedule.goldenHourExtra).toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-center gap-1.5">
                <DoorOpen size={14} className="text-gray-400 dark:text-gray-500" />
                {SCHEDULE_LABELS.detailRoom}: <span className="font-semibold text-gray-800 dark:text-white">{schedule.cinemaRoomName || roomName || `#${schedule.cinemaRoomId}`}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                {formatDateTime(schedule.startTime)} – {formatDateTime(schedule.endTime)}
              </p>
              <p className="flex items-center gap-1.5 col-span-2">
                <Ticket size={14} className="text-gray-400 dark:text-gray-500" />
                {SCHEDULE_LABELS.detailSoldSeats}:{" "}
                <span className="font-semibold text-gray-800 dark:text-white">
                  {isLoadingSeats ? "…" : `${soldCount}/${totalCount}`}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoadingSeats ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              {SCHEDULE_LABELS.detailLoadingSeats}
            </p>
          ) : seatError ? (
            <p className="text-center text-sm text-red-500 dark:text-red-400 py-8">{seatError}</p>
          ) : (
            <>
              <SeatGrid seats={seats} isAdmin={false} readOnly compact />
              <SeatLegend excludeKeys={["selected"]} compact />
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          {SCHEDULE_LABELS.detailClose}
        </button>
        <button
          type="button"
          onClick={() => onEdit(schedule)}
          className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm"
        >
          {SCHEDULE_LABELS.detailEdit}
        </button>
      </div>
    </ModalShell>
  );
};

export default ScheduleDetailModal;
