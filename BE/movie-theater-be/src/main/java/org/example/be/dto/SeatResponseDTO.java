package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatResponseDTO {
    private Integer seatId;
    private String seatColumn;
    private Integer seatRow;
    private Integer seatType;
    private Integer pairSeatId;
    private String status;
    /** 0=AVAILABLE, 1=BOOKED, 2=DRAFT */
    private Integer bookingStatus;
    private BigDecimal price;
    /** Thời điểm bắt đầu giữ DRAFT (dùng tính countdown 3 phút) */
    private java.time.LocalDateTime reservedAt;
    private String reservedBy;
}
