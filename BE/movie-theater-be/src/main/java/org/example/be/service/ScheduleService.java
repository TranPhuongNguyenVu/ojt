package org.example.be.service;

import org.example.be.dto.ScheduleRequestDTO;
import org.example.be.dto.ScheduleResponseDTO;
import org.example.be.entity.GoldenHourConfig;
import org.example.be.entity.Schedule;
import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.example.be.enums.ScheduleStatus;
import org.example.be.entity.Version;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.MovieRepository;
import org.example.be.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private PricingService pricingService;

    private ScheduleResponseDTO toResponseDTO(Schedule schedule) {
        return toResponseDTO(schedule, pricingService.activeGoldenRules());
    }

    private ScheduleResponseDTO toResponseDTO(Schedule schedule, List<GoldenHourConfig> goldenRules) {
        CinemaRoom room = schedule.getCinemaRoom();

        // Resolve the actual format name from the stored versionId
        String movieFormat = "—";
        if (schedule.getVersionId() != null) {
            Version version = versionRepository.findById(schedule.getVersionId()).orElse(null);
            if (version != null) movieFormat = version.getVersionName();
        }

        GoldenHourConfig goldenRule = pricingService.bestMatchingRule(schedule.getStartTime(), goldenRules);

        return ScheduleResponseDTO.builder()
                .scheduleId(schedule.getScheduleId())
                .movieId(schedule.getMovieId())
                .cinemaRoomId(schedule.getCinemaRoomId())
                .cinemaRoomName(room != null ? room.getCinemaRoomName() : "N/A")
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .bufferTime(schedule.getBufferTime())
                .versionId(schedule.getVersionId())
                .movieFormat(movieFormat)
                .status(schedule.getStatus() != null ? schedule.getStatus().name() : null)
                .goldenHourStart(goldenRule != null ? goldenRule.getStartTime() : null)
                .goldenHourEnd(goldenRule != null ? goldenRule.getEndTime() : null)
                .goldenHourExtra(goldenRule != null ? goldenRule.getExtraPrice() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponseDTO> getSchedulesByMovieId(String movieId) {
        List<GoldenHourConfig> goldenRules = pricingService.activeGoldenRules();
        return scheduleRepository.findByMovieId(movieId).stream()
                .map(s -> toResponseDTO(s, goldenRules))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScheduleResponseDTO getScheduleById(Integer id) {
        return scheduleRepository.findById(id)
                .map(this::toResponseDTO)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponseDTO> getSchedulesByCinemaRoomId(Integer cinemaRoomId) {
        List<GoldenHourConfig> goldenRules = pricingService.activeGoldenRules();
        return scheduleRepository.findByCinemaRoomId(cinemaRoomId).stream()
                .map(s -> toResponseDTO(s, goldenRules))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponseDTO> filterSchedules(String movieId, Integer cinemaRoomId, LocalDate date) {
        List<GoldenHourConfig> goldenRules = pricingService.activeGoldenRules();
        return scheduleRepository.findAllWithRoom().stream()
                .filter(s -> movieId == null || movieId.equals(s.getMovieId()))
                .filter(s -> cinemaRoomId == null || cinemaRoomId.equals(s.getCinemaRoomId()))
                .filter(s -> date == null || (s.getStartTime() != null && date.equals(s.getStartTime().toLocalDate())))
                .map(s -> toResponseDTO(s, goldenRules))
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleResponseDTO addSchedule(ScheduleRequestDTO request) {
        return toResponseDTO(scheduleRepository.save(buildValidatedSchedule(request)));
    }

    /**
     * Validates a schedule request and builds a (transient, unsaved) Schedule entity.
     *
     * <p>Intentionally NOT annotated with {@code @Transactional}: it is a read+validate
     * helper invoked from within an already-open transaction (e.g. {@link #addSchedule}
     * or {@code AutoGenerateService.generatePreview}). If it declared its own transactional
     * boundary, a validation {@code RuntimeException} caught by the caller (as the
     * auto-generate preview does per candidate) would still mark the shared transaction
     * rollback-only, causing "Transaction silently rolled back because it has been marked
     * as rollback-only" at commit. Running boundary-less lets callers catch rejections
     * without poisoning their transaction.
     */
    public Schedule buildValidatedSchedule(ScheduleRequestDTO request) {
        validateDate(request.getStartTime());
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));
        CinemaRoom room = cinemaRoomRepository.findById(request.getCinemaRoomId())
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));
        if (room.getStatus() != CinemaRoomStatus.ACTIVE) {
            throw new IllegalStateException("Cannot schedule in an inactive room.");
        }
        if (movie.getStatus() == MovieStatus.INACTIVE || movie.getStatus() == MovieStatus.DELETED) {
            throw new IllegalStateException("Cannot schedule an inactive movie.");
        }
        if (movie.getToDate() != null &&
            (request.getStartTime().isBefore(movie.getFromDate().atStartOfDay()) ||
             request.getStartTime().isAfter(movie.getToDate().atTime(23, 59)))) {
            throw new IllegalArgumentException("Schedule start time must be within movie showing range.");
        }

        if (request.getVersionId() != null && movie.getVersions() != null) {
            Set<Integer> movieVersionIds = movie.getVersions().stream()
                    .map(Version::getVersionId)
                    .collect(Collectors.toSet());
            if (!movieVersionIds.contains(request.getVersionId())) {
                throw new IllegalArgumentException("Selected version is not supported by this movie.");
            }
        }

        validateRoomSupportsFormat(room, request.getVersionId());

        int buffer = request.getBufferTime() != null ? request.getBufferTime() : 30;
        LocalDateTime endTime = request.getStartTime().plusMinutes(movie.getDuration());

        validateOverlap(request.getCinemaRoomId(), null, request.getStartTime(), endTime, buffer);
        validateMovieOverlapAcrossRooms(request.getMovieId(), null, request.getStartTime(), endTime);

        Schedule schedule = new Schedule();
        schedule.setMovieId(request.getMovieId());
        schedule.setCinemaRoom(room);
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(endTime);
        schedule.setBufferTime(buffer);
        schedule.setVersionId(request.getVersionId());

        return schedule;
    }

    @Transactional
    public ScheduleResponseDTO updateSchedule(Integer id, ScheduleRequestDTO request) {
        validateDate(request.getStartTime());
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));
        CinemaRoom room = cinemaRoomRepository.findById(request.getCinemaRoomId())
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));
        if (room.getStatus() != CinemaRoomStatus.ACTIVE) {
            throw new IllegalStateException("Cannot schedule in an inactive room.");
        }
        if (movie.getStatus() == MovieStatus.INACTIVE || movie.getStatus() == MovieStatus.DELETED) {
            throw new IllegalStateException("Cannot schedule an inactive movie.");
        }
        if (movie.getToDate() != null &&
            (request.getStartTime().isBefore(movie.getFromDate().atStartOfDay()) ||
             request.getStartTime().isAfter(movie.getToDate().atTime(23, 59)))) {
            throw new IllegalArgumentException("Schedule start time must be within movie showing range.");
        }

        // Validate versionId belongs to this movie's supported versions
        if (request.getVersionId() != null && movie.getVersions() != null) {
            Set<Integer> movieVersionIds = movie.getVersions().stream()
                    .map(Version::getVersionId)
                    .collect(Collectors.toSet());
            if (!movieVersionIds.contains(request.getVersionId())) {
                throw new IllegalArgumentException("Selected version is not supported by this movie.");
            }
        }

        validateRoomSupportsFormat(room, request.getVersionId());

        int buffer = request.getBufferTime() != null ? request.getBufferTime() : 30;
        LocalDateTime endTime = request.getStartTime().plusMinutes(movie.getDuration());

        validateOverlap(request.getCinemaRoomId(), id, request.getStartTime(), endTime, buffer);
        validateMovieOverlapAcrossRooms(request.getMovieId(), id, request.getStartTime(), endTime);

        schedule.setMovieId(request.getMovieId());
        schedule.setCinemaRoom(room);
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(endTime);
        schedule.setBufferTime(buffer);
        schedule.setVersionId(request.getVersionId());

        return toResponseDTO(scheduleRepository.save(schedule));
    }

    /** Minimum lead time required to cancel/delete a schedule that is still SCHEDULED/SOLD_OUT. */
    private static final long MIN_CANCEL_LEAD_DAYS = 2;

    @Transactional
    public void deleteSchedule(Integer id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found"));

        if (schedule.getStatus() == ScheduleStatus.DELETED) {
            throw new IllegalStateException("Suất chiếu đã được xóa trước đó.");
        }

        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            schedule.setStatus(ScheduleStatus.DELETED);
            scheduleRepository.save(schedule);
            return;
        }

        if (!canCancelOrDelete(schedule)) {
            throw new IllegalStateException(
                    "Không thể xóa: suất chiếu bắt đầu trong vòng " + MIN_CANCEL_LEAD_DAYS + " ngày tới chưa thể hủy.");
        }

        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setStatus(ScheduleStatus.DELETED);
        scheduleRepository.save(schedule);
    }

    /**
     * True if a SCHEDULED/SOLD_OUT schedule is far enough in the future to be cancelled/deleted
     * (at least {@link #MIN_CANCEL_LEAD_DAYS} days before its start time). Schedules already
     * CANCELLED/DELETED are trivially cancellable/deletable by this check's callers, which branch
     * on status before reaching here.
     */
    public boolean canCancelOrDelete(Schedule schedule) {
        if (schedule.getStatus() == ScheduleStatus.CANCELLED || schedule.getStatus() == ScheduleStatus.DELETED) {
            return true;
        }
        return schedule.getStartTime() != null
                && !schedule.getStartTime().isBefore(LocalDateTime.now().plusDays(MIN_CANCEL_LEAD_DAYS));
    }

    private void validateDate(LocalDateTime startTime) {
        LocalDateTime minStartTime = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime maxStartTime = LocalDate.now().plusDays(10).atTime(23, 59);
        if (startTime.isBefore(minStartTime)) {
            throw new IllegalArgumentException("Schedule start time must be at least from tomorrow onwards.");
        }
        if (startTime.isAfter(maxStartTime)) {
            throw new IllegalArgumentException("Schedule cannot be created more than 10 days in advance.");
        }
    }

    private void validateMovieOverlapAcrossRooms(String movieId, Integer excludeId,
                                                  LocalDateTime newStart, LocalDateTime newEnd) {
        for (Schedule existing : scheduleRepository.findActiveByMovieId(movieId)) {
            if (excludeId != null && existing.getScheduleId().equals(excludeId)) continue;
            if (existing.getStatus() == ScheduleStatus.CANCELLED) continue;
            if (existing.getStartTime() == null || existing.getEndTime() == null) continue;
            if (newStart.isBefore(existing.getEndTime()) && newEnd.isAfter(existing.getStartTime())) {
                throw new IllegalStateException("Movie already has an overlapping showtime in another room.");
            }
        }
    }

    private void validateRoomSupportsFormat(CinemaRoom room, Integer versionId) {
        if (versionId == null) {
            return;
        }
        boolean roomSupportsFormat = room.getFormats() != null && room.getFormats().stream()
                .anyMatch(f -> versionId.equals(f.getVersionId()));
        if (!roomSupportsFormat) {
            throw new IllegalArgumentException("Selected room does not support the chosen format.");
        }
    }

    /**
     * Validates that a new/updated schedule does not overlap with existing ones in the same room.
     *
     * @param roomId        The cinema room to check
     * @param excludeId     The schedule ID to exclude from checks (for update operations; null for create)
     * @param newStart      Start time of the new/updated schedule
     * @param newEnd        End time of the new/updated schedule
     * @param newBuffer     Buffer time (minutes) of the new/updated schedule
     */
    private void validateOverlap(Integer roomId, Integer excludeId,
                                  LocalDateTime newStart, LocalDateTime newEnd, int newBuffer) {
        List<Schedule> existingSchedules = scheduleRepository.findByCinemaRoomId(roomId);
        for (Schedule existing : existingSchedules) {
            // Skip the schedule being updated
            if (excludeId != null && existing.getScheduleId().equals(excludeId)) continue;

            LocalDateTime existingStart = existing.getStartTime();
            LocalDateTime existingEnd = existing.getEndTime();
            int existingBuffer = existing.getBufferTime() != null ? existing.getBufferTime() : 30;

            // Two-sided overlap check including buffer gaps
            if (newStart.isBefore(existingEnd.plusMinutes(existingBuffer)) &&
                newEnd.plusMinutes(newBuffer).isAfter(existingStart)) {
                throw new IllegalStateException("Schedule overlaps with existing showtime.");
            }
        }
    }
}
