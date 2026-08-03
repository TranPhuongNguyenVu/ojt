package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionSize;
import org.example.be.enums.ConcessionType;

import java.math.BigDecimal;

@Entity
@Table(name = "INVOICE_CONCESSION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceConcession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INVOICE_CONCESSION_ID")
    private Integer invoiceConcessionId;

    @Column(name = "INVOICE_ID", nullable = false)
    private Integer invoiceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ITEM_TYPE", length = 10, nullable = false)
    private ConcessionType itemType;

    @Column(name = "ITEM_ID", nullable = false)
    private Integer itemId;

    @Column(name = "ITEM_NAME", length = 150, nullable = false)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(name = "SIZE", length = 10, nullable = false)
    private ConcessionSize size;

    @Column(name = "UNIT_PRICE", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;

    @Column(name = "LINE_TOTAL", nullable = false)
    private BigDecimal lineTotal;
}
