package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SCORE_TRANSACTION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TXN_ID")
    private Integer txnId;

    @Column(name = "MEMBER_ID")
    private String memberId;

    @Column(name = "INVOICE_ID")
    private Integer invoiceId;

    @Column(name = "TXN_TYPE")
    private String txnType; // "ADD" = Tích điểm, "SUB" = Dùng điểm

    @Column(name = "POINTS")
    private Integer points;

    @Column(name = "BALANCE_AFTER")
    private Double balanceAfter;

    @Column(name = "TXN_DATE")
    private LocalDateTime txnDate;
}
