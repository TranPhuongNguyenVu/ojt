package org.example.be.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingHistoryResponseDTO {
    private Integer invoiceId;
    private String accountEmail;
    private String maskedEmail;
    private Boolean emailSent;
    private String ticketCode;
    private String movieTitle;
    private String moviePoster;
    private LocalDateTime datetime;
    private String seats;
    private List<SeatInfoDTO> seatDetails;
    private String cinema;
    private List<ConcessionLineDTO> concessions;
    private Double totalMoney;
    private String status; // "booked", "checked_in", "expired", "pending" or "canceled"
    private String statusText; // "Đã đặt", "Đã check-in", "Đã quá hạn", "Chờ thanh toán" or "Đã hủy"
    private Integer addScore;
    private Integer useScore;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatInfoDTO {
        private String seatLabel;
        private Integer seatType; // 0 = Thường, 1 = VIP, 2 = Đôi
        private Double price; // Giá gốc của ghế tại thời điểm đặt (trước khi trừ khuyến mãi/điểm)
    }
}
