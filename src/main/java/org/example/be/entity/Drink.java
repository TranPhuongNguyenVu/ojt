package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionStatus;

import java.util.List;

@Entity
@Table(name = "DRINK")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Drink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DRINK_ID")
    private Integer drinkId;

    @Column(name = "DRINK_NAME", length = 150, nullable = false)
    private String drinkName;

    @Column(name = "DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    @Column(name = "IMAGE", length = 500)
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    private ConcessionStatus status;

    @OneToMany(mappedBy = "drink")
    private List<ConcessionPrice> prices;
}
