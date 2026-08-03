package org.example.be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDTO {
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Filter {
        private String timeFilter;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDateTime startDateTime;
        private LocalDateTime endDateTime;
        private String movieId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Kpi {
        private BigDecimal totalRevenue;
        private Long totalTicketsSold;
        private BigDecimal averageOccupancyRate;
        private BigDecimal averageRevenuePerTicket;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Trend {
        private String label;
        private BigDecimal revenue;
        private Long ticketsSold;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MovieRevenue {
        private String movieId;
        private String movieName;
        private Long ticketsSold;
        private BigDecimal totalRevenue;
        private BigDecimal averageOccupancyRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSlot {
        private String timeSlot;
        private Long ticketsSold;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Operational {
        private Long activeShowtimes;
        private Long ticketsSoldToday;
        private BigDecimal todayRevenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Overview {
        private Kpi kpis;
        private List<Trend> revenueTrend;
        private List<MovieRevenue> revenueByMovie;
        private List<TimeSlot> ticketSalesByTimeSlot;
        private List<MovieRevenue> topRevenueMovies;
        private Operational operational;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MovieOption {
        private String movieId;
        private String movieName;
    }
}
