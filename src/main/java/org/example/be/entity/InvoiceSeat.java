package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "INVOICE_SEAT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INVOICE_SEAT_ID")
    private Integer invoiceSeatId;

    @Column(name = "INVOICE_ID")
    private Integer invoiceId;

    @Column(name = "SCHEDULE_SEAT_ID")
    private Integer scheduleSeatId;

    @Column(name = "PRICE")
    private Double price;
}
