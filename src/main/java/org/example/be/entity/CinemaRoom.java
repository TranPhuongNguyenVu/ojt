package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.CinemaRoomStatus;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "CINEMA_ROOM")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CinemaRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CINEMA_ROOM_ID")
    private Integer cinemaRoomId;

    @Column(name = "CINEMA_ROOM_NAME", length = 100, unique = true, nullable = false)
    private String cinemaRoomName;

    @Column(name = "SEAT_QUANTITY")
    private Integer seatQuantity;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "ROOM_FORMAT",
            joinColumns = @JoinColumn(name = "CINEMA_ROOM_ID"),
            inverseJoinColumns = @JoinColumn(name = "VERSION_ID")
    )
    @Builder.Default
    private Set<Version> formats = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20)
    private CinemaRoomStatus status;
}
