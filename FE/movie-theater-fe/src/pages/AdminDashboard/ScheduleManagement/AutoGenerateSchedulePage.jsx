import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarClock,
  CalendarPlus,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import MovieService from "../../../services/MovieService";
import CinemaRoomService from "../../../services/CinemaRoomService";
import ScheduleService from "../../../services/ScheduleService";
import PricingService from "../../../services/PricingService";
import DateInput from "../../../components/DateInput";
import {
  formatDateTime,
  getApiErrorMessage,
  roomAcceptsVersion,
  roomFormatBadge,
  translateScheduleReason,
  fieldInputClass,
  fieldLabelClass,
  ruleMatchesDate,
  ruleStartMinutes,
  ruleEndMinutes,
  findGoldenRule,
} from "./shared/scheduleFormConstants";
import {
  extendAxisMinutes,
  buildHourMarks,
  computeBlockGeometry,
  computeOverlapIds,
} from "./shared/timelineGeometry";
import { computeFormatWeights } from "./autoGenerate/movieFormatSettings";
import MovieFormatSettingsPanel from "./autoGenerate/MovieFormatSettingsPanel";

const MAX_DAYS_AHEAD = 10;
const MAX_RANGE_DAYS = 7; // dateTo can be at most 6 days after dateFrom (7-day window)
const HOUR = 60;
const PX_PER_MIN = 2; // 120px per hour on the horizontal axis
const RAIL_WIDTH = 140; // sticky room rail on the left
const AXIS_HEIGHT = 38; // hour axis row
const ROW_HEIGHT = 84; // one room per row

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Uniform block colour for every showtime, matching the design mockup.
const EVENT_BG = "#3467e0";
const EVENT_FG = "#ffffff";

const pad = (n) => String(n).padStart(2, "0");

const toDateStr = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDaysStr = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

const tomorrowStr = () => addDaysStr(toDateStr(new Date()), 1);
const maxStartDateStr = () => addDaysStr(toDateStr(new Date()), MAX_DAYS_AHEAD);

const timeToMin = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

// "2026-07-16T18:30:00" -> minutes since midnight
const isoToMin = (iso) => {
  const time = (iso || "").split("T")[1] || "00:00";
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

const isoToDate = (iso) => (iso || "").split("T")[0];

const minToLabel = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const minToHHMMSS = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`;

// "2026-07-17" -> "17/07/2026"
const isoDateToLabel = (iso) => (iso || "").split("-").reverse().join("/");

// Builds a valid ISO datetime for a minute offset that may cross midnight
// (e.g. a 22:30 show ending 00:58 must become <nextDay>T00:58:00, never T24:58).
const minToDateTime = (dateStr, totalMin) =>
  totalMin >= 1440
    ? `${addDaysStr(dateStr, 1)}T${minToHHMMSS(totalMin % 1440)}`
    : `${dateStr}T${minToHHMMSS(totalMin)}`;

/** Enumerate dateStr for every day in [startStr, endStr], capped at MAX_RANGE_DAYS days. */
const buildDateRange = (startStr, endStr) => {
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return [startStr];
  }
  const out = [];
  const cur = new Date(start);
  let guard = 0;
  while (cur <= end && guard < MAX_RANGE_DAYS) {
    out.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
};

const roomKey = (dateStr, roomId) => `${dateStr}|${roomId}`;

const defaultForm = () => ({
  startDate: tomorrowStr(),
  endDate: addDaysStr(tomorrowStr(), MAX_RANGE_DAYS - 1),
  openTime: "08:00",
  closeTime: "23:00",
  showsPerDayPerRoom: 6,
  maxMoviesPerRoom: 2,
  gapCleanup: 30,
});

const AutoGenerateSchedulePage = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [goldenRules, setGoldenRules] = useState([]);
  const [selectedMovieIds, setSelectedMovieIds] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [allowInsertRoomIds, setAllowInsertRoomIds] = useState([]); // roomIds allowed to insert into a day they already have a schedule
  const [movieRatio, setMovieRatio] = useState({}); // movieId -> ratio 1-5
  const [movieSettings, setMovieSettings] = useState({}); // movieId -> { formatRatios: { versionId: ratio }, roomIds: number[] }
  const [expandedMovieIds, setExpandedMovieIds] = useState([]); // movieIds whose inline config panel is open
  const [form, setForm] = useState(defaultForm());

  const [preview, setPreview] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  // `${dateStr}|${roomId}` -> array of local candidate objects, overriding generated events for that cell.
  const [customEvents, setCustomEvents] = useState({});
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [failedItems, setFailedItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [moviesRes, roomsRes] = await Promise.all([
          MovieService.getSchedulableMovies(),
          CinemaRoomService.getAll(),
        ]);
        const allMovies = moviesRes.data?.data || moviesRes.data || [];
        const allRooms = roomsRes.data?.data || roomsRes.data || [];
        setMovies(allMovies.filter((m) => m.versions?.length));
        setRooms(
          allRooms.filter((r) => r.status === "ACTIVE" && r.formats?.length)
        );
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Không thể tải phim và phòng chiếu."));
      }
      try {
        const goldenRes = await PricingService.getGoldenHours();
        const rules = goldenRes.data?.data || goldenRes.data || [];
        setGoldenRules(rules.filter((r) => r.active !== false));
      } catch {
        setGoldenRules([]);
      }
    };
    load();
  }, []);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleId = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const expandMovie = (movieId) =>
    setExpandedMovieIds((prev) => (prev.includes(movieId) ? prev : [...prev, movieId]));

  const toggleExpandedMovie = (movieId) =>
    setExpandedMovieIds((prev) => (prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]));

  // Ticking the checkbox opens the config panel immediately (not just clicking the name) so an
  // admin can't select a movie and unknowingly leave it on default ratio/format settings.
  const onToggleMovieSelected = (movieId) => {
    const willSelect = !selectedMovieIds.includes(movieId);
    toggleId(selectedMovieIds, setSelectedMovieIds, movieId);
    if (willSelect) {
      expandMovie(movieId);
    }
  };

  const effectiveRatio = (movie) => movieRatio[movie.movieId] ?? 1;

  const ensureMovieSettings = (movieId, movie) => (prev) => {
    if (prev[movieId]) return prev;
    const formatRatios = {};
    (movie.versions || []).forEach((v) => {
      formatRatios[String(v.versionId)] = 1;
    });
    return { ...prev, [movieId]: { formatRatios, roomIds: [] } };
  };

  const onChangeFormatRatio = (movie, versionId, ratioValue) =>
    setMovieSettings((prev) => {
      const seeded = ensureMovieSettings(movie.movieId, movie)(prev);
      const cur = seeded[movie.movieId];
      const formatRatios = { ...cur.formatRatios, [String(versionId)]: ratioValue };
      const activeIds = computeFormatWeights(movie, formatRatios).map((f) => f.versionId);
      const roomIds = cur.roomIds.filter((rid) => {
        const room = rooms.find((r) => r.cinemaRoomId === rid);
        return room && activeIds.some((vid) => roomAcceptsVersion(room, vid));
      });
      return { ...seeded, [movie.movieId]: { formatRatios, roomIds } };
    });

  const onToggleFormat = (movie, versionId, included) =>
    setMovieSettings((prev) => {
      const seeded = ensureMovieSettings(movie.movieId, movie)(prev);
      const cur = seeded[movie.movieId];
      const activeCount = computeFormatWeights(movie, cur.formatRatios).length;
      if (!included && activeCount <= 1) return seeded;
      const formatRatios = { ...cur.formatRatios };
      if (included) {
        formatRatios[String(versionId)] = formatRatios[String(versionId)] ?? 1;
      } else {
        delete formatRatios[String(versionId)];
      }
      const activeIds = computeFormatWeights(movie, formatRatios).map((f) => f.versionId);
      const roomIds = cur.roomIds.filter((rid) => {
        const room = rooms.find((r) => r.cinemaRoomId === rid);
        return room && activeIds.some((vid) => roomAcceptsVersion(room, vid));
      });
      return { ...seeded, [movie.movieId]: { formatRatios, roomIds } };
    });

  const onToggleRoom = (movie, roomId) =>
    setMovieSettings((prev) => {
      const seeded = ensureMovieSettings(movie.movieId, movie)(prev);
      const cur = seeded[movie.movieId];
      const has = cur.roomIds.includes(roomId);
      return {
        ...seeded,
        [movie.movieId]: { ...cur, roomIds: has ? cur.roomIds.filter((r) => r !== roomId) : [...cur.roomIds, roomId] },
      };
    });

  const getMovieRoomIds = (movie) => {
    const custom = movieSettings[movie.movieId]?.roomIds;
    return custom && custom.length ? custom : selectedRoomIds;
  };

  const onStartDateChange = (raw) => {
    let v = raw;
    const minS = tomorrowStr();
    const maxS = maxStartDateStr();
    if (v < minS) v = minS;
    if (v > maxS) v = maxS;
    setForm((prev) => {
      const maxE = addDaysStr(v, MAX_RANGE_DAYS - 1);
      let endDate = prev.endDate;
      if (endDate < v) endDate = v;
      if (endDate > maxE) endDate = maxE;
      return { ...prev, startDate: v, endDate };
    });
  };
  const onEndDateChange = (raw) => {
    let v = raw;
    const minE = form.startDate;
    const maxE = addDaysStr(form.startDate, MAX_RANGE_DAYS - 1);
    if (v < minE) v = minE;
    if (v > maxE) v = maxE;
    updateField("endDate", v);
  };
  const onOpenTimeChange = (raw) => {
    let v = raw;
    if (v) {
      const m = timeToMin(v);
      if (m < 480) v = "08:00";
      else if (m > 660) v = "11:00";
    }
    updateField("openTime", v);
  };

  const buildRequest = () => {
    const movieRatios = {};
    const movieFormatRatios = {};
    const movieRoomIds = {};
    movies.forEach((m) => {
      movieRatios[m.movieId] = effectiveRatio(m);
    });
    selectedMovieIds.forEach((movieId) => {
      const s = movieSettings[movieId];
      if (s?.formatRatios && Object.keys(s.formatRatios).length) {
        movieFormatRatios[movieId] = s.formatRatios;
      }
      if (s?.roomIds?.length) {
        movieRoomIds[movieId] = s.roomIds;
      }
    });
    return {
      startDate: form.startDate,
      endDate: form.endDate,
      openTime: form.openTime,
      closeTime: form.closeTime,
      showsPerDayPerRoom: Number(form.showsPerDayPerRoom),
      maxMoviesPerRoom: Number(form.maxMoviesPerRoom),
      gapCleanup: Number(form.gapCleanup),
      allowInsertIntoBusyDayRoomIds: allowInsertRoomIds,
      movieIds: selectedMovieIds,
      roomIds: selectedRoomIds,
      movieRatios,
      movieFormatRatios,
      movieRoomIds,
    };
  };

  // Manual preview: the "Cập nhật" button re-runs the server preview on demand.
  // A sequence counter drops stale responses that arrive out of order.
  const previewSeq = useRef(0);

  const hasScope = selectedMovieIds.length > 0 && selectedRoomIds.length > 0;
  const hasValidRange =
    form.startDate <= form.endDate && form.openTime && form.closeTime && form.openTime < form.closeTime;

  const handleUpdatePreview = async () => {
    if (!hasScope || !hasValidRange) return;
    const seq = ++previewSeq.current;
    setIsPreviewing(true);
    try {
      const res = await ScheduleService.autoGeneratePreview(buildRequest());
      if (seq !== previewSeq.current) return;
      setPreview(res.data?.data || res.data || null);
      setCustomEvents({});
      setErrorMessage("");
      setFailedItems([]);
    } catch (error) {
      if (seq !== previewSeq.current) return;
      setPreview(null);
      setErrorMessage(getApiErrorMessage(error, "Không thể tạo bản xem trước."));
    } finally {
      if (seq === previewSeq.current) setIsPreviewing(false);
    }
  };

  // Scope cleared: drop any stale preview instead of waiting for a manual update.
  useEffect(() => {
    if (!hasScope) {
      previewSeq.current++;
      setPreview(null);
      setCustomEvents({});
      setIsPreviewing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMovieIds, selectedRoomIds]);

  // Movies whose showing window ([fromDate, toDate]) overlaps the selected generation
  // range — a movie releasing after the range end, or already ended before the range
  // start, has nothing to schedule and shouldn't clutter the picker.
  const visibleMovies = useMemo(
    () =>
      movies.filter((m) => {
        if (m.fromDate && m.fromDate > form.endDate) return false;
        if (m.toDate && m.toDate < form.startDate) return false;
        return true;
      }),
    [movies, form.startDate, form.endDate]
  );

  // active rooms/movies given the current (required) scope selection
  const activeRooms = useMemo(
    () => rooms.filter((r) => selectedRoomIds.includes(r.cinemaRoomId)),
    [rooms, selectedRoomIds]
  );
  const scopeMovies = useMemo(
    () => movies.filter((m) => selectedMovieIds.includes(m.movieId)),
    [movies, selectedMovieIds]
  );

  const eligibleMoviesForRoom = (room) =>
    scopeMovies
      .flatMap((movie) => {
        if (!getMovieRoomIds(movie).includes(room.cinemaRoomId)) return [];
        return computeFormatWeights(movie, movieSettings[movie.movieId]?.formatRatios)
          .filter((f) => roomAcceptsVersion(room, f.versionId))
          .map((f) => ({
            movie,
            versionId: f.versionId,
            versionName: f.versionName,
            ratio: effectiveRatio(movie) * f.percent,
          }));
      })
      .sort((a, b) => b.ratio - a.ratio);

  // Effective events for a day+room: a manual override if present, else the server-generated candidates.
  const getEffectiveEvents = (dateStr, room) => {
    const key = roomKey(dateStr, room.cinemaRoomId);
    if (customEvents[key]) return customEvents[key];
    if (!preview) return [];
    return preview.accepted
      .filter((c) => isoToDate(c.startTime) === dateStr && c.cinemaRoomId === room.cinemaRoomId)
      .map((c) => {
        const movie = movies.find((m) => m.movieId === c.movieId);
        return {
          movieId: c.movieId,
          movieName: c.movieName,
          versionId: c.versionId,
          versionName: c.versionName,
          startMin: isoToMin(c.startTime),
          // Duration as a true datetime diff, not same-day hour/minute subtraction —
          // isoToMin(end) - isoToMin(start) would go negative for a show ending
          // after midnight, the exact bug this module exists to avoid repeating.
          runtime: movie ? movie.duration : (new Date(c.endTime).getTime() - new Date(c.startTime).getTime()) / 60000,
          golden: c.goldenHour,
          goldenExtra: c.goldenHourExtra ?? null,
          insertedIntoBusyDay: c.insertedIntoBusyDay,
        };
      })
      .sort((a, b) => a.startMin - b.startMin);
  };

  // Operating-hours window + date tabs. Does NOT include the axis pixel
  // geometry — that depends on the active day's events (see axisTotalMinutes
  // below), which in turn depend on openMin, so it's computed separately to
  // avoid a circular memo.
  const baseAxis = useMemo(() => {
    const openMin = timeToMin(form.openTime);
    const closeMin = timeToMin(form.closeTime);
    const dates = buildDateRange(form.startDate, form.endDate).map((dateStr) => {
      const parsed = new Date(`${dateStr}T00:00:00`);
      return {
        date: dateStr,
        weekday: WEEKDAYS[parsed.getDay()],
        dayNum: `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}`,
      };
    });
    return { openMin, closeMin, dates };
  }, [form.startDate, form.endDate, form.openTime, form.closeTime]);

  const dayIndex = preview ? Math.min(activeDay, Math.max(0, baseAxis.dates.length - 1)) : 0;
  const activeDateStr = preview ? baseAxis.dates[dayIndex]?.date : undefined;

  const skippedCellSet = useMemo(
    () => new Set((preview?.skippedRoomDays || []).map((s) => `${s.date}|${s.cinemaRoomId}`)),
    [preview]
  );
  const skippedDateSet = useMemo(
    () => new Set((preview?.skippedRoomDays || []).map((s) => s.date)),
    [preview]
  );
  const isCellSkipped = (dateStr, roomId) => skippedCellSet.has(`${dateStr}|${roomId}`);

  const goldenRuleAt = (dateStr, min) => findGoldenRule(goldenRules, dateStr, min);

  const goldenBands = useMemo(() => {
    if (!activeDateStr) return [];
    return goldenRules
      .filter((r) => ruleMatchesDate(r, activeDateStr))
      .map((r) => {
        const s = Math.max(ruleStartMinutes(r), baseAxis.openMin);
        const e = Math.min(ruleEndMinutes(r), baseAxis.closeMin);
        return e > s
          ? { left: (s - baseAxis.openMin) * PX_PER_MIN, width: (e - s) * PX_PER_MIN }
          : null;
      })
      .filter(Boolean);
  }, [goldenRules, baseAxis, activeDateStr]);

  // Rows (one per in-scope room) for the active day — rooms run down the left
  // rail, time runs horizontally. Minute offsets are relative to baseAxis.openMin
  // but geometry (left/width) is computed later once axisTotalMinutes — which
  // depends on these events' real end times — is known.
  const rows = useMemo(() => {
    if (!preview || !activeDateStr) return [];
    return activeRooms.map((room) => {
      const events = getEffectiveEvents(activeDateStr, room);
      const eligible = eligibleMoviesForRoom(room);
      return {
        room,
        empty: events.length === 0,
        noEligible: eligible.length === 0,
        skipped: skippedCellSet.has(`${activeDateStr}|${room.cinemaRoomId}`),
        events: events.map((ev, idx) => ({
          idx,
          key: `${room.cinemaRoomId}-${ev.startMin}-${ev.movieId}`,
          title: ev.movieName,
          timeLabel: `${minToLabel(ev.startMin)} – ${minToLabel(ev.startMin + ev.runtime)}`,
          version: ev.versionName,
          golden: ev.golden,
          goldenExtra: ev.goldenExtra,
          insertedIntoBusyDay: ev.insertedIntoBusyDay,
          startMinRel: ev.startMin - baseAxis.openMin,
          endMinRel: ev.startMin + ev.runtime - baseAxis.openMin,
          isLast: idx === events.length - 1,
          raw: ev,
        })),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseAxis, activeDateStr, activeRooms, customEvents, preview, movies]);

  // Axis stretches past the configured closing time when a show's real end
  // pushes beyond it, instead of letting the block overflow an unlabeled area.
  const axisTotalMinutes = useMemo(() => {
    const base = Math.max(HOUR, baseAxis.closeMin - baseAxis.openMin);
    const ends = rows.flatMap((r) => r.events.map((ev) => ev.endMinRel));
    return extendAxisMinutes(base, ends);
  }, [baseAxis, rows]);

  const timeline = useMemo(() => {
    if (!preview) return null;
    return {
      openMin: baseAxis.openMin,
      closeMin: baseAxis.closeMin,
      dates: baseAxis.dates,
      trackWidth: axisTotalMinutes * PX_PER_MIN,
      hourMarks: buildHourMarks(baseAxis.openMin, axisTotalMinutes, PX_PER_MIN),
    };
  }, [preview, baseAxis, axisTotalMinutes]);

  // Ids of events overlapping another event in the same room — a data problem
  // the admin must see, not a silently-stacked block.
  const overlapIdsByRoom = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const items = row.events.map((ev) => ({ id: ev.key, startMin: ev.startMinRel, endMin: ev.endMinRel }));
      map.set(row.room.cinemaRoomId, computeOverlapIds(items));
    });
    return map;
  }, [rows]);

  const totalCount = useMemo(() => {
    if (!timeline) return 0;
    let n = 0;
    timeline.dates.forEach((d) => activeRooms.forEach((room) => { n += getEffectiveEvents(d.date, room).length; }));
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, activeRooms, customEvents, preview, movies]);

  const writeEvents = (dateStr, room, events) => {
    setCustomEvents((prev) => ({
      ...prev,
      [roomKey(dateStr, room.cinemaRoomId)]: events.slice().sort((a, b) => a.startMin - b.startMin),
    }));
  };

  const movieOverlapsOtherRoom = (dateStr, roomId, movieId, startMin, runtime) =>
    activeRooms.some(
      (r) =>
        r.cinemaRoomId !== roomId &&
        getEffectiveEvents(dateStr, r).some(
          (ev) =>
            ev.movieId === movieId &&
            startMin < ev.startMin + ev.runtime &&
            startMin + runtime > ev.startMin
        )
    );

  const handleTrackClick = (e, dateStr, room) => {
    if (e.target !== e.currentTarget || !timeline) return;
    if (isCellSkipped(dateStr, room.cinemaRoomId)) return; // room already has schedules that day
    const eligible = eligibleMoviesForRoom(room);
    if (!eligible.length) return;
    const best = eligible[0];
    const runtime = best.movie.duration;

    // Timeline is horizontal (time flows via `left`), so the click offset comes from clientX, not clientY.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const raw = timeline.openMin + x / PX_PER_MIN;
    const snapped = Math.round(raw / 5) * 5;
    const start = Math.max(timeline.openMin, Math.min(snapped, timeline.closeMin));

    const base = getEffectiveEvents(dateStr, room);
    const overlap = base.some(
      (ev) => start < ev.startMin + ev.runtime && start + runtime > ev.startMin
    );
    if (overlap) return;
    if (movieOverlapsOtherRoom(dateStr, room.cinemaRoomId, best.movie.movieId, start, runtime)) return;

    const goldenRule = goldenRuleAt(dateStr, start);
    writeEvents(dateStr, room, [
      ...base,
      {
        movieId: best.movie.movieId,
        movieName: best.movie.movieNameVn,
        versionId: best.versionId,
        versionName: best.versionName,
        startMin: start,
        runtime,
        golden: !!goldenRule,
        goldenExtra: goldenRule?.extraPrice ?? null,
      },
    ]);
  };

  const handleRemoveEvent = (e, dateStr, room, idx) => {
    e.stopPropagation();
    const base = getEffectiveEvents(dateStr, room);
    writeEvents(dateStr, room, base.filter((_, i) => i !== idx));
  };

  const handleDuplicateEvent = (e, dateStr, room, ev) => {
    e.stopPropagation();
    if (!timeline) return;
    const start = ev.startMin + ev.runtime + Number(form.gapCleanup);
    if (start > timeline.closeMin) return;
    const base = getEffectiveEvents(dateStr, room);
    const overlap = base.some(
      (e2) => start < e2.startMin + e2.runtime && start + ev.runtime > e2.startMin
    );
    if (overlap) return;
    if (movieOverlapsOtherRoom(dateStr, room.cinemaRoomId, ev.movieId, start, ev.runtime)) return;
    const goldenRule = goldenRuleAt(dateStr, start);
    writeEvents(dateStr, room, [
      ...base,
      { ...ev, startMin: start, golden: !!goldenRule, goldenExtra: goldenRule?.extraPrice ?? null },
    ]);
  };

  const handleSave = async () => {
    if (!timeline || totalCount === 0) return;
    setErrorMessage("");
    setSuccessMessage("");
    setFailedItems([]);
    const candidates = [];
    timeline.dates.forEach((d) => {
      activeRooms.forEach((room) => {
        getEffectiveEvents(d.date, room).forEach((ev) => {
          candidates.push({
            movieId: ev.movieId,
            movieName: ev.movieName,
            cinemaRoomId: room.cinemaRoomId,
            cinemaRoomName: room.cinemaRoomName,
            versionId: ev.versionId,
            versionName: ev.versionName,
            startTime: minToDateTime(d.date, ev.startMin),
            endTime: minToDateTime(d.date, ev.startMin + ev.runtime),
            bufferTime: Number(form.gapCleanup),
            goldenHour: ev.golden,
            accepted: true,
          });
        });
      });
    });

    setIsSaving(true);
    try {
      const res = await ScheduleService.autoGenerateConfirm({ candidates });
      const result = res.data?.data || res.data || {};
      const saved = result.saved || [];
      const failed = result.failed || [];
      setSuccessMessage(`Đã tạo thành công ${saved.length} suất chiếu.`);
      setFailedItems(failed);
      if (failed.length === 0) {
        setPreview(null);
        setCustomEvents({});
        setTimeout(() => navigate("/admin/schedules"), 1200);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể lưu các suất chiếu."));
    } finally {
      setIsSaving(false);
    }
  };

  const cardClass = "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6";

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/schedules")}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#C00000] dark:hover:text-[#ff4d57] uppercase font-bold tracking-wider mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            Quay lại quản lý lịch chiếu
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wand2 size={22} className="text-[#C00000] dark:text-[#ff4d57]" />
            Tạo lịch chiếu tự động
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || totalCount === 0}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Lưu {totalCount} suất chiếu
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm font-semibold rounded-lg">
            <AlertTriangle size={18} />
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 text-sm font-semibold rounded-lg">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}
        {preview?.skippedRoomDays?.length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm font-semibold rounded-lg">
            <AlertTriangle size={18} className="flex-none mt-0.5" />
            <span>
              Các phòng sau đã có lịch chiếu nên bị bỏ qua:{" "}
              {Object.entries(
                preview.skippedRoomDays.reduce((acc, s) => {
                  (acc[s.date] = acc[s.date] || []).push(s.cinemaRoomName);
                  return acc;
                }, {})
              )
                .map(([date, names]) => `${isoDateToLabel(date)} (${names.join(", ")})`)
                .join("; ")}
              . Các phòng còn trống trong ngày đó vẫn được tạo lịch bình thường; xoá lịch hiện có
              của phòng nếu muốn tạo lại.
            </span>
          </div>
        )}
        {preview?.incompatibleMovieWarnings?.length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm font-semibold rounded-lg">
            <AlertTriangle size={18} className="flex-none mt-0.5" />
            <span>
              Các phim sau không khớp định dạng với bất kỳ phòng nào trong phạm vi đã chọn, nên sẽ
              không có suất chiếu nào: {preview.incompatibleMovieWarnings.join(", ")}.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Top: configuration, side by side and equal height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardClass} flex flex-col h-[600px]`}>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
                Khoảng thời gian &amp; khung giờ
              </h2>
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
                <div>
                  <label className={fieldLabelClass}>Từ ngày</label>
                  <DateInput
                    name="startDate"
                    min={tomorrowStr()}
                    max={maxStartDateStr()}
                    value={form.startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className={fieldInputClass}
                    showIcon={false}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Đến ngày</label>
                  <DateInput
                    name="endDate"
                    min={form.startDate}
                    max={addDaysStr(form.startDate, MAX_RANGE_DAYS - 1)}
                    value={form.endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className={fieldInputClass}
                    showIcon={false}
                  />
                </div>
                <div className="col-span-2 -mt-2">
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                    Từ ngày phải sau hôm nay ít nhất 1 ngày · Đến ngày tối đa cách Từ ngày 6 ngày
                  </span>
                </div>
                <div>
                  <label className={fieldLabelClass}>Mở cửa</label>
                  <input
                    type="time"
                    min="08:00"
                    max="11:00"
                    value={form.openTime}
                    onChange={(e) => onOpenTimeChange(e.target.value)}
                    className={fieldInputClass}
                  />
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1">Trong khoảng 08:00–11:00</span>
                </div>
                <div>
                  <label className={fieldLabelClass}>Suất cuối (bắt đầu)</label>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={(e) => updateField("closeTime", e.target.value)}
                    className={fieldInputClass}
                  />
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1">Giờ bắt đầu suất chiếu cuối</span>
                </div>
                <div>
                  <label className={fieldLabelClass}>Số suất / phòng / ngày</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={form.showsPerDayPerRoom}
                    onChange={(e) => updateField("showsPerDayPerRoom", e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Số phim tối đa / phòng</label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={form.maxMoviesPerRoom}
                    onChange={(e) => updateField("maxMoviesPerRoom", e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={fieldLabelClass}>Dọn dẹp + QC giữa suất (phút)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.gapCleanup}
                    onChange={(e) => updateField("gapCleanup", e.target.value)}
                    className={fieldInputClass}
                  />
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    Khoảng cách giữa suất trước và suất sau trong cùng phòng (đã gồm dọn dẹp + quảng cáo/trailer)
                  </span>
                </div>
                <div className="col-span-2 bg-[#C00000]/[0.06] dark:bg-[#ff4d57]/10 rounded-lg px-3 py-2.5">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Khung giờ vàng và phụ thu được quản lý tại trang <strong className="text-[#C00000] dark:text-[#ff4d57]">Cấu hình giá</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div className={`${cardClass} flex flex-col h-[600px]`}>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
                Phạm vi phim &amp; phòng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <p className={fieldLabelClass}>
                    Phim (đã chọn {selectedMovieIds.length})
                  </p>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2">
                    {visibleMovies.map((m) => (
                      <div key={m.movieId}>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-0.5">
                          <input
                            type="checkbox"
                            checked={selectedMovieIds.includes(m.movieId)}
                            onChange={() => onToggleMovieSelected(m.movieId)}
                            className="accent-[#C00000] flex-none"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpandedMovie(m.movieId)}
                            className="flex-1 truncate text-left hover:text-[#C00000] dark:hover:text-[#ff4d57] hover:underline"
                            title={m.movieNameVn}
                          >
                            {m.movieNameVn}
                          </button>
                          <Settings2
                            size={14}
                            className="flex-none text-gray-400 hover:text-[#C00000] dark:hover:text-[#ff4d57] cursor-pointer"
                            onClick={() => toggleExpandedMovie(m.movieId)}
                          />
                        </div>
                        {expandedMovieIds.includes(m.movieId) && (
                          <div className="mt-1 mb-2 ml-5">
                            <MovieFormatSettingsPanel
                              movie={m}
                              rooms={rooms}
                              selectedRoomIds={selectedRoomIds}
                              ratio={effectiveRatio(m)}
                              onChangeRatio={(v) => setMovieRatio((prev) => ({ ...prev, [m.movieId]: v }))}
                              settings={movieSettings[m.movieId]}
                              onChangeFormatRatio={onChangeFormatRatio}
                              onToggleFormat={onToggleFormat}
                              onToggleRoom={onToggleRoom}
                              onCollapse={() => toggleExpandedMovie(m.movieId)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {movies.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Không có phim khả dụng.</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col min-h-0">
                  <p className={fieldLabelClass}>
                    Phòng (đã chọn {selectedRoomIds.length})
                  </p>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2">
                    {rooms.map((r) => (
                      <div
                        key={r.cinemaRoomId}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-0.5"
                      >
                        <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRoomIds.includes(r.cinemaRoomId)}
                            onChange={() => toggleId(selectedRoomIds, setSelectedRoomIds, r.cinemaRoomId)}
                            className="accent-[#C00000] flex-none"
                          />
                          <span className="flex-1 truncate" title={r.cinemaRoomName}>{r.cinemaRoomName}</span>
                          <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 flex-none">
                            {roomFormatBadge(r)}
                          </span>
                        </label>
                        <label
                          className="flex items-center gap-1 flex-none cursor-pointer"
                          title="Cho phép chèn suất mới vào ngày phòng này đã có lịch, chỉ bỏ qua đúng khung giờ bị trùng thay vì bỏ qua cả ngày."
                        >
                          <input
                            type="checkbox"
                            checked={allowInsertRoomIds.includes(r.cinemaRoomId)}
                            onChange={() => toggleId(allowInsertRoomIds, setAllowInsertRoomIds, r.cinemaRoomId)}
                            className="accent-sky-500"
                          />
                          <CalendarPlus size={13} className="text-gray-400" />
                        </label>
                      </div>
                    ))}
                    {rooms.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Không có phòng hoạt động.</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Phải chọn ít nhất 1 phim và 1 phòng mới tạo được lịch. Mỗi phim chỉ chạy 1 phiên bản mỗi
                lượt tạo lịch; tỉ lệ quyết định số suất được chia trong mỗi khung giờ.
              </p>
            </div>
          </div>

          {/* Schedule timeline (full width) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-3 px-6 pt-5 pb-3">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                Lịch chiếu dự kiến
              </h2>
              <div className="flex items-center gap-4">
                {preview ? (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 size={14} />
                      {preview.acceptedCount} hợp lệ
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertTriangle size={14} />
                      {preview.rejectedCount} bị loại
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ backgroundColor: "var(--cine-gold)" }}
                      />
                      Giờ vàng
                    </span>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleUpdatePreview}
                  disabled={isPreviewing || !hasScope || !hasValidRange}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {isPreviewing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Cập nhật
                </button>
              </div>
            </div>

            {!timeline ? (
              <div className="flex flex-col items-center justify-center text-center gap-3 px-6 py-24 text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
                <CalendarClock size={40} strokeWidth={1.5} />
              </div>
            ) : (
              <>
                {/* Day tabs */}
                <div className="flex items-center gap-1.5 px-6 pb-3 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveDay((d) => Math.max(0, d - 1))}
                    className="w-[30px] h-[30px] flex-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <ArrowLeft size={14} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  {timeline.dates.map((d, i) => {
                    const active = i === dayIndex;
                    const skipped = skippedDateSet.has(d.date);
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setActiveDay(i)}
                        title={skipped ? "Ngày có phòng đã có lịch chiếu — các phòng đó bị bỏ qua" : undefined}
                        className={`flex-none rounded-lg px-3.5 py-2 text-center border transition-colors ${
                          active
                            ? "bg-[#C00000] border-transparent text-white shadow"
                            : skipped
                              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span className="block text-[10px] font-bold opacity-70">{d.weekday}</span>
                        <span className="block text-sm font-bold">{d.dayNum}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveDay((d) => Math.min(timeline.dates.length - 1, d + 1))}
                    className="w-[30px] h-[30px] flex-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <ArrowLeft size={14} className="text-gray-500 dark:text-gray-400 rotate-180" />
                  </button>
                </div>

                {/* Horizontal grid: rooms as rows on the left rail, time on the X axis */}
                <div className="border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                  <div className="flex" style={{ minWidth: RAIL_WIDTH + timeline.trackWidth }}>
                    {/* Room rail (sticky left) */}
                    <div
                      className="flex-none sticky left-0 z-20 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800"
                      style={{ width: RAIL_WIDTH }}
                    >
                      <div
                        className="flex items-center px-3.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800"
                        style={{ height: AXIS_HEIGHT }}
                      >
                        Phòng
                      </div>
                      {rows.map((row) => (
                        <div
                          key={row.room.cinemaRoomId}
                          className="flex flex-col justify-center gap-1 px-3.5 border-b border-gray-100 dark:border-gray-800"
                          style={{ height: ROW_HEIGHT }}
                        >
                          <p
                            className="text-[12.5px] font-bold text-gray-700 dark:text-gray-300 truncate"
                            title={row.room.cinemaRoomName}
                          >
                            {row.room.cinemaRoomName}
                          </p>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 w-fit">
                            {roomFormatBadge(row.room)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Time area */}
                    <div className="relative flex-1" style={{ minWidth: timeline.trackWidth }}>
                      {/* Hour axis */}
                      <div className="relative border-b border-gray-100 dark:border-gray-800" style={{ height: AXIS_HEIGHT }}>
                        {timeline.hourMarks.map((h) => (
                          <div
                            key={h.left}
                            className={`absolute top-0 bottom-0 flex items-center pl-1.5 text-[11px] ${
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
                        {timeline.hourMarks.map((h) => (
                          <div
                            key={`line-${h.left}`}
                            className={`absolute inset-y-0 pointer-events-none ${h.isMidnight ? "border-l-2 border-red-300 dark:border-red-500/50" : "border-l border-gray-100 dark:border-gray-800"}`}
                            style={{ left: h.left }}
                          />
                        ))}
                        {rows.map((row) => (
                          <div
                            key={row.room.cinemaRoomId}
                            onClick={(e) => handleTrackClick(e, activeDateStr, row.room)}
                            className={`relative border-b border-gray-100 dark:border-gray-800 ${row.skipped ? "cursor-not-allowed bg-amber-50/40 dark:bg-amber-950/20" : "cursor-cell"}`}
                            style={{ height: ROW_HEIGHT }}
                          >
                            {row.events.length === 0 && (row.skipped || row.noEligible) && (
                              <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] italic pointer-events-none ${row.skipped ? "text-amber-500 dark:text-amber-400" : "text-gray-300 dark:text-gray-600"}`}>
                                {row.skipped
                                  ? "Phòng đã có lịch chiếu ngày này — không thể tạo tự động"
                                  : `Không có phim phù hợp định dạng ${roomFormatBadge(row.room)}`}
                              </div>
                            )}
                            {row.events.map((ev) => {
                              const geometry = computeBlockGeometry(ev.startMinRel, ev.endMinRel, axisTotalMinutes, PX_PER_MIN);
                              if (!geometry) return null;
                              const { left, width, isInvalid } = geometry;
                              const hasOverlap = overlapIdsByRoom.get(row.room.cinemaRoomId)?.has(ev.key);
                              const isNarrow = width < 56;
                              return (
                                <div
                                  key={ev.key}
                                  onClick={(e) => handleRemoveEvent(e, activeDateStr, row.room, ev.idx)}
                                  title={`${ev.title} · ${ev.timeLabel} · ${ev.version}${
                                    ev.insertedIntoBusyDay ? " · Chèn vào ngày đã có lịch" : ""
                                  } · Click để xoá`}
                                  className={`group absolute rounded-lg px-2 py-1.5 overflow-visible shadow-sm z-10 cursor-pointer ${
                                    isInvalid
                                      ? "border-2 border-red-500"
                                      : hasOverlap
                                        ? "border-2 border-amber-500"
                                        : ev.insertedIntoBusyDay
                                          ? "border-2 border-dashed border-sky-500"
                                          : ""
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
                                        : EVENT_BG,
                                    color: EVENT_FG,
                                    boxShadow: ev.golden
                                      ? "0 0 0 2px color-mix(in srgb, var(--cine-gold) 70%, transparent)"
                                      : "0 1px 2px rgba(20,20,40,.15)",
                                  }}
                                >
                                  {(isInvalid || hasOverlap) && (
                                    <AlertTriangle
                                      size={12}
                                      className={`absolute top-1 left-1 ${isInvalid ? "text-red-100" : "text-amber-200"}`}
                                    />
                                  )}
                                  {!isInvalid && !hasOverlap && ev.insertedIntoBusyDay && (
                                    <CalendarPlus size={12} className="absolute top-1 left-1 text-sky-100" />
                                  )}
                                  {!isNarrow && (
                                    <>
                                      <div className="font-bold text-[11.5px] leading-tight truncate">{ev.title}</div>
                                      <div className="text-[10.5px] opacity-85 mt-0.5 truncate">{ev.timeLabel}</div>
                                      <div className="text-[10px] opacity-75 mt-0.5 truncate">
                                        {ev.version}
                                        {ev.golden ? ` · Giờ vàng +${Number(ev.goldenExtra || 0).toLocaleString("vi-VN")}đ` : ""}
                                      </div>
                                    </>
                                  )}
                                  {ev.isLast && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleDuplicateEvent(e, activeDateStr, row.room, ev.raw)}
                                      title="Nhân bản suất kế tiếp"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -right-3.5 -translate-y-1/2 w-[26px] h-[26px] rounded-full border-2 border-[#3467e0] bg-white text-[#3467e0] flex items-center justify-center shadow z-20"
                                    >
                                      <Plus size={14} strokeWidth={3} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {timeline && (
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <span>💡</span>
            Click vào ô trống để thêm suất chiếu tại khung giờ đó. Click vào block để xoá. Trỏ vào block
            cuối cùng của phòng và bấm dấu "+" để tạo suất tiếp theo ngay sau đó.
          </p>
        )}

        {/* Rejected candidates from the generator (full width) */}
        {preview && preview.rejectedCount > 0 && (
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Ứng viên bị loại ({preview.rejectedCount})
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {preview.rejected.map((c, idx) => (
                <div
                  key={`rej-${idx}`}
                  className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 py-1.5"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{c.movieName}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span>{c.cinemaRoomName}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span>{formatDateTime(c.startTime)}</span>
                  <span className="text-amber-600 dark:text-amber-400">— {translateScheduleReason(c.rejectReason)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items that failed to save (e.g. a manual edit introduced a conflict) */}
        {failedItems.length > 0 && (
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Không lưu được ({failedItems.length})
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {failedItems.map((c, idx) => (
                <div
                  key={`failed-${idx}`}
                  className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 py-1.5"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{c.movieName}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span>{c.cinemaRoomName}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span>{formatDateTime(c.startTime)}</span>
                  <span className="text-red-600 dark:text-red-400">— {translateScheduleReason(c.rejectReason)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AutoGenerateSchedulePage;
