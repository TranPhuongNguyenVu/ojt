package org.example.be.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatStatusEventDTO {
    private Integer scheduleId;
    private List<SeatStatusItem> seats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatStatusItem {
        private Integer seatId;
        /** 0=AVAILABLE, 1=BOOKED, 2=DRAFT */
        private Integer bookingStatus;
        private String reservedBy;
        private LocalDateTime reservedAt;
    }
}
