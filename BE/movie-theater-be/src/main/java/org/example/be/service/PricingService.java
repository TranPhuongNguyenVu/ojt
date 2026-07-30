package org.example.be.service;

import org.example.be.entity.GoldenHourConfig;
import org.example.be.entity.Schedule;
import org.example.be.entity.Seat;
import org.example.be.entity.Version;
import org.example.be.repository.GoldenHourConfigRepository;
import org.example.be.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PricingService {

    public static final BigDecimal FALLBACK_BASE_PRICE = new BigDecimal("80000");

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private GoldenHourConfigRepository goldenHourConfigRepository;

    @Transactional(readOnly = true)
    public BigDecimal calculatePrice(Schedule schedule, Seat seat) {
        Version version = versionOf(schedule);
        return combine(version, seat, goldenHourExtra(schedule.getStartTime()));
    }

    @Transactional(readOnly = true)
    public Map<Integer, BigDecimal> calculatePrices(Schedule schedule, List<Seat> seats) {
        Version version = versionOf(schedule);
        BigDecimal goldenExtra = goldenHourExtra(schedule.getStartTime());
        Map<Integer, BigDecimal> prices = new LinkedHashMap<>();
        for (Seat seat : seats) {
            prices.put(seat.getSeatId(), combine(version, seat, goldenExtra));
        }
        return prices;
    }

    /** Base + seat-type surcharge for a format, with no golden-hour extra (no specific showtime in context). */
    public BigDecimal calculateSeatFormatPrice(Version version, Seat seat) {
        return combine(version, seat, BigDecimal.ZERO);
    }

    private BigDecimal combine(Version version, Seat seat, BigDecimal goldenExtra) {
        BigDecimal basePrice = version != null ? version.getBasePrice() : FALLBACK_BASE_PRICE;
        return basePrice.add(seatTypeSurcharge(version, seat)).add(goldenExtra);
    }

    private BigDecimal seatTypeSurcharge(Version version, Seat seat) {
        if (version == null || seat == null || seat.getSeatType() == null) {
            return BigDecimal.ZERO;
        }
        if (seat.getSeatType() == SeatService.SEAT_TYPE_VIP) {
            return version.getVipPrice() != null ? version.getVipPrice() : BigDecimal.ZERO;
        }
        if (seat.getSeatType() == SeatService.SEAT_TYPE_COUPLE) {
            return version.getCouplePrice() != null ? version.getCouplePrice() : BigDecimal.ZERO;
        }
        return BigDecimal.ZERO;
    }

    private Version versionOf(Schedule schedule) {
        if (schedule == null || schedule.getVersionId() == null) {
            return null;
        }
        return versionRepository.findById(schedule.getVersionId()).orElse(null);
    }

    @Transactional(readOnly = true)
    public BigDecimal basePriceOf(Schedule schedule) {
        Version version = versionOf(schedule);
        return version != null ? version.getBasePrice() : FALLBACK_BASE_PRICE;
    }

    @Transactional(readOnly = true)
    public BigDecimal goldenHourExtra(LocalDateTime startTime) {
        if (startTime == null) {
            return BigDecimal.ZERO;
        }
        return goldenHourExtra(startTime, goldenHourConfigRepository.findByActiveTrue());
    }

    public BigDecimal goldenHourExtra(LocalDateTime startTime, List<GoldenHourConfig> activeRules) {
        GoldenHourConfig best = bestMatchingRule(startTime, activeRules);
        return best != null ? best.getExtraPrice() : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public GoldenHourConfig bestMatchingRule(LocalDateTime startTime) {
        if (startTime == null) {
            return null;
        }
        return bestMatchingRule(startTime, activeGoldenRules());
    }

    @Transactional(readOnly = true)
    public List<GoldenHourConfig> activeGoldenRules() {
        return goldenHourConfigRepository.findByActiveTrue();
    }

    /** The active rule that applies to startTime with the highest extraPrice (ties resolved by rule order). */
    public GoldenHourConfig bestMatchingRule(LocalDateTime startTime, List<GoldenHourConfig> activeRules) {
        if (startTime == null || activeRules == null) {
            return null;
        }
        return activeRules.stream()
                .filter(rule -> matches(rule, startTime))
                .max(Comparator.comparing(GoldenHourConfig::getExtraPrice))
                .orElse(null);
    }

    public boolean matches(GoldenHourConfig rule, LocalDateTime startTime) {
        if (rule.getStartTime() == null || rule.getEndTime() == null || startTime == null) {
            return false;
        }
        DayOfWeek day = startTime.getDayOfWeek();
        if (!rule.daysOfWeekSet().contains(day)) {
            return false;
        }
        LocalTime time = startTime.toLocalTime();
        return !time.isBefore(rule.getStartTime()) && !time.isAfter(rule.getEndTime());
    }
}
