package org.example.be.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatHoldResponseDTO {
    private List<Integer> seatIds;
    private String reservedBy;
    private LocalDateTime reservedAt;
    /** 0=AVAILABLE, 1=BOOKED, 2=DRAFT */
    private Integer bookingStatus;
}
