package org.example.be.service;

import jakarta.persistence.EntityNotFoundException;
import org.example.be.dto.GoldenHourConfigDTO;
import org.example.be.dto.GoldenHourConfigRequestDTO;
import org.example.be.entity.GoldenHourConfig;
import org.example.be.entity.Schedule;
import org.example.be.entity.Version;
import org.example.be.exception.GlobalExceptionHandler.PriceChangeConflictException;
import org.example.be.repository.GoldenHourConfigRepository;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PricingConfigService {

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private GoldenHourConfigRepository goldenHourConfigRepository;

    @Autowired
    private PricingService pricingService;

    @Transactional
    public Version updateRoomFormatBasePrice(Integer versionId, BigDecimal basePrice, boolean force) {
        if (basePrice == null || basePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá vé cơ bản phải lớn hơn 0.");
        }
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy định dạng ID: " + versionId));

        if (!force) {
            long affected = scheduleRepository.countFutureByVersionId(versionId, LocalDateTime.now());
            if (affected > 0) {
                throw new PriceChangeConflictException(affected);
            }
        }

        version.setBasePrice(basePrice);
        return versionRepository.save(version);
    }

    /**
     * Phụ thu ghế VIP/ghế đôi được cấu hình theo ĐỊNH DẠNG chiếu (3D/IMAX/4DX/...), lưu trực tiếp
     * trên Version (vipPrice/couplePrice) — không phải theo từng phòng hay từng ghế.
     */
    @Transactional
    public Version updateSeatTypeSurcharge(Integer versionId, Integer seatType, BigDecimal surcharge, boolean force) {
        if (surcharge == null || surcharge.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Phụ thu ghế không được âm.");
        }
        if (seatType == null || (seatType != SeatService.SEAT_TYPE_VIP && seatType != SeatService.SEAT_TYPE_COUPLE)) {
            throw new IllegalArgumentException("Chỉ có thể cập nhật phụ thu cho ghế VIP hoặc ghế đôi.");
        }
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy định dạng ID: " + versionId));

        if (!force) {
            long affected = scheduleRepository.countFutureByVersionId(versionId, LocalDateTime.now());
            if (affected > 0) {
                throw new PriceChangeConflictException(affected);
            }
        }

        if (seatType == SeatService.SEAT_TYPE_VIP) {
            version.setVipPrice(surcharge);
        } else {
            version.setCouplePrice(surcharge);
        }
        return versionRepository.save(version);
    }

    @Transactional(readOnly = true)
    public List<GoldenHourConfigDTO> getGoldenHours() {
        return goldenHourConfigRepository.findAll().stream()
                .sorted(Comparator.comparing(GoldenHourConfig::getGoldenHourId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public GoldenHourConfigDTO createGoldenHour(GoldenHourConfigRequestDTO request, boolean force) {
        validateGoldenHourRequest(request, true);

        GoldenHourConfig config = new GoldenHourConfig();
        applyRequest(config, request);
        validateNoOverlap(config, null);

        if (!force && Boolean.TRUE.equals(config.getActive())) {
            long affected = countFutureMatching(List.of(config));
            if (affected > 0) {
                throw new PriceChangeConflictException(affected);
            }
        }

        return toDTO(goldenHourConfigRepository.save(config));
    }

    @Transactional
    public GoldenHourConfigDTO updateGoldenHour(Integer id, GoldenHourConfigRequestDTO request, boolean force) {
        GoldenHourConfig config = goldenHourConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ vàng ID: " + id));
        validateGoldenHourRequest(request, false);

        GoldenHourConfig updated = new GoldenHourConfig();
        updated.setStartTime(request.getStartTime() != null ? request.getStartTime() : config.getStartTime());
        updated.setEndTime(request.getEndTime() != null ? request.getEndTime() : config.getEndTime());
        if (request.getDaysOfWeek() != null) {
            updated.setDaysOfWeekSet(new LinkedHashSet<>(request.getDaysOfWeek()));
        } else {
            updated.setDaysOfWeek(config.getDaysOfWeek());
        }
        updated.setExtraPrice(request.getExtraPrice() != null ? request.getExtraPrice() : config.getExtraPrice());
        updated.setActive(request.getActive() != null ? request.getActive() : config.getActive());

        if (updated.getStartTime() == null || updated.getEndTime() == null
                || !updated.getStartTime().isBefore(updated.getEndTime())) {
            throw new IllegalArgumentException("Giờ bắt đầu phải trước giờ kết thúc.");
        }
        validateNoOverlap(updated, id);

        if (!force) {
            List<GoldenHourConfig> impactedRules = new ArrayList<>();
            if (Boolean.TRUE.equals(config.getActive())) {
                impactedRules.add(config);
            }
            if (Boolean.TRUE.equals(updated.getActive())) {
                impactedRules.add(updated);
            }
            long affected = countFutureMatching(impactedRules);
            if (affected > 0) {
                throw new PriceChangeConflictException(affected);
            }
        }

        config.setStartTime(updated.getStartTime());
        config.setEndTime(updated.getEndTime());
        config.setDaysOfWeek(updated.getDaysOfWeek());
        config.setExtraPrice(updated.getExtraPrice());
        config.setActive(updated.getActive());
        return toDTO(goldenHourConfigRepository.save(config));
    }

    @Transactional
    public void deleteGoldenHour(Integer id, boolean force) {
        GoldenHourConfig config = goldenHourConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ vàng ID: " + id));

        if (!force && Boolean.TRUE.equals(config.getActive())) {
            long affected = countFutureMatching(List.of(config));
            if (affected > 0) {
                throw new PriceChangeConflictException(affected);
            }
        }

        goldenHourConfigRepository.delete(config);
    }

    private long countFutureMatching(List<GoldenHourConfig> rules) {
        if (rules.isEmpty()) {
            return 0;
        }
        List<Schedule> futureSchedules = scheduleRepository.findFutureActive(LocalDateTime.now());
        return futureSchedules.stream()
                .filter(s -> rules.stream().anyMatch(rule -> pricingService.matches(rule, s.getStartTime())))
                .count();
    }

    private void validateGoldenHourRequest(GoldenHourConfigRequestDTO request, boolean isCreate) {
        if (isCreate) {
            if (request.getStartTime() == null || request.getEndTime() == null) {
                throw new IllegalArgumentException("Vui lòng nhập giờ bắt đầu và giờ kết thúc.");
            }
            if (request.getDaysOfWeek() == null || request.getDaysOfWeek().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng chọn ít nhất một ngày áp dụng.");
            }
            if (request.getExtraPrice() == null) {
                throw new IllegalArgumentException("Vui lòng nhập phụ thu giờ vàng.");
            }
        }
        if (request.getStartTime() != null && request.getEndTime() != null
                && !request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Giờ bắt đầu phải trước giờ kết thúc.");
        }
        if (request.getDaysOfWeek() != null && request.getDaysOfWeek().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một ngày áp dụng.");
        }
        if (request.getExtraPrice() != null && request.getExtraPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Phụ thu giờ vàng không được âm.");
        }
    }

    private void validateNoOverlap(GoldenHourConfig candidate, Integer excludeId) {
        if (!Boolean.TRUE.equals(candidate.getActive())) {
            return;
        }
        Set<DayOfWeek> candidateDays = candidate.daysOfWeekSet();
        for (GoldenHourConfig other : goldenHourConfigRepository.findByActiveTrue()) {
            if (excludeId != null && excludeId.equals(other.getGoldenHourId())) {
                continue;
            }
            boolean sharesDay = other.daysOfWeekSet().stream().anyMatch(candidateDays::contains);
            if (!sharesDay) {
                continue;
            }
            boolean timeOverlap = !candidate.getStartTime().isAfter(other.getEndTime())
                    && !other.getStartTime().isAfter(candidate.getEndTime());
            if (timeOverlap) {
                throw new IllegalArgumentException("Khung giờ vàng này trùng với khung giờ "
                        + other.getStartTime() + "-" + other.getEndTime() + " đã có.");
            }
        }
    }

    private void applyRequest(GoldenHourConfig config, GoldenHourConfigRequestDTO request) {
        config.setStartTime(request.getStartTime());
        config.setEndTime(request.getEndTime());
        Set<DayOfWeek> days = new LinkedHashSet<>(request.getDaysOfWeek());
        config.setDaysOfWeekSet(days);
        config.setExtraPrice(request.getExtraPrice());
        config.setActive(request.getActive() != null ? request.getActive() : Boolean.TRUE);
    }

    private GoldenHourConfigDTO toDTO(GoldenHourConfig config) {
        return GoldenHourConfigDTO.builder()
                .goldenHourId(config.getGoldenHourId())
                .startTime(config.getStartTime())
                .endTime(config.getEndTime())
                .daysOfWeek(new ArrayList<>(config.daysOfWeekSet()))
                .extraPrice(config.getExtraPrice())
                .active(config.getActive())
                .build();
    }
}
