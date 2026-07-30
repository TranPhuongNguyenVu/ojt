package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SEAT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_AISLE = "AISLE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SEAT_ID")
    private Integer seatId;

    @Column(name = "CINEMA_ROOM_ID")
    private Integer cinemaRoomId;

    @Column(name = "SEAT_COLUMN", length = 5)
    private String seatColumn;

    @Column(name = "SEAT_ROW")
    private Integer seatRow;

    @Column(name = "SEAT_TYPE")
    @Builder.Default
    private Integer seatType = 0;

    @Column(name = "PAIR_SEAT_ID")
    private Integer pairSeatId;

    @Column(name = "STATUS", length = 20)
    @Builder.Default
    private String status = STATUS_ACTIVE;
}
