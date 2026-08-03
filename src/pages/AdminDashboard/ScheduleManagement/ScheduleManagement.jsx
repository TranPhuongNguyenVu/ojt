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
  AlertTriangle,
  Search,
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
import ScheduleDetailModal from "./detail/ScheduleDetailModal";
import ScheduleStatusBadge from "./shared/ScheduleStatusBadge";
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
  DISPLAY_STATUS_META,
} from "./shared/scheduleFormConstants";
import {
  minutesFromReference,
  extendAxisMinutes,
  buildHourMarks,
  computeBlockGeometry,
  computeOverlapIds,
} from "./shared/timelineGeometry";
import { SCHEDULE_LABELS } from "../../../constants/labels";

const PAGE_SIZE = 10;

// Timeline constants — matches the actual creation window (08:00-23:00) as the
// default band; the axis extends further right on days with late-running
// shows (see axisTotalMinutes below) instead of hiding them past a hard cutoff.
const TIMELINE_START_HOUR = EARLIEST_SCHEDULE_HOUR; // 08:00
const TIMELINE_END_HOUR = 24;                       // default axis end (24:00)
const BASE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
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
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [movieSearchKeyword, setMovieSearchKeyword] = useState("");
  // null = no active search (show all movies); Set = movieIds matched by the server-side search
  const [movieSearchIds, setMovieSearchIds] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const movieSearchTimeoutRef = useRef(null);

  const hasActiveFilters = roomFilter !== "ALL" || movieSearchKeyword.trim() !== "";
  const clearFilters = () => {
    setRoomFilter("ALL");
    setMovieSearchKeyword("");
    setMovieSearchIds(null);
  };

  // Same debounced server-side search pattern as MovieManagement's "Tìm kiếm phim":
  // resolve the typed name to matching movieIds via MovieService.searchMovies, then
  // filter the already-loaded day's schedules by that id set client-side.
  const handleMovieSearchChange = (e) => {
    const value = e.target.value;
    setMovieSearchKeyword(value);
    if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    movieSearchTimeoutRef.current = setTimeout(() => {
      const keyword = value.trim();
      if (!keyword) {
        setMovieSearchIds(null);
        return;
      }
      MovieService.searchMovies(keyword)
        .then((res) => {
          const matched = res.data?.data || res.data || [];
          setMovieSearchIds(new Set(matched.map((m) => m.movieId)));
        })
        .catch(() => setMovieSearchIds(new Set()));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (movieSearchTimeoutRef.current) clearTimeout(movieSearchTimeoutRef.current);
    };
  }, []);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState({});
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [viewingSchedule, setViewingSchedule] = useState(null);

  const openEditFromDetail = (schedule) => {
    setViewingSchedule(null);
    setEditingSchedule(schedule);
  };

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
      const activeR = allRooms
        .filter((r) => r.status === "ACTIVE")
        .sort((a, b) => a.cinemaRoomName.localeCompare(b.cinemaRoomName, "vi", { numeric: true }));
      setRooms(activeR);
      setActiveRooms(activeR);

      // Step 2: get schedules per room + all movies + schedulable movies (parallel)
      const [scheduleResults, moviesRes, schedulableMoviesRes] = await Promise.all([
        Promise.all(
          activeR.map((r) =>
            ScheduleService.getSchedulesByCinemaRoomId(r.cinemaRoomId).catch(() => ({ data: [] }))
          )
        ),
        MovieService.getAllMovies(),
        MovieService.getSchedulableMovies(),
      ]);

      // Build movie name map from the full list so schedules referencing a
      // since-deleted movie still resolve a name (history must stay readable).
      const allMovies = moviesRes.data?.data || moviesRes.data || [];
      const nameMap = new Map(allMovies.map((m) => [m.movieId, m.movieNameVn]));
      setMovieNameMap(nameMap);
      // The create/edit picker only offers movies BE already filtered as schedulable.
      setActiveMovies(schedulableMoviesRes.data?.data || schedulableMoviesRes.data || []);

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

  // Axis zero = selectedDate at TIMELINE_START_HOUR:00. Every block's minute
  // offset is a real millisecond diff from this instant (see timelineGeometry),
  // so a show that runs past midnight resolves to a larger, correctly ordered
  // end offset instead of wrapping to a smaller same-day hour/minute value.
  const axisZero = useMemo(() => new Date(`${selectedDate}T${String(TIMELINE_START_HOUR).padStart(2, "0")}:00:00`), [selectedDate]);

  const scheduleMinutes = useMemo(() => {
    const map = new Map();
    schedulesOfDay.forEach((s) => {
      map.set(s.scheduleId, {
        startMin: minutesFromReference(s.startTime, axisZero),
        endMin: minutesFromReference(s.endTime, axisZero),
      });
    });
    return map;
  }, [schedulesOfDay, axisZero]);

  // Axis stretches past the default 08:00-24:00 window when a show's real end
  // time pushes beyond it, instead of clipping it out of view.
  const axisTotalMinutes = useMemo(() => {
    const ends = Array.from(scheduleMinutes.values()).map((m) => m.endMin);
    return extendAxisMinutes(BASE_TOTAL_MINUTES, ends);
  }, [scheduleMinutes]);

  const hourMarks = useMemo(
    () => buildHourMarks(TIMELINE_START_HOUR * 60, axisTotalMinutes, PX_PER_MIN),
    [axisTotalMinutes]
  );

  // Ids of schedules that overlap another schedule in the same room — an admin
  // data problem that must stay visible, not silently stack under hover:z-20.
  const overlapIds = useMemo(() => {
    const ids = new Set();
    schedulesByRoom.forEach((roomSchedules) => {
      const items = roomSchedules.map((s) => ({ id: s.scheduleId, ...scheduleMinutes.get(s.scheduleId) }));
      computeOverlapIds(items).forEach((id) => ids.add(id));
    });
    return ids;
  }, [schedulesByRoom, scheduleMinutes]);

  // Filtered schedules for the table view (room dropdown + movie name search)
  const filteredSchedules = useMemo(() => {
    return schedulesOfDay
      .filter((s) => {
        const matchMovie = movieSearchIds === null || movieSearchIds.has(s.movieId);
        const matchRoom = roomFilter === "ALL" || String(s.cinemaRoomId) === String(roomFilter);
        return matchMovie && matchRoom;
      })
      .sort(compareSchedulesByStatusThenStartTime);
  }, [schedulesOfDay, movieSearchIds, roomFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / PAGE_SIZE));
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSchedules.slice(start, start + PAGE_SIZE);
  }, [filteredSchedules, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [movieSearchIds, roomFilter, selectedDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Click on empty timeline area → prefill Add modal (row layout: X axis = time)
  const handleTimelineClick = (e, room) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const clickedMinutes = Math.round((xRatio * axisTotalMinutes) / 30) * 30;
    const startHour = TIMELINE_START_HOUR + Math.floor(clickedMinutes / 60);
    const startMin = clickedMinutes % 60;
    const pad = (n) => String(n).padStart(2, "0");
    const dayOffset = Math.floor(startHour / 24);
    const dateForClick = dayOffset > 0 ? offsetDate(selectedDate, dayOffset) : selectedDate;
    const startTime = `${dateForClick}T${pad(startHour % 24)}:${pad(startMin)}`;
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
  const NARROW_BLOCK_THRESHOLD_PX = 56;

  const renderBlock = (schedule) => {
    const minutes = scheduleMinutes.get(schedule.scheduleId);
    if (!minutes) return null;
    const geometry = computeBlockGeometry(minutes.startMin, minutes.endMin, axisTotalMinutes, PX_PER_MIN);
    if (!geometry) return null;
    const { left, width, isInvalid } = geometry;
    const movieName = movieNameMap.get(schedule.movieId) || `Movie #${schedule.movieId}`;
    const format = schedule.movieFormat || "";
    const isGolden = Number(schedule.goldenHourExtra) > 0;
    const hasOverlap = overlapIds.has(schedule.scheduleId);
    const isNarrow = width < NARROW_BLOCK_THRESHOLD_PX;
    const statusColor = DISPLAY_STATUS_META[schedule.displayStatus]?.dotVar || EVENT_BG;
    const tooltipText = `${movieName} · ${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}${format ? ` · ${format}` : ""}`;

    return (
      <div
        key={schedule.scheduleId}
        title={isNarrow ? tooltipText : undefined}
        className={`absolute rounded-lg px-2 py-1.5 overflow-hidden shadow-sm hover:shadow-md hover:z-20 cursor-pointer transition-shadow group ${
          isInvalid ? "border-2 border-red-500" : hasOverlap ? "border-2 border-amber-500" : ""
        }`}
        style={{
          left,
          width,
          top: 12,
          height: ROW_HEIGHT - 24,
          background: isInvalid
            ? "repeating-linear-gradient(45deg, #dc2626, #dc2626 6px, #b91c1c 6px, #b91c1c 12px)"
            : hasOverlap
              ? "repeating-linear-gradient(45deg, #3467e0, #3467e0 6px, #2c56ba 6px, #2c56ba 12px)"
              : statusColor,
          color: EVENT_FG,
          boxShadow: isGolden ? "0 0 0 2px color-mix(in srgb, var(--cine-gold) 70%, transparent)" : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setViewingSchedule(schedule);
        }}
        onMouseEnter={(e) => {
          setTooltip({ schedule, movieName, x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        }}
      >
        {(isInvalid || hasOverlap) && (
          <AlertTriangle
            size={12}
            className={`absolute top-1 left-1 ${isInvalid ? "text-red-100" : "text-amber-200"}`}
          />
        )}
        {!isNarrow && (
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
        )}
        <button
          type="button"
          title="Tạo suất tiếp theo (cùng phòng, ngay sau suất này)"
          onClick={(e) => {
            e.stopPropagation();
            handleQuickAddNext(schedule);
          }}
          className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 shadow-sm z-30"
        >
          <Plus size={11} />
        </button>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  //  RENDER: Table view
  // ═══════════════════════════════════════════════
  const thClass = "px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-600 dark:text-gray-300";

  const renderTableView = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
              <th className={`${thClass} w-16`}>{SCHEDULE_LABELS.columnIndex}</th>
              <th className={thClass}>Phim</th>
              <th className={thClass}>Phòng</th>
              <th className={thClass}>Định dạng</th>
              <th className={thClass}>Bắt đầu</th>
              <th className={thClass}>Kết thúc</th>
              <th className={thClass}>{SCHEDULE_LABELS.columnStatus}</th>
              <th className={`${thClass} text-center`}>Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-16 text-center text-[#C00000] font-black text-xl tracking-widest uppercase">
                  {hasActiveFilters ? SCHEDULE_LABELS.noScheduleMatchesFilter : "Không có suất chiếu nào trong ngày này!"}
                </td>
              </tr>
            ) : (
              paginatedSchedules.map((s, idx) => {
                const movieName = movieNameMap.get(s.movieId) || `Movie #${s.movieId}`;
                const room = rooms.find((r) => r.cinemaRoomId === s.cinemaRoomId);
                return (
                  <tr
                    key={s.scheduleId}
                    onClick={() => setViewingSchedule(s)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    <td className={`${tdClass} text-xs text-gray-500 dark:text-gray-400`}>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className={tdClass}>
                      <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{movieName}</p>
                    </td>
                    <td className={tdClass}>{room?.cinemaRoomName || `Phòng #${s.cinemaRoomId}`}</td>
                    <td className={tdClass}>
                      {s.movieFormat
                        ? <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">{s.movieFormat}</span>
                        : <span className="text-gray-400 dark:text-gray-500">—</span>
                      }
                    </td>
                    <td className={`${tdClass} text-xs`}>{formatTime(s.startTime)}</td>
                    <td className={`${tdClass} text-xs`}>{formatTime(s.endTime)}</td>
                    <td className={tdClass}>
                      <ScheduleStatusBadge displayStatus={s.displayStatus} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSchedule(s);
                          }}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md"
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSchedule(s);
                          }}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 py-16 text-center text-gray-400 dark:text-gray-500">
          Không có phòng chiếu nào.
        </div>
      );
    }
    const trackWidth = axisTotalMinutes * PX_PER_MIN;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div ref={timelineRef} className="overflow-auto max-h-[65vh]">
          <div className="flex" style={{ minWidth: RAIL_WIDTH + trackWidth }}>
            {/* Room rail (sticky left) */}
            <div
              className="flex-none sticky left-0 z-20 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800"
              style={{ width: RAIL_WIDTH }}
            >
              <div
                className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                style={{ height: HEADER_HEIGHT }}
              >
                Phòng
              </div>
              {rooms.map((room) => (
                <div
                  key={room.cinemaRoomId}
                  className="flex flex-col justify-center gap-1 px-3.5 border-b border-gray-100 dark:border-gray-800"
                  style={{ height: ROW_HEIGHT }}
                >
                  <p className="text-[12.5px] font-bold text-gray-700 dark:text-gray-300 truncate" title={room.cinemaRoomName}>
                    {room.cinemaRoomName}
                  </p>
                  {roomFormatBadge(room) && (
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 w-fit">
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
                className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
                style={{ height: HEADER_HEIGHT }}
              >
                {hourMarks.map((h) => (
                  <div
                    key={h.left}
                    className={`absolute top-0 bottom-0 flex items-center pl-1.5 text-[10px] font-medium ${
                      h.isMidnight ? "border-l-2 border-red-300 dark:border-red-500/50 text-red-500 dark:text-red-400 font-bold" : "border-l border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500"
                    }`}
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
                    className="absolute inset-y-0 pointer-events-none z-0"
                    style={{
                      left: band.left,
                      width: band.width,
                      backgroundColor: "color-mix(in srgb, var(--cine-gold) 12%, transparent)",
                    }}
                  />
                ))}
                {hourMarks.map((h) => (
                  <div
                    key={`line-${h.left}`}
                    className={`absolute inset-y-0 pointer-events-none ${h.isMidnight ? "border-l-2 border-red-300 dark:border-red-500/50" : "border-l border-gray-100 dark:border-gray-800"}`}
                    style={{ left: h.left }}
                  />
                ))}
                {rooms.map((room) => {
                  const roomSchedules = schedulesByRoom.get(room.cinemaRoomId) || [];
                  return (
                    <div
                      key={room.cinemaRoomId}
                      className="relative border-b border-gray-100 dark:border-gray-800 cursor-crosshair"
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
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white shrink-0">Quản lý lịch chiếu</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date navigator */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Ngày trước"
            >
              <ChevronLeft size={16} />
            </button>
            <DateInput
              name="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer w-[92px]"
              showIcon={false}
            />
            <button
              type="button"
              onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Ngày sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-gray-900 text-[#C00000] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                  ? "bg-white dark:bg-gray-900 text-[#C00000] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
            className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-[#C00000] text-[#C00000] hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shrink-0"
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lịch chiếu ngày{" "}
            <span className="font-semibold text-gray-800 dark:text-white capitalize">{displayDate}</span>
            {" "}—{" "}
            <span className="font-semibold text-[#C00000]">{schedulesOfDay.length} suất chiếu</span>
          </p>
          {viewMode === "timeline" && (
            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              {["SCHEDULED", "SHOWING", "ENDED"].map((key) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: DISPLAY_STATUS_META[key].dotVar }}
                  />
                  {SCHEDULE_LABELS[DISPLAY_STATUS_META[key].labelKey]}
                </span>
              ))}
              {goldenBands.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: "var(--cine-gold)" }}
                  />
                  Giờ vàng
                </span>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {viewMode === "table" && (
          <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-5 py-4 flex flex-wrap items-center gap-6">
            <Filter size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{SCHEDULE_LABELS.labelRoom}</span>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
                <option value="ALL">{SCHEDULE_LABELS.filterAll}</option>
                {rooms.map((r) => (
                  <option key={r.cinemaRoomId} value={r.cinemaRoomId}>{r.cinemaRoomName}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={movieSearchKeyword}
                onChange={handleMovieSearchChange}
                maxLength={100}
                placeholder={SCHEDULE_LABELS.searchMoviePlaceholder}
                className="bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg pl-8 pr-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-52"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#C00000] transition-colors cursor-pointer"
              >
                <X size={14} />
                {SCHEDULE_LABELS.clearFilters}
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        ) : viewMode === "timeline" ? (
          renderTimelineView()
        ) : (
          renderTableView()
        )}

        {viewMode === "timeline" && !isLoading && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            💡 Click vào ô trống để thêm suất chiếu tại khung giờ đó. Click vào block để chỉnh sửa. Trỏ vào block và bấm dấu "+" góc trên phải để tạo suất tiếp theo ngay sau đó.
          </p>
        )}
      </main>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl px-3 py-2 space-y-0.5"
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

      {viewingSchedule && (
        <ScheduleDetailModal
          schedule={viewingSchedule}
          movieName={movieNameMap.get(viewingSchedule.movieId)}
          roomName={rooms.find((r) => r.cinemaRoomId === viewingSchedule.cinemaRoomId)?.cinemaRoomName}
          onClose={() => setViewingSchedule(null)}
          onEdit={openEditFromDetail}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
