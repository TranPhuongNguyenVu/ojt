import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Wand2,
  CalendarDays,
  Table2,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import MovieService from "../../../services/MovieService";
import ScheduleService from "../../../services/ScheduleService";
import CinemaRoomService from "../../../services/CinemaRoomService";
import PricingService from "../../../services/PricingService";
import Pagination from "../../../components/Pagination";
import DateInput from "../../../components/DateInput";
import AddScheduleModal from "./add/AddScheduleModal";
import EditScheduleModal from "./edit/EditScheduleModal";
import DeleteScheduleModal from "./delete/DeleteScheduleModal";
import {
  isSameDay,
  todayStr,
  formatTime,
  getApiErrorMessage,
  roomFormatBadge,
  EARLIEST_SCHEDULE_HOUR,
  ruleMatchesDate,
  ruleStartMinutes,
  ruleEndMinutes,
  compareSchedulesByStatusThenStartTime,
} from "./shared/scheduleFormConstants";
import { SCHEDULE_LABELS } from "../../../constants/labels";

const PAGE_SIZE = 10;

// Timeline constants — matches the actual creation window (08:00-23:00) so the
// ruler never shows a permanently blank band where no schedule could ever exist.
const TIMELINE_START_HOUR = EARLIEST_SCHEDULE_HOUR; // 08:00
const TIMELINE_END_HOUR = 24;                       // 24:00 (movie duration can push past 23:00)
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
const TOTAL_MINUTES = TOTAL_HOURS * 60;
const PX_PER_MIN = 2; // 120px per hour on the horizontal axis
const HEADER_HEIGHT = 40;
const RAIL_WIDTH = 140; // sticky room rail on the left
const ROW_HEIGHT = 84; // one room per row

// Same horizontal "day timeline" form as the auto-generate preview: rooms as
// rows down a sticky left rail, time on the X axis, blocks positioned by time
// (left/width). Uniform block colour mirrors AutoGenerateSchedulePage so both
// pages read as one visual system.
const EVENT_BG = "#3467e0";
const EVENT_FG = "#ffffff";

// Minutes from the timeline's start hour for a given datetime string.
const minutesFromStart = (datetimeStr) => {
  if (!datetimeStr) return null;
  const d = new Date(datetimeStr);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes() - TIMELINE_START_HOUR * 60;
};

// Hour marks (label + horizontal pixel offset) for the axis and gridlines.
const hourMarks = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => ({
  label: `${String(TIMELINE_START_HOUR + i).padStart(2, "0")}:00`,
  left: i * 60 * PX_PER_MIN,
}));

// Navigate date by delta days
const offsetDate = (dateStr, delta) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ScheduleManagement = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [rooms, setRooms] = useState([]);
  const [schedulesOfDay, setSchedulesOfDay] = useState([]);
  const [goldenRules, setGoldenRules] = useState([]);
  const [movieNameMap, setMovieNameMap] = useState(new Map());
  const [activeMovies, setActiveMovies] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "table"

  // Table filters + pagination
  const [movieFilter, setMovieFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const hasActiveFilters = movieFilter !== "ALL" || roomFilter !== "ALL";
  const clearFilters = () => {
    setMovieFilter("ALL");
    setRoomFilter("ALL");
  };

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState({});
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);

  // Tooltip
  const [tooltip, setTooltip] = useState(null); // { schedule, x, y }

  const timelineRef = useRef(null);

  // ═══════════════════════════════════════════════
  //  DATA LOADING (N+2 request workaround)
  // ═══════════════════════════════════════════════
  const loadTimelineData = useCallback(async (date) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Step 1: get rooms
      const roomsRes = await CinemaRoomService.getAll();
      const allRooms = roomsRes.data?.data || roomsRes.data || [];
      const activeR = allRooms.filter((r) => r.status === "ACTIVE");
      setRooms(activeR);
      setActiveRooms(activeR);

      // Step 2: get schedules per room + all movies (parallel)
      const [scheduleResults, moviesRes] = await Promise.all([
        Promise.all(
          activeR.map((r) =>
            ScheduleService.getSchedulesByCinemaRoomId(r.cinemaRoomId).catch(() => ({ data: [] }))
          )
        ),
        MovieService.getAllMovies(),
      ]);

      // Build movie name map
      const allMovies = moviesRes.data?.data || moviesRes.data || [];
      const nameMap = new Map(allMovies.map((m) => [m.movieId, m.movieNameVn]));
      setMovieNameMap(nameMap);
      setActiveMovies(allMovies.filter((m) => m.status !== "INACTIVE"));

      // Merge all schedules
      const allSchedules = scheduleResults.flatMap((res) => {
        const d = res.data?.data || res.data || [];
        return Array.isArray(d) ? d : [];
      });

      // Filter by selected date
      const daySchedules = allSchedules.filter((s) => isSameDay(s.startTime, date));
      setSchedulesOfDay(daySchedules);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tải dữ liệu lịch chiếu."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimelineData(selectedDate);
  }, [selectedDate, loadTimelineData]);

  useEffect(() => {
    PricingService.getGoldenHours()
      .then((res) => {
        const rules = res.data?.data || res.data || [];
        setGoldenRules(rules.filter((r) => r.active !== false));
      })
      .catch(() => setGoldenRules([]));
  }, []);

  const handleRefresh = () => loadTimelineData(selectedDate);

  // Golden-hour bands for the selected day, positioned on the timeline's X axis —
  // live from GoldenHourConfig (PricingService.getGoldenHours()) so this always
  // reflects the current Pricing Config, not a hardcoded default.
  const goldenBands = useMemo(() => {
    return goldenRules
      .filter((r) => ruleMatchesDate(r, selectedDate))
      .map((r) => {
        const s = Math.max(ruleStartMinutes(r), TIMELINE_START_HOUR * 60) - TIMELINE_START_HOUR * 60;
        const e = Math.min(ruleEndMinutes(r), TIMELINE_END_HOUR * 60) - TIMELINE_START_HOUR * 60;
        return e > s ? { left: s * PX_PER_MIN, width: (e - s) * PX_PER_MIN } : null;
      })
      .filter(Boolean);
  }, [goldenRules, selectedDate]);

  // Group schedules by room for timeline
  const schedulesByRoom = useMemo(() => {
    const map = new Map();
    rooms.forEach((r) => map.set(r.cinemaRoomId, []));
    schedulesOfDay.forEach((s) => {
      const list = map.get(s.cinemaRoomId);
      if (list) list.push(s);
    });
    return map;
  }, [rooms, schedulesOfDay]);

  // Filtered schedules for the table view (movie/room filter dropdowns)
  const filteredSchedules = useMemo(() => {
    return schedulesOfDay
      .filter((s) => {
        const matchMovie = movieFilter === "ALL" || s.movieId === movieFilter;
        const matchRoom = roomFilter === "ALL" || String(s.cinemaRoomId) === String(roomFilter);
        return matchMovie && matchRoom;
      })
      .sort(compareSchedulesByStatusThenStartTime);
  }, [schedulesOfDay, movieFilter, roomFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / PAGE_SIZE));
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSchedules.slice(start, start + PAGE_SIZE);
  }, [filteredSchedules, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [movieFilter, roomFilter, selectedDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Click on empty timeline area → prefill Add modal (row layout: X axis = time)
  const handleTimelineClick = (e, room) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const clickedMinutes = Math.round((xRatio * TOTAL_MINUTES) / 30) * 30;
    const startHour = TIMELINE_START_HOUR + Math.floor(clickedMinutes / 60);
    const startMin = clickedMinutes % 60;
    const pad = (n) => String(n).padStart(2, "0");
    const startTime = `${selectedDate}T${pad(startHour)}:${pad(startMin)}`;
    setAddPrefill({ cinemaRoomId: room.cinemaRoomId, startTime });
    setIsAddOpen(true);
  };

  // Tạo suất chiếu mới nối tiếp ngay sau 1 suất đã có (cùng phòng),
  // startTime = endTime suất cũ + thời gian nghỉ (bufferTime, mặc định 30p)
  const handleQuickAddNext = (schedule) => {
    const base = new Date(schedule.endTime);
    if (isNaN(base.getTime())) return;
    const buffer = Number(schedule.bufferTime) || 30;
    const next = new Date(base.getTime() + buffer * 60000);
    const pad = (n) => String(n).padStart(2, "0");
    const startTime = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
    setAddPrefill({ cinemaRoomId: schedule.cinemaRoomId, startTime });
    setIsAddOpen(true);
  };

  // ═══════════════════════════════════════════════
  //  RENDER: Timeline block
  // ═══════════════════════════════════════════════
  const renderBlock = (schedule) => {
    const startMin = minutesFromStart(schedule.startTime);
    const endMin = minutesFromStart(schedule.endTime);
    if (startMin === null) return null;
    const clampedStart = Math.max(0, startMin);
    const clampedEnd = Math.min(endMin ?? clampedStart + 30, TOTAL_MINUTES);
    const left = clampedStart * PX_PER_MIN + 2;
    const width = Math.max(48, (clampedEnd - clampedStart) * PX_PER_MIN - 4);
    const movieName = movieNameMap.get(schedule.movieId) || `Movie #${schedule.movieId}`;
    const format = schedule.movieFormat || "";
    const isGolden = Number(schedule.goldenHourExtra) > 0;

    return (
      <div
        key={schedule.scheduleId}
        className="absolute rounded-lg px-2 py-1.5 overflow-hidden shadow-sm hover:shadow-md hover:z-20 cursor-pointer transition-shadow group"
        style={{
          left,
          width,
          top: 12,
          height: ROW_HEIGHT - 24,
          background: EVENT_BG,
          color: EVENT_FG,
          boxShadow: isGolden ? "0 0 0 2px rgba(192,0,0,.45)" : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setEditingSchedule(schedule);
        }}
        onMouseEnter={(e) => {
          setTooltip({ schedule, movieName, x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        }}
      >
        <div className="pointer-events-none">
          <p className="font-bold text-[11px] leading-tight truncate">{movieName}</p>
          <p className="text-[10px] opacity-80 mt-0.5 truncate">
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </p>
          {format && <p className="text-[10px] opacity-70 mt-0.5 truncate">{format}</p>}
          {isGolden && (
            <p className="text-[10px] opacity-90 mt-0.5 truncate font-semibold">
              Giờ vàng +{Number(schedule.goldenHourExtra).toLocaleString("vi-VN")}đ
            </p>
          )}
        </div>
        <button
          type="button"
          title="Tạo suất tiếp theo (cùng phòng, ngay sau suất này)"
          onClick={(e) => {
            e.stopPropagation();
            handleQuickAddNext(schedule);
          }}
          className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded bg-white/90 text-gray-700 hover:bg-white shadow-sm z-30"
        >
          <Plus size={11} />
        </button>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  //  RENDER: Table view
  // ═══════════════════════════════════════════════
  const thClass = "px-4 py-3 text-xs text-gray-500 font-bold whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-600";

  const renderTableView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {!isLoading && filteredSchedules.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchedules.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="suất chiếu"
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={`${thClass} w-16`}>{SCHEDULE_LABELS.columnIndex}</th>
              <th className={thClass}>Phim</th>
              <th className={thClass}>Phòng</th>
              <th className={thClass}>Định dạng</th>
              <th className={thClass}>Bắt đầu</th>
              <th className={thClass}>Kết thúc</th>
              <th className={`${thClass} text-center`}>Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-16 text-center text-[#C00000] font-black text-xl tracking-widest uppercase">
                  {hasActiveFilters ? SCHEDULE_LABELS.noScheduleMatchesFilter : "Không có suất chiếu nào trong ngày này!"}
                </td>
              </tr>
            ) : (
              paginatedSchedules.map((s, idx) => {
                const movieName = movieNameMap.get(s.movieId) || `Movie #${s.movieId}`;
                const room = rooms.find((r) => r.cinemaRoomId === s.cinemaRoomId);
                return (
                  <tr key={s.scheduleId} className="hover:bg-gray-50 transition-colors">
                    <td className={`${tdClass} text-xs text-gray-500`}>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className={tdClass}>
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]">{movieName}</p>
                    </td>
                    <td className={tdClass}>{room?.cinemaRoomName || `Phòng #${s.cinemaRoomId}`}</td>
                    <td className={tdClass}>
                      {s.movieFormat
                        ? <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700">{s.movieFormat}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className={`${tdClass} text-xs`}>{formatTime(s.startTime)}</td>
                    <td className={`${tdClass} text-xs`}>{formatTime(s.endTime)}</td>
                    <td className={tdClass}>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingSchedule(s)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md"
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSchedule(s)}
                          className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-md"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredSchedules.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchedules.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="suất chiếu"
        />
      )}
    </div>
  );

  // ═══════════════════════════════════════════════
  //  RENDER: Timeline view
  // ═══════════════════════════════════════════════
  // Row-based day timeline — rooms as rows down a sticky left rail, time on
  // the X axis, blocks positioned by time (left/width). Same "form" as the
  // auto-generate preview's expected-schedule timeline.
  const renderTimelineView = () => {
    if (rooms.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center text-gray-400">
          Không có phòng chiếu nào.
        </div>
      );
    }
    const trackWidth = TOTAL_MINUTES * PX_PER_MIN;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div ref={timelineRef} className="overflow-auto max-h-[65vh]">
          <div className="flex" style={{ minWidth: RAIL_WIDTH + trackWidth }}>
            {/* Room rail (sticky left) */}
            <div
              className="flex-none sticky left-0 z-20 bg-white border-r border-gray-100"
              style={{ width: RAIL_WIDTH }}
            >
              <div
                className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center px-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider"
                style={{ height: HEADER_HEIGHT }}
              >
                Phòng
              </div>
              {rooms.map((room) => (
                <div
                  key={room.cinemaRoomId}
                  className="flex flex-col justify-center gap-1 px-3.5 border-b border-gray-100"
                  style={{ height: ROW_HEIGHT }}
                >
                  <p className="text-[12.5px] font-bold text-gray-700 truncate" title={room.cinemaRoomName}>
                    {room.cinemaRoomName}
                  </p>
                  {roomFormatBadge(room) && (
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 w-fit">
                      {roomFormatBadge(room)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Time area */}
            <div className="relative flex-1" style={{ minWidth: trackWidth }}>
              {/* Hour axis (sticky top) */}
              <div
                className="sticky top-0 z-10 bg-white border-b border-gray-100"
                style={{ height: HEADER_HEIGHT }}
              >
                {hourMarks.map((h) => (
                  <div
                    key={h.label}
                    className="absolute top-0 bottom-0 flex items-center pl-1.5 border-l border-gray-100 text-[10px] text-gray-400 font-medium"
                    style={{ left: h.left }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>

              {/* Room tracks */}
              <div className="relative">
                {goldenBands.map((band, i) => (
                  <div
                    key={`golden-${i}`}
                    className="absolute inset-y-0 bg-[#C00000]/[0.06] pointer-events-none z-0"
                    style={{ left: band.left, width: band.width }}
                  />
                ))}
                {hourMarks.map((h) => (
                  <div
                    key={`line-${h.label}`}
                    className="absolute inset-y-0 border-l border-gray-100 pointer-events-none"
                    style={{ left: h.left }}
                  />
                ))}
                {rooms.map((room) => {
                  const roomSchedules = schedulesByRoom.get(room.cinemaRoomId) || [];
                  return (
                    <div
                      key={room.cinemaRoomId}
                      className="relative border-b border-gray-100 cursor-crosshair"
                      style={{ height: ROW_HEIGHT }}
                      onClick={(e) => handleTimelineClick(e, room)}
                    >
                      {roomSchedules.map((s) => renderBlock(s))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format selected date for display
  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans -m-8 md:-m-10">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 gap-4">
        <h2 className="text-xl font-bold text-gray-800 shrink-0">Quản lý lịch chiếu</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date navigator */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              aria-label="Ngày trước"
            >
              <ChevronLeft size={16} />
            </button>
            <DateInput
              name="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-[92px]"
              showIcon={false}
            />
            <button
              type="button"
              onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              aria-label="Ngày sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "timeline"
                  ? "bg-white text-[#C00000] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays size={14} />
              Dòng thời gian
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#C00000] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Table2 size={14} />
              Bảng
            </button>
          </div>

          {/* Auto-generate */}
          <button
            type="button"
            onClick={() => navigate("/admin/schedules/auto-generate")}
            className="flex items-center gap-2 bg-white border border-[#C00000] text-[#C00000] hover:bg-red-50 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Wand2 size={16} />
            Tạo tự động
          </button>

          {/* Add */}
          <button
            type="button"
            onClick={() => {
              const pad = (n) => String(n).padStart(2, "0");
              setAddPrefill({
                startTime: `${selectedDate}T${pad(EARLIEST_SCHEDULE_HOUR)}:00`,
              });
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            Thêm suất chiếu
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Date display */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Lịch chiếu ngày{" "}
            <span className="font-semibold text-gray-800 capitalize">{displayDate}</span>
            {" "}—{" "}
            <span className="font-semibold text-[#C00000]">{schedulesOfDay.length} suất chiếu</span>
          </p>
          {viewMode === "timeline" && goldenBands.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C00000]/25 inline-block" />
              Giờ vàng
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {viewMode === "table" && (
          <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 flex flex-wrap items-center gap-6">
            <Filter size={18} className="text-gray-400 shrink-0" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">{SCHEDULE_LABELS.labelMovie}</span>
              <select
                value={movieFilter}
                onChange={(e) => setMovieFilter(e.target.value)}
                className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 max-w-[180px]"
              >
                <option value="ALL">{SCHEDULE_LABELS.filterAll}</option>
                {activeMovies.map((m) => (
                  <option key={m.movieId} value={m.movieId}>{m.movieNameVn}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">{SCHEDULE_LABELS.labelRoom}</span>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                <option value="ALL">{SCHEDULE_LABELS.filterAll}</option>
                {rooms.map((r) => (
                  <option key={r.cinemaRoomId} value={r.cinemaRoomId}>{r.cinemaRoomName}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#C00000] transition-colors cursor-pointer"
              >
                <X size={14} />
                {SCHEDULE_LABELS.clearFilters}
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : viewMode === "timeline" ? (
          renderTimelineView()
        ) : (
          renderTableView()
        )}

        {viewMode === "timeline" && !isLoading && (
          <p className="mt-2 text-xs text-gray-400">
            💡 Click vào ô trống để thêm suất chiếu tại khung giờ đó. Click vào block để chỉnh sửa. Trỏ vào block và bấm dấu "+" góc trên phải để tạo suất tiếp theo ngay sau đó.
          </p>
        )}
      </main>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 space-y-0.5"
          style={{ top: tooltip.y + 12, left: tooltip.x + 12, maxWidth: 200 }}
        >
          <p className="font-bold truncate">{tooltip.movieName}</p>
          <p className="text-gray-300">
            {rooms.find((r) => r.cinemaRoomId === tooltip.schedule.cinemaRoomId)?.cinemaRoomName || "—"}
          </p>
          <p className="text-gray-300">
            {formatTime(tooltip.schedule.startTime)} – {formatTime(tooltip.schedule.endTime)}
          </p>
          {tooltip.schedule.movieFormat && (
            <p className="text-indigo-300">{tooltip.schedule.movieFormat}</p>
          )}
        </div>
      )}

      {/* Modals */}
      {isAddOpen && (
        <AddScheduleModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleRefresh}
          movies={activeMovies}
          rooms={activeRooms}
          prefillRoomId={addPrefill.cinemaRoomId}
          prefillStartTime={addPrefill.startTime}
        />
      )}

      {editingSchedule && (
        <EditScheduleModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={handleRefresh}
          movies={activeMovies}
          rooms={activeRooms}
        />
      )}

      {deletingSchedule && (
        <DeleteScheduleModal
          schedule={deletingSchedule}
          movieName={movieNameMap.get(deletingSchedule.movieId)}
          onClose={() => setDeletingSchedule(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
