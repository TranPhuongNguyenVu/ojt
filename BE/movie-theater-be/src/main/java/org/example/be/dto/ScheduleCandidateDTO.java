package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleCandidateDTO {
    private String movieId;
    private String movieName;
    private Integer cinemaRoomId;
    private String cinemaRoomName;
    private Integer versionId;
    private String versionName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer bufferTime;
    private boolean goldenHour;
    /** Extra price of the matched golden-hour rule; null when goldenHour is false. */
    private BigDecimal goldenHourExtra;
    private boolean accepted;
    private String rejectReason;
}
