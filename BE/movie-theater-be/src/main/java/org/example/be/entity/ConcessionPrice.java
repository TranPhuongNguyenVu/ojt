package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionSize;

import java.math.BigDecimal;

@Entity
@Table(name = "CONCESSION_PRICE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CONCESSION_PRICE_ID")
    private Integer concessionPriceId;

    @ManyToOne
    @JoinColumn(name = "FOOD_ID")
    private Food food;

    @ManyToOne
    @JoinColumn(name = "DRINK_ID")
    private Drink drink;

    @ManyToOne
    @JoinColumn(name = "COMBO_ID")
    private Combo combo;

    @Enumerated(EnumType.STRING)
    @Column(name = "SIZE", length = 10, nullable = false)
    private ConcessionSize size;

    @Column(name = "PRICE", nullable = false)
    private BigDecimal price;
}
