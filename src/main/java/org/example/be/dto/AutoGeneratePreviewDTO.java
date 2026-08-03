package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoGeneratePreviewDTO {
    private List<ScheduleCandidateDTO> accepted;
    private List<ScheduleCandidateDTO> rejected;
    private int generatedCount;
    private int acceptedCount;
    private int rejectedCount;
    /** Names of in-scope movies whose selected version matches no in-scope room's formats. */
    private List<String> incompatibleMovieWarnings;
    /** Room-days in the requested range skipped because that room already has schedules that day. */
    private List<SkippedRoomDayDTO> skippedRoomDays;
}
