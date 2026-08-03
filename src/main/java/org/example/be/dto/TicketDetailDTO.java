package org.example.be.dto;

import lombok.*;
import org.example.be.enums.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDetailDTO {
    private Integer ticketId;
    private Integer invoiceId;
    private String ticketCode;
    private String movieName;
    private String moviePosterUrl;
    private String roomName;
    private LocalDateTime showtime;
    private Integer ticketCount;
    private List<SeatInfoDTO> seats;
    private List<ConcessionLineDTO> concessions;
    private Double totalMoney;
    private Integer useScore;
    private Integer invoiceStatus;
    private TicketStatus status;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private LocalDateTime cancelledAt;
    private String accountEmail;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatInfoDTO {
        private String seatLabel;
        private Integer seatType;
        private Double price;
    }
}
