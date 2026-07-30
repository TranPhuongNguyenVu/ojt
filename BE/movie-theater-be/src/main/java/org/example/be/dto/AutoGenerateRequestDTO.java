package org.example.be.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoGenerateRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Integer showsPerDayPerRoom;
    private Integer maxMoviesPerRoom;
    private Integer gapCleanup;
    private List<String> movieIds;
    private List<Integer> roomIds;
    /** movieId -> chosen versionId for this generation run. */
    private Map<String, Integer> movieVersions;
    /** movieId -> priority ratio (1-5) used to split shows within a time window. */
    private Map<String, Integer> movieRatios;
}
