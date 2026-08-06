package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "SCHEDULE_SEAT",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_schedule_seat",
                columnNames = {"SCHEDULE_ID", "SEAT_ID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleSeat {
    /** Ghế trống / đã mở khóa */
    public static final int STATUS_AVAILABLE = 0;
    /** Đã thanh toán / khóa cứng */
    public static final int STATUS_BOOKED = 1;
    /** Đang giữ tạm khi vào thanh toán */
    public static final int STATUS_DRAFT = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SCHEDULE_SEAT_ID")
    private Integer scheduleSeatId;

    @Column(name = "SCHEDULE_ID")
    private Integer scheduleId;

    @Column(name = "SEAT_ID")
    private Integer seatId;

    /** 0=AVAILABLE, 1=BOOKED, 2=DRAFT */
    @Column(name = "SEAT_STATUS")
    private Integer seatStatus;

    @Column(name = "RESERVED_AT")
    private LocalDateTime reservedAt;

    @Column(name = "RESERVED_BY")
    private String reservedBy;
}
