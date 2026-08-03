package org.example.be.service;

import org.example.be.dto.AutoGenerateConfirmRequestDTO;
import org.example.be.dto.AutoGenerateConfirmResultDTO;
import org.example.be.dto.AutoGeneratePreviewDTO;
import org.example.be.dto.AutoGenerateRequestDTO;
import org.example.be.dto.ScheduleCandidateDTO;
import org.example.be.dto.ScheduleRequestDTO;
import org.example.be.dto.ScheduleResponseDTO;
import org.example.be.dto.SkippedRoomDayDTO;
import org.example.be.entity.Schedule;
import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.example.be.entity.GoldenHourConfig;
import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.example.be.entity.Version;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.GoldenHourConfigRepository;
import org.example.be.repository.MovieRepository;
import org.example.be.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AutoGenerateService {

    private static final LocalTime DEFAULT_OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_CLOSE_TIME = LocalTime.of(23, 0);
    private static final int DEFAULT_SHOWS_PER_DAY_PER_ROOM = 4;
    private static final int DEFAULT_MAX_MOVIES_PER_ROOM = 2;
    private static final int DEFAULT_GAP_CLEANUP = 30;

    /** Per-room stagger step (minutes) used to reduce same-movie collisions across rooms. */
    private static final int STAGGER_STEP = 20;

    /** All generated start times must land on a multiple of this many minutes. */
    private static final int TIME_STEP_MIN = 5;

    private static final int MIN_DAYS_AHEAD = 1;
    private static final int MAX_DAYS_AHEAD = 10;

    private static final int MIN_RATIO = 1;
    private static final int MAX_RATIO = 5;

    private static final int MIN_FORMAT_RATIO = 1;
    private static final int MAX_FORMAT_RATIO = 20;
    private static final String TOKEN_SEP = "::";

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private GoldenHourConfigRepository goldenHourConfigRepository;

    @Autowired
    private PricingService pricingService;

    static class MovieConfig {
        String token;
        String movieId;
        String movieName;
        int runtime;
        Version version;
        double comboWeight;
        Set<Integer> allowedRoomIds;
        LocalDate fromDate;
        LocalDate toDate;
    }

    /** A candidate slot placed by the packing heuristic, before DB validation. */
    static class PlacedEvent {
        String token;
        int startMin;
        int durMin;
    }

    @Transactional(readOnly = true)
    public AutoGeneratePreviewDTO generatePreview(AutoGenerateRequestDTO request) {
        if (request.getMovieIds() == null || request.getMovieIds().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 phim.");
        }
        if (request.getRoomIds() == null || request.getRoomIds().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 phòng.");
        }
        LocalTime openTime = orDefault(request.getOpenTime(), DEFAULT_OPEN_TIME);
        LocalTime closeTime = orDefault(request.getCloseTime(), DEFAULT_CLOSE_TIME);
        int showsPerDay = orDefault(request.getShowsPerDayPerRoom(), DEFAULT_SHOWS_PER_DAY_PER_ROOM);
        int maxMoviesPerRoom = orDefault(request.getMaxMoviesPerRoom(), DEFAULT_MAX_MOVIES_PER_ROOM);
        int gapCleanup = orDefault(request.getGapCleanup(), DEFAULT_GAP_CLEANUP);
        Set<Integer> allowInsertIntoBusyDayRoomIds = request.getAllowInsertIntoBusyDayRoomIds() != null
                ? new HashSet<>(request.getAllowInsertIntoBusyDayRoomIds()) : Collections.emptySet();

        LocalDate today = LocalDate.now();
        LocalDate minDate = today.plusDays(MIN_DAYS_AHEAD);
        LocalDate maxDate = today.plusDays(MAX_DAYS_AHEAD);
        LocalDate startDate = request.getStartDate() != null && request.getStartDate().isAfter(minDate)
                ? request.getStartDate() : minDate;
        LocalDate endDate = request.getEndDate() != null && request.getEndDate().isBefore(maxDate)
                ? request.getEndDate() : maxDate;

        List<Movie> movies = resolveMovies(request.getMovieIds(), startDate, endDate);
        List<CinemaRoom> rooms = resolveRooms(request.getRoomIds()).stream()
                .filter(room -> room.getStatus() == CinemaRoomStatus.ACTIVE)
                .filter(room -> room.getFormats() != null && !room.getFormats().isEmpty())
                .collect(Collectors.toList());

        Map<String, MovieConfig> movieConfigs = buildMovieConfigs(movies, request.getMovieRatios(),
                request.getMovieFormatRatios(), request.getMovieRoomIds(), request.getRoomIds());
        List<String> incompatibleMovieWarnings = findIncompatibleMovies(movieConfigs, rooms);

        Map<Integer, Integer> roomIndexByRoomId = new LinkedHashMap<>();
        for (CinemaRoom room : rooms) {
            roomIndexByRoomId.put(room.getCinemaRoomId(), roomIndexByRoomId.size());
        }

        List<ScheduleCandidateDTO> accepted = new ArrayList<>();
        List<ScheduleCandidateDTO> rejected = new ArrayList<>();

        List<Schedule> existingInRange = findExistingBetween(startDate, endDate);
        Set<String> busyRoomDays = busyRoomDayKeys(existingInRange);
        List<SkippedRoomDayDTO> skippedRoomDays = new ArrayList<>();
        List<GoldenHourConfig> goldenRules = goldenHourConfigRepository.findByActiveTrue();

        for (LocalDate day = startDate; !day.isAfter(endDate); day = day.plusDays(1)) {
            if (day.isBefore(minDate) || day.isAfter(maxDate)) {
                continue;
            }

            List<CinemaRoom> availableRooms = new ArrayList<>();
            for (CinemaRoom room : rooms) {
                boolean busy = busyRoomDays.contains(roomDayKey(day, room.getCinemaRoomId()));
                boolean allowForThisRoom = allowInsertIntoBusyDayRoomIds.contains(room.getCinemaRoomId());
                if (busy && !allowForThisRoom) {
                    skippedRoomDays.add(SkippedRoomDayDTO.builder()
                            .date(day)
                            .cinemaRoomId(room.getCinemaRoomId())
                            .cinemaRoomName(room.getCinemaRoomName())
                            .build());
                } else {
                    availableRooms.add(room);
                }
            }
            if (availableRooms.isEmpty()) {
                continue;
            }

            final LocalDate currentDay = day;
            List<MovieConfig> dayMovies = movieConfigs.values().stream()
                    .filter(mc -> isActiveOnDay(mc, currentDay))
                    .filter(mc -> availableRooms.stream().anyMatch(room -> roomSupports(room, mc)))
                    .collect(Collectors.toList());
            if (dayMovies.isEmpty()) {
                continue;
            }

            int totalSlots = showsPerDay * availableRooms.size();
            List<Weight> weights = dayMovies.stream()
                    .map(mc -> new Weight(mc.token, mc.comboWeight))
                    .collect(Collectors.toList());
            List<String> tokens = interleave(allocateCounts(totalSlots, weights));

            Map<Integer, List<String>> roomSeqs =
                    dealTokensToRooms(tokens, availableRooms, movieConfigs, showsPerDay, maxMoviesPerRoom);
            Map<String, List<int[]>> movieBusy = seedMovieBusy(existingInRange, day, movieConfigs);

            for (CinemaRoom room : availableRooms) {
                List<String> seq = roomSeqs.getOrDefault(room.getCinemaRoomId(), Collections.emptyList());
                if (seq.isEmpty()) {
                    continue;
                }
                int roomIndex = roomIndexByRoomId.getOrDefault(room.getCinemaRoomId(), 0);
                boolean intoBusyDay = busyRoomDays.contains(roomDayKey(day, room.getCinemaRoomId()));
                List<int[]> roomBusy = intoBusyDay
                        ? seedRoomBusy(existingInRange, day, room.getCinemaRoomId())
                        : Collections.emptyList();
                packRoomDay(room, seq, movieConfigs, day, openTime, closeTime, goldenRules,
                        gapCleanup, roomIndex, movieBusy, roomBusy, intoBusyDay, accepted, rejected);
            }
        }

        int acceptedCount = accepted.size();
        int rejectedCount = rejected.size();
        return AutoGeneratePreviewDTO.builder()
                .accepted(accepted)
                .rejected(rejected)
                .generatedCount(acceptedCount + rejectedCount)
                .acceptedCount(acceptedCount)
                .rejectedCount(rejectedCount)
                .incompatibleMovieWarnings(incompatibleMovieWarnings)
                .skippedRoomDays(skippedRoomDays)
                .build();
    }

    private List<Schedule> findExistingBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            return Collections.emptyList();
        }
        return scheduleRepository.findActiveBetween(startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    private static String roomDayKey(LocalDate day, Integer roomId) {
        return day + "|" + roomId;
    }

    private static Set<String> busyRoomDayKeys(List<Schedule> schedules) {
        return schedules.stream()
                .filter(s -> s.getStartTime() != null && s.getCinemaRoomId() != null)
                .map(s -> roomDayKey(s.getStartTime().toLocalDate(), s.getCinemaRoomId()))
                .collect(Collectors.toSet());
    }

    private static boolean roomSupports(CinemaRoom room, MovieConfig mc) {
        return room.getFormats() != null && room.getFormats().stream()
                .anyMatch(f -> f.getVersionId().equals(mc.version.getVersionId()));
    }

    private Map<Integer, List<String>> dealTokensToRooms(List<String> tokens, List<CinemaRoom> rooms,
                                                          Map<String, MovieConfig> movieConfigs,
                                                          int showsPerDay, int maxMoviesPerRoom) {
        Map<Integer, List<String>> seqs = new LinkedHashMap<>();
        Map<Integer, Set<String>> distinct = new LinkedHashMap<>();
        for (CinemaRoom room : rooms) {
            seqs.put(room.getCinemaRoomId(), new ArrayList<>());
            distinct.put(room.getCinemaRoomId(), new LinkedHashSet<>());
        }

        for (String token : tokens) {
            MovieConfig mc = movieConfigs.get(token);
            if (mc == null) {
                continue;
            }
            CinemaRoom best = null;
            int bestScore = Integer.MAX_VALUE;
            for (CinemaRoom room : rooms) {
                Integer roomId = room.getCinemaRoomId();
                if (!roomSupports(room, mc)) {
                    continue;
                }
                if (mc.allowedRoomIds != null && !mc.allowedRoomIds.contains(roomId)) {
                    continue;
                }
                if (seqs.get(roomId).size() >= showsPerDay) {
                    continue;
                }
                boolean alreadyInRoom = distinct.get(roomId).contains(mc.movieId);
                if (!alreadyInRoom && distinct.get(roomId).size() >= maxMoviesPerRoom) {
                    continue;
                }
                int score = seqs.get(roomId).size() * 2 + (alreadyInRoom ? 0 : 1);
                if (score < bestScore) {
                    bestScore = score;
                    best = room;
                }
            }
            if (best == null) {
                continue;
            }
            seqs.get(best.getCinemaRoomId()).add(token);
            distinct.get(best.getCinemaRoomId()).add(mc.movieId);
        }

        Map<String, List<MovieConfig>> entriesByMovieId = movieConfigs.values().stream()
                .collect(Collectors.groupingBy(mc -> mc.movieId, LinkedHashMap::new, Collectors.toList()));

        for (CinemaRoom room : rooms) {
            List<String> seq = seqs.get(room.getCinemaRoomId());
            List<String> pool = distinct.get(room.getCinemaRoomId()).stream()
                    .map(movieId -> entriesByMovieId.getOrDefault(movieId, Collections.<MovieConfig>emptyList()).stream()
                            .filter(mc -> roomSupports(room, mc))
                            .max(Comparator.comparingDouble(mc -> mc.comboWeight))
                            .orElse(null))
                    .filter(Objects::nonNull)
                    .sorted(Comparator.<MovieConfig>comparingDouble(mc -> mc.comboWeight).reversed())
                    .map(mc -> mc.token)
                    .collect(Collectors.toList());
            if (pool.isEmpty()) {
                continue;
            }
            int i = 0;
            while (seq.size() < showsPerDay) {
                seq.add(pool.get(i % pool.size()));
                i++;
            }
        }
        return seqs;
    }

    private Map<String, List<int[]>> seedMovieBusy(List<Schedule> existingInRange, LocalDate day,
                                                    Map<String, MovieConfig> movieConfigs) {
        Map<String, List<int[]>> movieBusy = new HashMap<>();
        Set<String> activeMovieIds = movieConfigs.values().stream().map(mc -> mc.movieId).collect(Collectors.toSet());
        for (Schedule s : existingInRange) {
            if (s.getStartTime() == null || s.getEndTime() == null || s.getMovieId() == null) {
                continue;
            }
            if (!s.getStartTime().toLocalDate().equals(day) || !activeMovieIds.contains(s.getMovieId())) {
                continue;
            }
            int startMin = s.getStartTime().getHour() * 60 + s.getStartTime().getMinute();
            int endMin = startMin + (int) Duration.between(s.getStartTime(), s.getEndTime()).toMinutes();
            movieBusy.computeIfAbsent(s.getMovieId(), k -> new ArrayList<>()).add(new int[]{startMin, endMin});
        }
        return movieBusy;
    }

    /** Existing schedules' time intervals for one room on one day, used to avoid overlapping them when inserting into an already-busy room-day. */
    static List<int[]> seedRoomBusy(List<Schedule> existingInRange, LocalDate day, Integer roomId) {
        List<int[]> busy = new ArrayList<>();
        for (Schedule s : existingInRange) {
            if (s.getStartTime() == null || s.getEndTime() == null || s.getCinemaRoomId() == null) {
                continue;
            }
            if (!s.getStartTime().toLocalDate().equals(day) || !s.getCinemaRoomId().equals(roomId)) {
                continue;
            }
            int startMin = s.getStartTime().getHour() * 60 + s.getStartTime().getMinute();
            int endMin = startMin + (int) Duration.between(s.getStartTime(), s.getEndTime()).toMinutes();
            // ScheduleService.validateOverlap also requires the existing schedule's own buffer
            // gap after it; matching that here avoids packing a slot that looks free but gets
            // rejected once buildValidatedSchedule re-checks it for real.
            int existingBuffer = s.getBufferTime() != null ? s.getBufferTime() : DEFAULT_GAP_CLEANUP;
            busy.add(new int[]{startMin, endMin + existingBuffer});
        }
        return busy;
    }

    /**
     * Intentionally NOT {@code @Transactional}: each candidate is persisted via
     * {@link ScheduleService#addSchedule}, which is itself transactional. If this
     * method also opened a transaction, an exception thrown by one candidate's
     * addSchedule call would mark that *shared* transaction rollback-only before
     * reaching this method's try/catch, causing every other (already-succeeded)
     * candidate to be silently rolled back at commit time. Letting each addSchedule
     * call own its transaction makes candidates independent: a bad manual edit
     * only fails itself, not the whole batch.
     */
    public AutoGenerateConfirmResultDTO confirm(AutoGenerateConfirmRequestDTO request) {
        List<ScheduleResponseDTO> saved = new ArrayList<>();
        List<ScheduleCandidateDTO> failed = new ArrayList<>();
        if (request.getCandidates() != null) {
            // Snapshot BEFORE saving anything: room-days that already had schedules
            // (e.g. created between preview and confirm) must reject their whole
            // batch, but cells only becoming busy through this run stay allowed.
            Set<String> busyCells = busyRoomDaysOf(request.getCandidates());
            for (ScheduleCandidateDTO candidate : request.getCandidates()) {
                if (candidate.getStartTime() != null && candidate.getCinemaRoomId() != null
                        && busyCells.contains(roomDayKey(candidate.getStartTime().toLocalDate(), candidate.getCinemaRoomId()))) {
                    candidate.setAccepted(false);
                    candidate.setRejectReason("Phòng này đã có lịch chiếu trong ngày đó — không thể tạo tự động.");
                    failed.add(candidate);
                    continue;
                }
                ScheduleRequestDTO scheduleRequest = ScheduleRequestDTO.builder()
                        .movieId(candidate.getMovieId())
                        .cinemaRoomId(candidate.getCinemaRoomId())
                        .startTime(candidate.getStartTime())
                        .bufferTime(candidate.getBufferTime())
                        .versionId(candidate.getVersionId())
                        .build();
                try {
                    saved.add(scheduleService.addSchedule(scheduleRequest));
                } catch (RuntimeException ex) {
                    candidate.setAccepted(false);
                    candidate.setRejectReason(ex.getMessage());
                    failed.add(candidate);
                }
            }
        }
        return AutoGenerateConfirmResultDTO.builder().saved(saved).failed(failed).build();
    }

    /** Of the candidates' room-day cells, the subset that already has schedules in the database. */
    private Set<String> busyRoomDaysOf(List<ScheduleCandidateDTO> candidates) {
        Set<LocalDate> dates = candidates.stream()
                .map(ScheduleCandidateDTO::getStartTime)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toSet());
        if (dates.isEmpty()) {
            return Collections.emptySet();
        }
        LocalDate min = Collections.min(dates);
        LocalDate max = Collections.max(dates);
        return busyRoomDayKeys(findExistingBetween(min, max));
    }

    private void packRoomDay(CinemaRoom room, List<String> seq, Map<String, MovieConfig> movieById, LocalDate day,
                              LocalTime openTime, LocalTime closeTime, List<GoldenHourConfig> goldenRules,
                              int gapCleanup, int roomIndex, Map<String, List<int[]>> movieBusy,
                              List<int[]> roomBusy, boolean intoBusyDay,
                              List<ScheduleCandidateDTO> accepted, List<ScheduleCandidateDTO> rejected) {
        int openMin = toMin(openTime);
        int lastStartMin = toMin(closeTime);

        int phase = (roomIndex * STAGGER_STEP) % 40;
        List<PlacedEvent> allEvents = placeContinuously(seq, openMin + phase, lastStartMin, gapCleanup, movieById, movieBusy, roomBusy);

        for (PlacedEvent placed : allEvents) {
            MovieConfig movie = movieById.get(placed.token);
            LocalDateTime start = LocalDateTime.of(day, LocalTime.MIDNIGHT).plusMinutes(placed.startMin);
            GoldenHourConfig goldenRule = pricingService.bestMatchingRule(start, goldenRules);
            boolean golden = goldenRule != null;

            ScheduleRequestDTO scheduleRequest = ScheduleRequestDTO.builder()
                    .movieId(movie.movieId)
                    .cinemaRoomId(room.getCinemaRoomId())
                    .startTime(start)
                    .bufferTime(gapCleanup)
                    .versionId(movie.version.getVersionId())
                    .build();

            ScheduleCandidateDTO candidate = ScheduleCandidateDTO.builder()
                    .movieId(movie.movieId)
                    .movieName(movie.movieName)
                    .cinemaRoomId(room.getCinemaRoomId())
                    .cinemaRoomName(room.getCinemaRoomName())
                    .versionId(movie.version.getVersionId())
                    .versionName(movie.version.getVersionName())
                    .startTime(start)
                    .endTime(start.plusMinutes(movie.runtime))
                    .bufferTime(gapCleanup)
                    .goldenHour(golden)
                    .goldenHourExtra(golden ? goldenRule.getExtraPrice() : null)
                    .insertedIntoBusyDay(intoBusyDay)
                    .build();

            try {
                scheduleService.buildValidatedSchedule(scheduleRequest);
                candidate.setAccepted(true);
                accepted.add(candidate);
            } catch (RuntimeException ex) {
                candidate.setAccepted(false);
                candidate.setRejectReason(ex.getMessage());
                rejected.add(candidate);
            }
        }
    }

    /** Largest-remainder distribution of `total` slots across weighted keys. */
    Map<String, Integer> allocateCounts(int total, List<Weight> weights) {
        Map<String, Integer> result = new LinkedHashMap<>();
        if (total <= 0 || weights.isEmpty()) {
            return result;
        }
        double sumW = weights.stream().mapToDouble(w -> w.weight).sum();
        if (sumW <= 0) {
            sumW = 1;
        }
        List<Remainder> remainders = new ArrayList<>();
        int allocated = 0;
        for (Weight w : weights) {
            double exact = (double) total * w.weight / sumW;
            int floor = (int) Math.floor(exact);
            remainders.add(new Remainder(w.key, floor, exact - floor));
            allocated += floor;
        }
        int remaining = total - allocated;
        remainders.sort((a, b) -> Double.compare(b.rem, a.rem));
        for (int i = 0; i < remaining && !remainders.isEmpty(); i++) {
            remainders.get(i % remainders.size()).count++;
        }
        for (Remainder r : remainders) {
            result.merge(r.key, r.count, Integer::sum);
        }
        return result;
    }

    /** Weighted round-robin ordering: always pick the pool with the lowest used/count fraction. */
    private List<String> interleave(Map<String, Integer> countsMap) {
        List<String> seq = new ArrayList<>();
        List<Pool> pools = new ArrayList<>();
        int total = 0;
        for (Map.Entry<String, Integer> e : countsMap.entrySet()) {
            pools.add(new Pool(e.getKey(), e.getValue()));
            total += e.getValue();
        }
        for (int i = 0; i < total; i++) {
            Pool best = null;
            double bestFrac = Double.MAX_VALUE;
            for (Pool p : pools) {
                if (p.used >= p.count) continue;
                double frac = (double) p.used / p.count;
                if (frac < bestFrac) {
                    bestFrac = frac;
                    best = p;
                }
            }
            if (best == null) break;
            best.used++;
            seq.add(best.name);
        }
        return seq;
    }

    /**
     * Sequentially places movies (by id sequence) starting at {@code windowStart}, packing
     * each one right after the previous show's buffer with no gap other than {@code gapCleanup},
     * stopping once a show no longer fits before {@code windowEnd}. Every start time is rounded
     * up to the next {@link #TIME_STEP_MIN}-minute mark.
     */
    static List<PlacedEvent> placeContinuously(List<String> seq, int windowStart, int windowEnd,
                                                int gapCleanup, Map<String, MovieConfig> movieById) {
        return placeContinuously(seq, windowStart, windowEnd, gapCleanup, movieById, new HashMap<>(), Collections.emptyList());
    }

    static List<PlacedEvent> placeContinuously(List<String> seq, int windowStart, int windowEnd,
                                                int gapCleanup, Map<String, MovieConfig> movieById,
                                                Map<String, List<int[]>> movieBusy) {
        return placeContinuously(seq, windowStart, windowEnd, gapCleanup, movieById, movieBusy, Collections.emptyList());
    }

    /**
     * @param roomBusy time intervals already occupied in this room on this day (regardless of
     *                 movie), e.g. from a pre-existing schedule the caller chose not to skip.
     */
    static List<PlacedEvent> placeContinuously(List<String> seq, int windowStart, int windowEnd,
                                                int gapCleanup, Map<String, MovieConfig> movieById,
                                                Map<String, List<int[]>> movieBusy, List<int[]> roomBusy) {
        List<PlacedEvent> events = new ArrayList<>();
        List<String> remaining = new ArrayList<>(seq);
        int cursor = windowStart;
        while (!remaining.isEmpty()) {
            int base = roundUpToStep(cursor, TIME_STEP_MIN);
            int bestIdx = -1;
            int bestStart = Integer.MAX_VALUE;
            for (int i = 0; i < remaining.size(); i++) {
                MovieConfig movie = movieById.get(remaining.get(i));
                if (movie == null) {
                    remaining.remove(i);
                    i--;
                    continue;
                }
                List<int[]> busy = combineBusy(movieBusy.get(movie.movieId), roomBusy);
                int start = earliestWithoutMovieConflict(base, movie.runtime, busy);
                if (start + movie.runtime > windowEnd) {
                    continue;
                }
                if (start < bestStart) {
                    bestStart = start;
                    bestIdx = i;
                }
                if (start == base) {
                    break;
                }
            }
            if (bestIdx < 0) {
                break;
            }
            String token = remaining.remove(bestIdx);
            MovieConfig movie = movieById.get(token);
            PlacedEvent event = new PlacedEvent();
            event.token = token;
            event.startMin = bestStart;
            event.durMin = movie.runtime;
            events.add(event);
            movieBusy.computeIfAbsent(movie.movieId, k -> new ArrayList<>())
                    .add(new int[]{bestStart, bestStart + movie.runtime});
            cursor = bestStart + movie.runtime + gapCleanup;
        }
        return events;
    }

    private static List<int[]> combineBusy(List<int[]> movieBusy, List<int[]> roomBusy) {
        if (movieBusy == null || movieBusy.isEmpty()) {
            return roomBusy;
        }
        if (roomBusy == null || roomBusy.isEmpty()) {
            return movieBusy;
        }
        List<int[]> combined = new ArrayList<>(movieBusy.size() + roomBusy.size());
        combined.addAll(movieBusy);
        combined.addAll(roomBusy);
        return combined;
    }

    static int earliestWithoutMovieConflict(int start, int runtime, List<int[]> busy) {
        if (busy == null || busy.isEmpty()) {
            return start;
        }
        boolean moved = true;
        while (moved) {
            moved = false;
            for (int[] interval : busy) {
                if (start < interval[1] && start + runtime > interval[0]) {
                    start = roundUpToStep(interval[1], TIME_STEP_MIN);
                    moved = true;
                }
            }
        }
        return start;
    }

    /** Rounds {@code minutes} up to the next multiple of {@code step} (no-op if already aligned). */
    static int roundUpToStep(int minutes, int step) {
        int remainder = minutes % step;
        return remainder == 0 ? minutes : minutes + (step - remainder);
    }

    Map<String, MovieConfig> buildMovieConfigs(List<Movie> movies, Map<String, Integer> movieRatios,
                                                         Map<String, Map<Integer, Integer>> movieFormatRatios,
                                                         Map<String, List<Integer>> movieRoomIds,
                                                         List<Integer> poolRoomIds) {
        Map<String, MovieConfig> configs = new LinkedHashMap<>();
        Map<String, Integer> ratios = movieRatios != null ? movieRatios : new HashMap<>();
        Set<Integer> pool = poolRoomIds != null ? new LinkedHashSet<>(poolRoomIds) : Collections.emptySet();

        for (Movie movie : movies) {
            if (movie.getVersions() == null || movie.getVersions().isEmpty()) {
                continue;
            }
            int ratio = clamp(ratios.getOrDefault(movie.getMovieId(), MIN_RATIO), MIN_RATIO, MAX_RATIO);

            Set<Integer> validVersionIds = movie.getVersions().stream()
                    .map(Version::getVersionId).collect(Collectors.toSet());
            Map<Integer, Integer> rawFormatRatios = movieFormatRatios != null ? movieFormatRatios.get(movie.getMovieId()) : null;
            Map<Integer, Integer> formatRatios = new LinkedHashMap<>();
            if (rawFormatRatios != null) {
                for (Map.Entry<Integer, Integer> e : rawFormatRatios.entrySet()) {
                    if (validVersionIds.contains(e.getKey())) {
                        formatRatios.put(e.getKey(), clamp(e.getValue(), MIN_FORMAT_RATIO, MAX_FORMAT_RATIO));
                    }
                }
            }

            List<Version> activeVersions;
            if (formatRatios.isEmpty()) {
                Version first = movie.getVersions().stream()
                        .min(Comparator.comparing(Version::getVersionId)).orElse(null);
                if (first == null) {
                    continue;
                }
                formatRatios.put(first.getVersionId(), MIN_FORMAT_RATIO);
                activeVersions = List.of(first);
            } else {
                activeVersions = movie.getVersions().stream()
                        .filter(v -> formatRatios.containsKey(v.getVersionId()))
                        .collect(Collectors.toList());
            }

            double sumRaw = activeVersions.stream().mapToInt(v -> formatRatios.get(v.getVersionId())).sum();

            List<Integer> rawRoomIds = movieRoomIds != null ? movieRoomIds.get(movie.getMovieId()) : null;
            Set<Integer> allowedRoomIds = null;
            if (rawRoomIds != null && !rawRoomIds.isEmpty()) {
                Set<Integer> filtered = rawRoomIds.stream()
                        .filter(pool::contains)
                        .collect(Collectors.toCollection(LinkedHashSet::new));
                if (!filtered.isEmpty()) {
                    allowedRoomIds = filtered;
                }
            }

            for (Version version : activeVersions) {
                double normalizedShare = formatRatios.get(version.getVersionId()) / sumRaw;

                MovieConfig config = new MovieConfig();
                config.token = movie.getMovieId() + TOKEN_SEP + version.getVersionId();
                config.movieId = movie.getMovieId();
                config.movieName = movie.getMovieNameVn();
                config.runtime = movie.getDuration();
                config.version = version;
                config.comboWeight = ratio * normalizedShare;
                config.allowedRoomIds = allowedRoomIds;
                config.fromDate = movie.getFromDate();
                config.toDate = movie.getToDate();
                configs.put(config.token, config);
            }
        }
        return configs;
    }

    private static int clamp(int value, int min, int max) {
        return Math.min(max, Math.max(min, value));
    }

    private List<String> findIncompatibleMovies(Map<String, MovieConfig> movieConfigs, List<CinemaRoom> rooms) {
        Set<Integer> allRoomVersionIds = new LinkedHashSet<>();
        for (CinemaRoom room : rooms) {
            if (room.getFormats() != null) {
                room.getFormats().forEach(f -> allRoomVersionIds.add(f.getVersionId()));
            }
        }
        Map<String, List<MovieConfig>> byMovie = movieConfigs.values().stream()
                .collect(Collectors.groupingBy(mc -> mc.movieId, LinkedHashMap::new, Collectors.toList()));
        List<String> warnings = new ArrayList<>();
        for (List<MovieConfig> entries : byMovie.values()) {
            boolean anyCompatible = entries.stream()
                    .anyMatch(mc -> allRoomVersionIds.contains(mc.version.getVersionId()));
            if (!anyCompatible) {
                warnings.add(entries.get(0).movieName);
            }
        }
        return warnings;
    }

    private boolean isActiveOnDay(MovieConfig config, LocalDate day) {
        if (config.fromDate != null && day.isBefore(config.fromDate)) {
            return false;
        }
        if (config.toDate != null && day.isAfter(config.toDate)) {
            return false;
        }
        return true;
    }

    List<Movie> resolveMovies(List<String> movieIds, LocalDate rangeStart, LocalDate rangeEnd) {
        return movieRepository.findAllById(movieIds).stream()
                .filter(movie -> movie.getStatus() != MovieStatus.UNSCHEDULED && movie.getStatus() != MovieStatus.INACTIVE)
                .filter(movie -> movie.getDuration() != null && movie.getDuration() > 0)
                .filter(movie -> overlapsRange(movie, rangeStart, rangeEnd))
                .collect(Collectors.toList());
    }

    /** True unless the movie's showing window ([fromDate, toDate], either end optionally unbounded) misses the range entirely. */
    static boolean overlapsRange(Movie movie, LocalDate rangeStart, LocalDate rangeEnd) {
        LocalDate from = movie.getFromDate();
        LocalDate to = movie.getToDate();
        if (from != null && from.isAfter(rangeEnd)) {
            return false;
        }
        if (to != null && to.isBefore(rangeStart)) {
            return false;
        }
        return true;
    }

    private List<CinemaRoom> resolveRooms(List<Integer> roomIds) {
        return cinemaRoomRepository.findAllById(roomIds);
    }

    private int toMin(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
    }

    private LocalTime orDefault(LocalTime value, LocalTime fallback) {
        return value != null ? value : fallback;
    }

    private int orDefault(Integer value, int fallback) {
        return value != null ? value : fallback;
    }

    static class Weight {
        final String key;
        final double weight;

        Weight(String key, double weight) {
            this.key = key;
            this.weight = weight;
        }
    }

    private static class Remainder {
        final String key;
        int count;
        final double rem;

        Remainder(String key, int count, double rem) {
            this.key = key;
            this.count = count;
            this.rem = rem;
        }
    }

    private static class Pool {
        final String name;
        final int count;
        int used = 0;

        Pool(String name, int count) {
            this.name = name;
            this.count = count;
        }
    }
}
