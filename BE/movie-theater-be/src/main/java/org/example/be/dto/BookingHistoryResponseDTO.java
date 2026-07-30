package org.example.be.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingHistoryResponseDTO {
    private Integer invoiceId;
    private String movieTitle;
    private String moviePoster;
    private LocalDateTime datetime;
    private String seats;
    private String cinema;
    private Double totalMoney;
    private String status; // "upcoming" or "completed"
    private String statusText; // "Sắp diễn ra" or "Đã xem"
    private Integer addScore;
    private Integer useScore;
}
