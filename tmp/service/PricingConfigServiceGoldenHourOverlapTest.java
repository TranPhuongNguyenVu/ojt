package org.example.be.service;

import org.example.be.dto.GoldenHourConfigRequestDTO;
import org.example.be.entity.GoldenHourConfig;
import org.example.be.repository.GoldenHourConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PricingConfigServiceGoldenHourOverlapTest {

    @Mock private GoldenHourConfigRepository goldenHourConfigRepository;

    @InjectMocks
    private PricingConfigService pricingConfigService;

    private GoldenHourConfig existing;

    @BeforeEach
    void setUp() {
        existing = GoldenHourConfig.builder()
                .goldenHourId(1)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(21, 0))
                .extraPrice(new BigDecimal("20000"))
                .active(true)
                .build();
        existing.setDaysOfWeekSet(java.util.EnumSet.allOf(DayOfWeek.class));
        lenient().when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(existing));
        lenient().when(goldenHourConfigRepository.save(org.mockito.ArgumentMatchers.any(GoldenHourConfig.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private GoldenHourConfigRequestDTO request(String start, String end, List<DayOfWeek> days, String extra) {
        return GoldenHourConfigRequestDTO.builder()
                .startTime(LocalTime.parse(start))
                .endTime(LocalTime.parse(end))
                .daysOfWeek(days)
                .extraPrice(new BigDecimal(extra))
                .active(true)
                .build();
    }

    @Test
    void rejectsOverlappingWindowOnSharedDay() {
        GoldenHourConfigRequestDTO overlapping = request("20:00", "22:00", List.of(DayOfWeek.MONDAY), "10000");
        assertThrows(IllegalArgumentException.class,
                () -> pricingConfigService.createGoldenHour(overlapping, false));
    }

    @Test
    void rejectsExactSameWindowOnSharedDay() {
        GoldenHourConfigRequestDTO sameWindow = request("18:00", "21:00", List.of(DayOfWeek.FRIDAY), "10000");
        assertThrows(IllegalArgumentException.class,
                () -> pricingConfigService.createGoldenHour(sameWindow, false));
    }

    @Test
    void allowsAdjacentNonOverlappingWindow() {
        // matches() treats endTime as inclusive, so a window must start after 21:00 (not at it)
        // to avoid a 21:00-start showtime matching both rules.
        GoldenHourConfigRequestDTO adjacent = request("21:01", "22:00", List.of(DayOfWeek.MONDAY), "10000");
        assertDoesNotThrow(() -> pricingConfigService.createGoldenHour(adjacent, true));
    }

    @Test
    void allowsOverlappingWindowOnDisjointDays() {
        GoldenHourConfigRequestDTO disjointDay =
                request("18:00", "21:00", List.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY), "10000");
        existing.setDaysOfWeekSet(java.util.EnumSet.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY));
        assertDoesNotThrow(() -> pricingConfigService.createGoldenHour(disjointDay, true));
    }
}
