package org.example.be.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeSalesHistoryDTO {
    private Integer invoiceId;
    private String movieName;
    private String screen;
    private LocalDateTime showtime;
    private LocalDateTime bookingDate;
    private String seats;
    private Double totalMoney;
    private Integer useScore;
    private Integer addScore;
    private String memberFullName;
    private String phoneNumber;
    private String soldByEmployeeName;
    private String paymentMethod;
}
