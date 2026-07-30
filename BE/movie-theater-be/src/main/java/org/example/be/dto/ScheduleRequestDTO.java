package org.example.be.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleRequestDTO {
    private String movieId;
    private Integer cinemaRoomId;
    private LocalDateTime startTime;
    private Integer bufferTime;
    /** ID of the Version (2D/3D/IMAX...) chosen for this showtime */
    private Integer versionId;
}
