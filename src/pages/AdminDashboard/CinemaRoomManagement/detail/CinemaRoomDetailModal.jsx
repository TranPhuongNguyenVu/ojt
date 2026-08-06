import React, { useEffect, useMemo, useState } from "react";
import { Armchair, Layers, Settings } from "lucide-react";
import ModalShell from "../../../../components/ModalShell";
import SeatGrid from "../../../../components/SeatGrid";
import CinemaRoomService from "../../../../services/CinemaRoomService";
import SeatLegend from "../shared/SeatLegend";
import {
  getApiErrorMessage,
  getRoomStatusBadge,
  formatVndShort,
} from "../shared/cinemaRoomFormConstants";
import { isAisleSeat } from "../../../../utils/seatUtils";
import { CINEMA_ROOM_LABELS } from "../../../../constants/labels";

const CinemaRoomDetailModal = ({ room, onClose, onOpenSetup }) => {
  const [detail, setDetail] = useState(null);
  const [seats, setSeats] = useState([]);
  const [priceFormatId, setPriceFormatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage("");
    setDetail(null);
    setSeats([]);

    CinemaRoomService.getSeats(room.cinemaRoomId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || res.data || null;
        setDetail(data);
        setSeats(data?.seats || []);
        setPriceFormatId(data?.formats?.[0]?.versionId ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(getApiErrorMessage(error, "Không thể tải thông tin phòng chiếu."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [room.cinemaRoomId]);

  const display = detail || room;
  const badge = getRoomStatusBadge(display.status);
  const formats = display.formats || room.formats || [];

  const actualSeatCount = useMemo(
    () => seats.filter((s) => !isAisleSeat(s)).length,
    [seats]
  );

  const seatsWithPrices = useMemo(() => {
    if (!priceFormatId) return seats;
    return seats.map((seat) => {
      const match = (seat.prices || []).find((p) => p.versionId === priceFormatId);
      return { ...seat, priceLabel: match ? formatVndShort(match.price) : null };
    });
  }, [seats, priceFormatId]);

  return (
    <ModalShell title={display.cinemaRoomName || CINEMA_ROOM_LABELS.pageTitle} onClose={onClose} maxWidth="max-w-5xl">
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
              {badge.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Armchair size={15} className="text-gray-400 dark:text-gray-500" />
              {display.seatQuantity ?? actualSeatCount} {CINEMA_ROOM_LABELS.seatsSuffix}
              {seats.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({actualSeatCount} đang hoạt động)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Layers size={15} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {CINEMA_ROOM_LABELS.fieldFormats}
              </p>
              {formats.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Chưa có định dạng</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formats.map((f) => (
                    <span
                      key={f.versionId}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium"
                    >
                      {f.versionName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Sơ đồ ghế
          </p>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              Đang tải sơ đồ ghế...
            </div>
          ) : errorMessage ? (
            <div className="py-8 text-center text-sm text-red-600 dark:text-red-400 font-semibold">
              {errorMessage}
            </div>
          ) : seats.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              Chưa có ghế nào trong phòng này.
            </div>
          ) : (
            <>
              {formats.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Xem giá theo định dạng
                  </span>
                  <div className="flex gap-1">
                    {formats.map((f) => (
                      <button
                        key={f.versionId}
                        type="button"
                        onClick={() => setPriceFormatId(f.versionId)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border transition-colors ${
                          priceFormatId === f.versionId
                            ? "bg-[#C00000] border-transparent text-white"
                            : "bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        {f.versionName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 text-center tracking-[0.4em] uppercase">
                  MÀN HÌNH CHIẾU
                </p>
              </div>

              <div className="overflow-x-auto">
                <SeatGrid
                  seats={seatsWithPrices}
                  selectedSeats={[]}
                  isAdmin
                  showPrices
                  readOnly
                />
              </div>

              <SeatLegend compact excludeKeys={["selected", "booked"]} />
            </>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Đóng
        </button>
        <button
          type="button"
          onClick={onOpenSetup}
          className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Settings size={15} />
          {CINEMA_ROOM_LABELS.setupModalTitle}
        </button>
      </div>
    </ModalShell>
  );
};

export default CinemaRoomDetailModal;
