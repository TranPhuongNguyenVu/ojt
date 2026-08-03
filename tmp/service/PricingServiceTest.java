package org.example.be.service;

import org.example.be.entity.GoldenHourConfig;
import org.example.be.entity.Schedule;
import org.example.be.entity.Seat;
import org.example.be.entity.Version;
import org.example.be.repository.GoldenHourConfigRepository;
import org.example.be.repository.VersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private VersionRepository versionRepository;

    @Mock
    private GoldenHourConfigRepository goldenHourConfigRepository;

    @InjectMocks
    private PricingService pricingService;

    private Version version2D;
    private Version versionImax;
    private GoldenHourConfig goldenRule;

    @BeforeEach
    void setUp() {
        version2D = Version.builder()
                .versionId(1)
                .versionName("2D")
                .basePrice(new BigDecimal("70000"))
                .vipPrice(new BigDecimal("20000"))
                .couplePrice(new BigDecimal("50000"))
                .build();

        versionImax = Version.builder()
                .versionId(2)
                .versionName("IMAX")
                .basePrice(new BigDecimal("120000"))
                .vipPrice(new BigDecimal("30000"))
                .couplePrice(new BigDecimal("60000"))
                .build();

        goldenRule = GoldenHourConfig.builder()
                .goldenHourId(1)
                .startTime(java.time.LocalTime.of(18, 0))
                .endTime(java.time.LocalTime.of(21, 0))
                .extraPrice(new BigDecimal("20000"))
                .active(true)
                .build();
        goldenRule.setDaysOfWeekSet(EnumSet.allOf(DayOfWeek.class));

        lenient().when(versionRepository.findById(anyInt())).thenReturn(Optional.empty());
        lenient().when(versionRepository.findById(1)).thenReturn(Optional.of(version2D));
        lenient().when(versionRepository.findById(2)).thenReturn(Optional.of(versionImax));
    }

    private Schedule scheduleFor(Integer versionId, LocalDateTime startTime) {
        Schedule schedule = new Schedule();
        schedule.setVersionId(versionId);
        schedule.setStartTime(startTime);
        return schedule;
    }

    private Seat seatOfType(int seatType) {
        return Seat.builder().seatId(1).seatType(seatType).build();
    }

    @Test
    void normalSeatOutsideGoldenHourIsJustBasePrice() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 10, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_NORMAL));

        assertEquals(new BigDecimal("70000"), price);
    }

    @Test
    void vipSeatOutsideGoldenHourAddsVipSurcharge() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 10, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_VIP));

        assertEquals(new BigDecimal("90000"), price);
    }

    @Test
    void coupleSeatOutsideGoldenHourAddsCoupleSurcharge() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 10, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_COUPLE));

        assertEquals(new BigDecimal("120000"), price);
    }

    @Test
    void normalSeatInGoldenHourAddsGoldenExtra() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 19, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_NORMAL));

        assertEquals(new BigDecimal("90000"), price);
    }

    @Test
    void vipSeatInGoldenHourAddsBothSurcharges() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 19, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_VIP));

        assertEquals(new BigDecimal("110000"), price);
    }

    @Test
    void coupleSeatInGoldenHourAddsBothSurcharges() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 19, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_COUPLE));

        assertEquals(new BigDecimal("140000"), price);
    }

    @Test
    void imaxFormatUsesItsOwnBasePriceAndSurcharges() {
        Schedule schedule = scheduleFor(2, LocalDateTime.of(2026, 7, 20, 10, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of());

        assertEquals(new BigDecimal("120000"),
                pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_NORMAL)));
        assertEquals(new BigDecimal("150000"),
                pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_VIP)));
        assertEquals(new BigDecimal("180000"),
                pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_COUPLE)));
    }

    @Test
    void unknownVersionFallsBackToDefaultBasePrice() {
        Schedule schedule = scheduleFor(999, LocalDateTime.of(2026, 7, 20, 10, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of());

        BigDecimal price = pricingService.calculatePrice(schedule, seatOfType(SeatService.SEAT_TYPE_NORMAL));

        assertEquals(PricingService.FALLBACK_BASE_PRICE, price);
    }

    @Test
    void calculatePricesBatchesMultipleSeatsForSameSchedule() {
        Schedule schedule = scheduleFor(1, LocalDateTime.of(2026, 7, 20, 19, 0));
        when(goldenHourConfigRepository.findByActiveTrue()).thenReturn(List.of(goldenRule));

        Seat normal = Seat.builder().seatId(1).seatType(SeatService.SEAT_TYPE_NORMAL).build();
        Seat vip = Seat.builder().seatId(2).seatType(SeatService.SEAT_TYPE_VIP).build();
        Seat couple = Seat.builder().seatId(3).seatType(SeatService.SEAT_TYPE_COUPLE).build();

        var prices = pricingService.calculatePrices(schedule, List.of(normal, vip, couple));

        assertEquals(new BigDecimal("90000"), prices.get(1));
        assertEquals(new BigDecimal("110000"), prices.get(2));
        assertEquals(new BigDecimal("140000"), prices.get(3));
    }

    @Test
    void calculateSeatFormatPriceIgnoresGoldenHour() {
        BigDecimal price = pricingService.calculateSeatFormatPrice(version2D, seatOfType(SeatService.SEAT_TYPE_VIP));

        assertEquals(new BigDecimal("90000"), price);
    }
}
