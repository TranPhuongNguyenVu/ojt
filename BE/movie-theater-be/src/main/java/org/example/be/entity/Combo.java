package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ConcessionStatus;

import java.util.List;

@Entity
@Table(name = "COMBO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Combo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "COMBO_ID")
    private Integer comboId;

    @Column(name = "COMBO_NAME", length = 150, nullable = false)
    private String comboName;

    @Column(name = "DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    @Column(name = "IMAGE", length = 500)
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    private ConcessionStatus status;

    @OneToMany(mappedBy = "combo")
    private List<ConcessionPrice> prices;
}
