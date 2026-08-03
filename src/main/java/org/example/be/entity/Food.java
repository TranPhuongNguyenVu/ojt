package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionStatus;

import java.util.List;

@Entity
@Table(name = "FOOD")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FOOD_ID")
    private Integer foodId;

    @Column(name = "FOOD_NAME", length = 150, nullable = false)
    private String foodName;

    @Column(name = "DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    @Column(name = "IMAGE", length = 500)
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    private ConcessionStatus status;

    @OneToMany(mappedBy = "food")
    private List<ConcessionPrice> prices;
}
