package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "PAYMENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PAYMENT_ID")
    private Integer paymentId;

    @Column(name = "INVOICE_ID")
    private Integer invoiceId;

    @Column(name = "TXN_REF")
    private String txnRef;

    @Column(name = "PAYMENT_METHOD")
    private String paymentMethod;

    @Column(name = "AMOUNT")
    private Double amount;

    @Column(name = "PAYMENT_STATUS")
    private String paymentStatus;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}
