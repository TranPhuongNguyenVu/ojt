package org.example.be.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDTO {
    private Integer seatId;
    private String seatColumn;
    private Integer seatRow;
    private Integer seatType;
    private Integer pairSeatId;
    private String status;
    private List<SeatFormatPriceDTO> prices;
}
