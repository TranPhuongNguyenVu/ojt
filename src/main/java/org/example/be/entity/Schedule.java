package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.ScheduleStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "SCHEDULE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SCHEDULE_ID")
    private Integer scheduleId;

    @Column(name = "MOVIE_ID")
    private String movieId;

    @Column(name = "CINEMA_ROOM_ID", insertable = false, updatable = false)
    private Integer cinemaRoomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CINEMA_ROOM_ID")
    private CinemaRoom cinemaRoom;

    @Column(name = "START_TIME")
    private LocalDateTime startTime;

    @Column(name = "END_TIME")
    private LocalDateTime endTime;

    @Column(name = "BUFFER_TIME")
    private Integer bufferTime;

    @Column(name = "VERSION_ID")
    private Integer versionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20)
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;
}