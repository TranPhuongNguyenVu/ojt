package org.example.be.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBookingDetailDTO {
    private Integer invoiceId;
    private String movieName;
    private String screen;
    private LocalDateTime showtime;
    private String seats;
    private List<SeatPriceDTO> seatPrices;
    private Double totalMoney;
    private Integer ticketsConverted;
    private Integer useScore;
    private Integer addScore;
    private String memberId;
    private String memberFullName;
    private String identityCard;
    private String phoneNumber;
    private Integer memberScoreAfter;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatPriceDTO {
        private String seatLabel;
        private Double price;
        private Boolean convertedByScore;
    }
}
