package org.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "PROMOTION_USAGE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROMOTION_USAGE_ID")
    private Integer promotionUsageId;

    @Column(name = "CUSTOMER_ID", length = 36, nullable = false)
    private String customerId;

    @Column(name = "PROMOTION_ID", nullable = false)
    private Integer promotionId;

    @Column(name = "INVOICE_ID", nullable = false)
    private Integer invoiceId;

    @Builder.Default
    @Column(name = "USED_AT", nullable = false)
    private LocalDateTime usedAt = LocalDateTime.now();
}
