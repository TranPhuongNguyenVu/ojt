package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TYPE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Type {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TYPE_ID")
    private Integer typeId;

    @Column(name = "TYPE_NAME", length = 100, unique = true)
    private String typeName;
}
