import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Save, AlertCircle, Edit, Check, Grid, Power, PowerOff } from "lucide-react";
import CinemaRoomService from "../../../services/CinemaRoomService";
import VersionService from "../../../services/VersionService";
import SeatGrid from "../../../components/SeatGrid";
import { useSeatSelection } from "../../../hooks/useSeatSelection";
import { CINEMA_ROOM_LABELS } from "../../../constants/labels";
import { ROOM_STATUS, getApiErrorMessage, getRoomStatusBadge, formatVndShort } from "./shared/cinemaRoomFormConstants";
import { SEAT_STATUS, isAisleSeat } from "../../../utils/seatUtils";
import SeatLegend from "./shared/SeatLegend";
import EditCinemaRoomInfoModal from "./edit/EditCinemaRoomInfoModal";
import UpdateSeatMapModal from "./shared/UpdateSeatMapModal";

const getColumnIndex = (column) => {
  if (!column) return 0;
  const num = parseInt(column, 10);
  if (!isNaN(num)) {
    return num - 1;
  }
  let index = 0;
  const colStr = String(column).toUpperCase();
  for (let i = 0; i < colStr.length; i++) {
    index = index * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  return index - 1;
};

const buildCouplePlan = (selectedSeats) => {
  if (selectedSeats.length < 2) {
    return { pairs: [], error: "" };
  }
  if (selectedSeats.some(isAisleSeat)) {
    return { pairs: [], error: CINEMA_ROOM_LABELS.coupleDeletedSeatError };
  }
  if (selectedSeats.length % 2 !== 0) {
    return { pairs: [], error: CINEMA_ROOM_LABELS.coupleOddCountError };
  }

  const isSameRow = selectedSeats.every((s) => s.seatRow === selectedSeats[0].seatRow);
  if (!isSameRow) {
    return { pairs: [], error: CINEMA_ROOM_LABELS.coupleHorizontalOnlyError };
  }

  const sorted = [...selectedSeats].sort(
    (a, b) => getColumnIndex(a.seatColumn) - getColumnIndex(b.seatColumn)
  );

  const pairs = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const first = sorted[i];
    const second = sorted[i + 1];
    if (Math.abs(getColumnIndex(first.seatColumn) - getColumnIndex(second.seatColumn)) !== 1) {
      return { pairs: [], error: CINEMA_ROOM_LABELS.coupleHorizontalOnlyError };
    }
    pairs.push([first, second]);
  }

  return { pairs, error: "" };
};

const CinemaRoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [versions, setVersions] = useState([]);
  const [priceFormatId, setPriceFormatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isUpdatingSeatMap, setIsUpdatingSeatMap] = useState(false);

  const { selectedSeats, toggleSeat, clearSelection, selectRow, selectColumn } = useSeatSelection({
    seats,
    initialSelected: [],
    isAdmin: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const versionsRes = await VersionService.getAll();
      setVersions(versionsRes.data.data || []);

      const roomRes = await CinemaRoomService.getSeats(id);
      const roomData = roomRes.data.data;
      setRoom(roomData);
      setSeats(roomData.seats || []);
      setPriceFormatId((prev) => {
        const formats = roomData.formats || [];
        if (formats.some((f) => f.versionId === prev)) return prev;
        return formats[0]?.versionId ?? null;
      });
      clearSelection();
    } catch (error) {
      setRoom(null);
      setSeats([]);
      setErrorMessage(getApiErrorMessage(error, "Không thể tải thông tin phòng chiếu."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const actualSeatCount = useMemo(() => {
    return seats.filter((s) => !isAisleSeat(s)).length;
  }, [seats]);

  const couplePlan = useMemo(() => buildCouplePlan(selectedSeats), [selectedSeats]);

  const seatsWithPrices = useMemo(() => {
    if (!priceFormatId) return seats;
    return seats.map((seat) => {
      const match = (seat.prices || []).find((p) => p.versionId === priceFormatId);
      return { ...seat, priceLabel: match ? formatVndShort(match.price) : null };
    });
  }, [seats, priceFormatId]);

  const applyAction = (action) => {
    if (selectedSeats.length === 0) return;

    let updatedSeats = [...seats];

    if (action === "couple") {
      if (couplePlan.error || couplePlan.pairs.length === 0) return;

      const pairedById = new Map();
      couplePlan.pairs.forEach(([a, b]) => {
        pairedById.set(a.seatId, b.seatId);
        pairedById.set(b.seatId, a.seatId);
      });

      updatedSeats = updatedSeats.map((s) => {
        if (pairedById.has(s.seatId)) {
          return { ...s, seatType: 2, pairSeatId: pairedById.get(s.seatId) };
        }
        if (s.pairSeatId && pairedById.has(s.pairSeatId)) {
          return { ...s, pairSeatId: null, seatType: s.seatType === 2 ? 0 : s.seatType };
        }
        return s;
      });

      clearSelection();
    } else if (action === "decouple") {
      const idsToDecouple = new Set();
      selectedSeats.forEach((seat) => {
        idsToDecouple.add(seat.seatId);
        if (seat.pairSeatId) {
          idsToDecouple.add(seat.pairSeatId);
        }
      });

      updatedSeats = updatedSeats.map((s) => {
        if (idsToDecouple.has(s.seatId)) {
          return { ...s, pairSeatId: null, seatType: s.seatType === 2 ? 0 : s.seatType };
        }
        return s;
      });

      clearSelection();
    } else {
      const idsToChange = new Set();

      selectedSeats.forEach((seat) => {
        idsToChange.add(seat.seatId);
        if (seat.pairSeatId) {
          idsToChange.add(seat.pairSeatId);
        }
      });

      updatedSeats = updatedSeats.map((seat) => {
        if (idsToChange.has(seat.seatId)) {
          const updated = { ...seat };
          if (action === "normal") {
            updated.seatType = 0;
            updated.pairSeatId = null;
          } else if (action === "vip") {
            updated.seatType = 1;
            updated.pairSeatId = null;
          } else if (action === "inactive") {
            updated.status = SEAT_STATUS.INACTIVE;
          } else if (action === "active") {
            updated.status = SEAT_STATUS.ACTIVE;
          } else if (action === "delete") {
            updated.status = SEAT_STATUS.AISLE;
            updated.seatType = updated.seatType === 2 ? 0 : updated.seatType;
            updated.pairSeatId = null;
          } else if (action === "restore") {
            updated.status = SEAT_STATUS.ACTIVE;
          }
          return updated;
        }
        return seat;
      });

      clearSelection();
    }

    setSeats(updatedSeats);
  };

  const handleSaveSeats = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      seats: seats.map((s) => ({
        seatId: s.seatId,
        seatType: s.seatType,
        pairSeatId: s.pairSeatId,
        status: s.status,
      })),
    };

    try {
      await CinemaRoomService.updateSeats(id, payload);
      setSuccessMessage("Lưu sơ đồ ghế thành công.");
      clearSelection();
      loadData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể lưu sơ đồ ghế."));
      loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      if (room.status === ROOM_STATUS.ACTIVE) {
        await CinemaRoomService.deactivate(id);
        setSuccessMessage("Ngừng hoạt động phòng chiếu thành công.");
      } else {
        await CinemaRoomService.activate(id);
        setSuccessMessage("Kích hoạt phòng chiếu thành công.");
      }
      loadData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, CINEMA_ROOM_LABELS.hasSchedulesError));
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 dark:text-gray-400 font-bold">
        Đang tải thông tin phòng...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold">
          <AlertCircle size={18} />
          {errorMessage || CINEMA_ROOM_LABELS.roomNotFound}
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/cinema-rooms")}
          className="flex items-center gap-2 border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-sm font-bold px-4 py-2 rounded-lg hover:border-slate-400 dark:hover:border-gray-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          {CINEMA_ROOM_LABELS.backToList}
        </button>
      </div>
    );
  }

  const badge = getRoomStatusBadge(room.status);
  const isActive = room.status === ROOM_STATUS.ACTIVE;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/cinema-rooms")}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{CINEMA_ROOM_LABELS.setupModalTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={isSaving}
            onClick={() => setIsEditingInfo(true)}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-gray-700 hover:border-[#C00000] hover:text-[#C00000] disabled:bg-slate-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-sm font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Edit size={16} />
            {CINEMA_ROOM_LABELS.editInfo}
          </button>
          <button
            disabled={isSaving}
            onClick={() => setIsUpdatingSeatMap(true)}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-gray-700 hover:border-blue-600 hover:text-blue-600 disabled:bg-slate-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-sm font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Grid size={16} />
            {CINEMA_ROOM_LABELS.updateSeatMap}
          </button>
          <button
            onClick={handleSaveSeats}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-[#C00000] hover:bg-[#a00000] disabled:bg-slate-400 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Save size={16} />
            {isSaving ? "Đang lưu..." : CINEMA_ROOM_LABELS.saveLayout}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {errorMessage && (
          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-800 dark:text-green-300 font-bold flex items-center gap-2">
            <Check size={18} />
            {successMessage}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 flex flex-wrap justify-between items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#C00000] tracking-widest uppercase">
              {CINEMA_ROOM_LABELS.roomDetails}
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase">
              {room.cinemaRoomName}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400 font-bold">
              <span className="flex items-center gap-1">
                <Layers size={14} />
                {room.formats && room.formats.length > 0
                  ? room.formats.map((f) => (
                      <span
                        key={f.versionId}
                        className="ml-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300"
                      >
                        {f.versionName}
                      </span>
                    ))
                  : <span className="ml-1 text-slate-400 dark:text-gray-500 italic">Chưa có định dạng</span>
                }
              </span>
              <span>•</span>
              <span>{CINEMA_ROOM_LABELS.capacityLabel(room.seatQuantity, actualSeatCount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30"
                  : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 border border-green-200 dark:border-green-500/30"
              }`}
            >
              {isActive ? <PowerOff size={14} /> : <Power size={14} />}
              {isActive ? CINEMA_ROOM_LABELS.actionDeactivate : CINEMA_ROOM_LABELS.actionActivate}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-8 space-y-8">
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full shadow-sm"></div>
              <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 text-center tracking-[0.4em] uppercase">
                MÀN HÌNH CHIẾU
              </p>
            </div>

            {room.formats && room.formats.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                  Xem giá theo định dạng
                </span>
                <div className="flex gap-1">
                  {room.formats.map((f) => (
                    <button
                      key={f.versionId}
                      type="button"
                      onClick={() => setPriceFormatId(f.versionId)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-full border transition-colors ${
                        priceFormatId === f.versionId
                          ? "bg-[#C00000] border-transparent text-white"
                          : "bg-white dark:bg-gray-800/60 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500"
                      }`}
                    >
                      {f.versionName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {seats.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-gray-500 font-bold text-sm">
                Chưa có ghế nào. Nhấn "{CINEMA_ROOM_LABELS.updateSeatMap}" để tạo sơ đồ mới.
              </div>
            ) : (
              <SeatGrid
                seats={seatsWithPrices}
                selectedSeats={selectedSeats}
                onSeatClick={(seat, forceState) => toggleSeat(seat, forceState)}
                onSelectRow={selectRow}
                onSelectColumn={selectColumn}
                isAdmin={true}
                showPrices
              />
            )}

            <SeatLegend extra={selectedSeats.length} />
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-500 dark:text-gray-400 tracking-wider uppercase border-b border-slate-100 dark:border-gray-800 pb-2">
                {CINEMA_ROOM_LABELS.seatTools}
              </h3>

              <div className="space-y-4">
                {selectedSeats.length > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-500/30 rounded-xl text-xs font-bold text-sky-800 dark:text-sky-300">
                    <span>Đã chọn {selectedSeats.length} ghế</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2.5 py-1 text-[10px] bg-sky-200 dark:bg-sky-900/60 hover:bg-sky-300 dark:hover:bg-sky-800 text-sky-900 dark:text-sky-200 rounded font-black transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-gray-800 rounded-xl text-xs font-medium text-slate-500 dark:text-gray-400">
                    Chưa chọn ghế nào. Nhấp/kéo để chọn, hoặc bấm số hàng/cột để chọn cả dãy.
                  </div>
                )}

                <div className="space-y-2 flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase">Đổi loại ghế</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyAction("normal")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 disabled:opacity-50 text-slate-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                    >
                      {CINEMA_ROOM_LABELS.seatTypeNormal}
                    </button>
                    <button
                      onClick={() => applyAction("vip")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold border-2 border-amber-500 disabled:opacity-50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      {CINEMA_ROOM_LABELS.seatTypeVip}
                    </button>
                  </div>
                  <button
                    onClick={() => applyAction("couple")}
                    disabled={selectedSeats.length < 2 || isSaving || !!couplePlan.error}
                    className="w-full py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 dark:disabled:bg-gray-800 disabled:text-slate-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Ghép đôi ({CINEMA_ROOM_LABELS.seatTypeCouple})
                  </button>
                  {couplePlan.error && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-tight">{couplePlan.error}</p>
                  )}
                  <button
                    onClick={() => applyAction("decouple")}
                    disabled={selectedSeats.length === 0 || isSaving}
                    className="w-full py-2.5 text-xs font-bold border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy ghép đôi
                  </button>
                </div>

                <div className="space-y-2 flex flex-col border-t border-slate-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase">Trạng thái ghế</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyAction("active")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {CINEMA_ROOM_LABELS.seatStatusActive}
                    </button>
                    <button
                      onClick={() => applyAction("inactive")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {CINEMA_ROOM_LABELS.seatStatusInactive}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col border-t border-slate-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase">Lối đi</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyAction("delete")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold bg-slate-800 dark:bg-gray-700 hover:bg-slate-900 dark:hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Xóa (Lối đi)
                    </button>
                    <button
                      onClick={() => applyAction("restore")}
                      disabled={selectedSeats.length === 0 || isSaving}
                      className="py-2 text-xs font-bold border border-slate-800 dark:border-gray-600 text-slate-800 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Khôi phục
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-gray-500 tracking-wider uppercase">Hướng dẫn thiết lập</h4>
              <ul className="text-xs text-slate-500 dark:text-gray-400 space-y-2 list-disc pl-4 font-bold leading-relaxed">
                <li>Dùng "{CINEMA_ROOM_LABELS.editInfo}" để đổi tên phòng và định dạng hỗ trợ.</li>
                <li>Dùng "{CINEMA_ROOM_LABELS.updateSeatMap}" để đổi kích thước sơ đồ (hàng × cột).</li>
                <li>Bấm vào số thứ tự hàng/cột để chọn nhanh cả hàng hoặc cả cột.</li>
                <li>{CINEMA_ROOM_LABELS.coupleHorizontalOnlyError}</li>
                <li>Ghế đã được đặt sẽ không thể đổi loại hoặc trạng thái.</li>
                <li>Nhớ nhấn "{CINEMA_ROOM_LABELS.saveLayout}" trước khi rời khỏi trang.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {isEditingInfo && (
        <EditCinemaRoomInfoModal
          room={room}
          versions={versions}
          onClose={() => setIsEditingInfo(false)}
          onSuccess={loadData}
        />
      )}

      {isUpdatingSeatMap && (
        <UpdateSeatMapModal
          room={{ ...room, seats }}
          onClose={() => setIsUpdatingSeatMap(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default CinemaRoomDetail;
