package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INVOICE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INVOICE_ID")
    private Integer invoiceId;

    @Column(name = "ACCOUNT_ID")
    private String accountId;

    @Column(name = "SCHEDULE_ID")
    private Integer scheduleId;

    @Column(name = "PROMOTION_ID")
    private Integer promotionId;

    @Column(name = "BOOKING_DATE")
    private LocalDateTime bookingDate;

    @Column(name = "TOTAL_MONEY")
    private Double totalMoney;

    @Column(name = "ADD_SCORE")
    private Integer addScore;

    @Column(name = "USE_SCORE")
    private Integer useScore;

    @Column(name = "STATUS")
    private Integer status; // 0 = Chờ thanh toán, 1 = Đã thanh toán

    @Column(name = "SOLD_BY_ACCOUNT_ID")
    private String soldByAccountId;
}
