package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionSize;

@Entity
@Table(name = "COMBO_ITEM")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "COMBO_ITEM_ID")
    private Integer comboItemId;

    @ManyToOne
    @JoinColumn(name = "COMBO_ID", nullable = false)
    private Combo combo;

    @ManyToOne
    @JoinColumn(name = "FOOD_ID")
    private Food food;

    @ManyToOne
    @JoinColumn(name = "DRINK_ID")
    private Drink drink;

    @Enumerated(EnumType.STRING)
    @Column(name = "SIZE", length = 10, nullable = false)
    private ConcessionSize size;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;
}
