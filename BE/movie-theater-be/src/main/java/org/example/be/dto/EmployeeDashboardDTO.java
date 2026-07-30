package org.example.be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class EmployeeDashboardDTO {
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Overview {
        private OperationalStats operationalStats;
        private List<UpcomingShowtime> upcomingShowtimes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OperationalStats {
        private Long ticketsSoldToday;
        private BigDecimal revenueToday;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpcomingShowtime {
        private Integer scheduleId;
        private String movieName;
        private String movieFormat;
        private LocalDateTime showtime;
        private String cinemaRoom;
        private Long totalSeats;
        private Long soldSeats;
        private Long availableSeats;
        private BigDecimal occupancyRate;
        private Boolean startsSoon;
    }
}
