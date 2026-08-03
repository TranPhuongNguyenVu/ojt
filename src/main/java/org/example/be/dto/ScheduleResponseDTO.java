package org.example.be.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleResponseDTO {
    private Integer scheduleId;
    private String movieId;
    private Integer cinemaRoomId;
    private String cinemaRoomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer bufferTime;
    /** ID of the Version chosen for this showtime (for FE prefill in Edit) */
    private Integer versionId;
    /** Display name of the chosen Version (e.g. "2D DIGITAL", "IMAX 3D") */
    private String movieFormat;
    private String status;
    /** Runtime-computed status (SCHEDULED/SHOWING/ENDED/CANCELLED/DELETED) derived from status + now vs startTime/endTime — not persisted. */
    private String displayStatus;
    /** Golden-hour window covering startTime, and its extra price; null/zero when not golden hour. */
    private LocalTime goldenHourStart;
    private LocalTime goldenHourEnd;
    private BigDecimal goldenHourExtra;
}
