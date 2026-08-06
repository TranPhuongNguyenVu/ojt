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
                .displayStatus(computeDisplayStatus(schedule))
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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phim."));
        CinemaRoom room = cinemaRoomRepository.findById(request.getCinemaRoomId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng chiếu."));
        if (room.getStatus() != CinemaRoomStatus.ACTIVE) {
            throw new IllegalStateException("Không thể xếp lịch cho phòng chiếu đang ngừng hoạt động.");
        }
        if (movie.getStatus() == MovieStatus.UNSCHEDULED || movie.getStatus() == MovieStatus.INACTIVE) {
            throw new IllegalStateException("Không thể xếp lịch cho phim đang ngừng chiếu hoặc chưa mở lịch.");
        }
        if (movie.getToDate() != null &&
            ((movie.getFromDate() != null && request.getStartTime().isBefore(movie.getFromDate().atStartOfDay())) ||
             request.getStartTime().isAfter(movie.getToDate().atTime(23, 59)))) {
            throw new IllegalArgumentException("Giờ chiếu nằm ngoài khoảng thời gian công chiếu của phim.");
        }

        if (request.getVersionId() != null && movie.getVersions() != null) {
            Set<Integer> movieVersionIds = movie.getVersions().stream()
                    .map(Version::getVersionId)
                    .collect(Collectors.toSet());
            if (!movieVersionIds.contains(request.getVersionId())) {
                throw new IllegalArgumentException("Định dạng đã chọn không thuộc phim này.");
            }
        }

        validateRoomSupportsFormat(room, request.getVersionId());

        int buffer = request.getBufferTime() != null ? request.getBufferTime() : 30;
        LocalDateTime endTime = request.getStartTime().plusMinutes(movie.getDuration());

        validateOverlap(request.getCinemaRoomId(), null, request.getStartTime(), endTime, buffer);

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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu."));

        if (schedule.getStatus() == ScheduleStatus.DELETED) {
            throw new IllegalStateException("Suất chiếu đã được xóa, không thể chỉnh sửa.");
        }
        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new IllegalStateException("Suất chiếu đã bị hủy, không thể chỉnh sửa.");
        }
        if (!canCancelOrDelete(schedule)) {
            throw new IllegalStateException(
                    "Không thể chỉnh sửa: suất chiếu bắt đầu trong vòng " + MIN_CANCEL_LEAD_DAYS + " ngày tới chưa thể chỉnh sửa.");
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phim."));
        CinemaRoom room = cinemaRoomRepository.findById(request.getCinemaRoomId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng chiếu."));
        if (room.getStatus() != CinemaRoomStatus.ACTIVE) {
            throw new IllegalStateException("Không thể xếp lịch cho phòng chiếu đang ngừng hoạt động.");
        }
        if (movie.getStatus() == MovieStatus.UNSCHEDULED || movie.getStatus() == MovieStatus.INACTIVE) {
            throw new IllegalStateException("Không thể xếp lịch cho phim đang ngừng chiếu hoặc chưa mở lịch.");
        }
        if (movie.getToDate() != null &&
            ((movie.getFromDate() != null && request.getStartTime().isBefore(movie.getFromDate().atStartOfDay())) ||
             request.getStartTime().isAfter(movie.getToDate().atTime(23, 59)))) {
            throw new IllegalArgumentException("Giờ chiếu nằm ngoài khoảng thời gian công chiếu của phim.");
        }

        // Validate versionId belongs to this movie's supported versions
        if (request.getVersionId() != null && movie.getVersions() != null) {
            Set<Integer> movieVersionIds = movie.getVersions().stream()
                    .map(Version::getVersionId)
                    .collect(Collectors.toSet());
            if (!movieVersionIds.contains(request.getVersionId())) {
                throw new IllegalArgumentException("Định dạng đã chọn không thuộc phim này.");
            }
        }

        validateRoomSupportsFormat(room, request.getVersionId());

        int buffer = request.getBufferTime() != null ? request.getBufferTime() : 30;
        LocalDateTime endTime = request.getStartTime().plusMinutes(movie.getDuration());

        validateOverlap(request.getCinemaRoomId(), id, request.getStartTime(), endTime, buffer);

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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy suất chiếu."));

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
            throw new IllegalArgumentException("Giờ chiếu phải từ ngày mai trở đi.");
        }
        if (startTime.isAfter(maxStartTime)) {
            throw new IllegalArgumentException("Chỉ được tạo lịch trước tối đa 10 ngày.");
        }
    }



    /**
     * Runtime-only status shown to the UI: CANCELLED/DELETED pass through unchanged; otherwise
     * derived from now vs startTime/endTime (SHOWING/ENDED/SCHEDULED). Never persisted, never
     * overrides {@link Schedule#getStatus()}.
     */
    private String computeDisplayStatus(Schedule schedule) {
        ScheduleStatus status = schedule.getStatus();
        if (status == ScheduleStatus.CANCELLED || status == ScheduleStatus.DELETED) {
            return status.name();
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = schedule.getStartTime();
        LocalDateTime endTime = schedule.getEndTime();
        if (endTime != null && now.isAfter(endTime)) {
            return "ENDED";
        }
        if (startTime != null && endTime != null && !now.isBefore(startTime) && !now.isAfter(endTime)) {
            return "SHOWING";
        }
        return ScheduleStatus.SCHEDULED.name();
    }

    private void validateRoomSupportsFormat(CinemaRoom room, Integer versionId) {
        if (versionId == null) {
            return;
        }
        boolean roomSupportsFormat = room.getFormats() != null && room.getFormats().stream()
                .anyMatch(f -> versionId.equals(f.getVersionId()));
        if (!roomSupportsFormat) {
            throw new IllegalArgumentException("Phòng chiếu không hỗ trợ định dạng đã chọn.");
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
            // Skip soft-deleted or cancelled schedules so their time slots can be reused
            if (existing.getStatus() == ScheduleStatus.DELETED || existing.getStatus() == ScheduleStatus.CANCELLED) continue;

            LocalDateTime existingStart = existing.getStartTime();
            LocalDateTime existingEnd = existing.getEndTime();
            if (existingStart == null || existingEnd == null) continue;
            int existingBuffer = existing.getBufferTime() != null ? existing.getBufferTime() : 30;

            // Two-sided overlap check including buffer gaps
            if (newStart.isBefore(existingEnd.plusMinutes(existingBuffer)) &&
                newEnd.plusMinutes(newBuffer).isAfter(existingStart)) {
                throw new IllegalStateException(
                        "Trùng giờ với suất chiếu khác trong cùng phòng (đã tính thời gian nghỉ giữa 2 suất).");
            }
        }
    }
}
