package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "VERSION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Version {
    @Id
    @Column(name = "VERSION_ID")
    private Integer versionId;

    @Column(name = "VERSION_NAME", length = 100, unique = true)
    private String versionName;

    @Column(name = "BASE_PRICE", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "VIP_PRICE", nullable = false)
    private BigDecimal vipPrice;

    @Column(name = "COUPLE_PRICE", nullable = false)
    private BigDecimal couplePrice;
}
