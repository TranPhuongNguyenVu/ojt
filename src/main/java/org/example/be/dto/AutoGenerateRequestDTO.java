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
    private List<Integer> allowInsertIntoBusyDayRoomIds;
    private List<String> movieIds;
    private List<Integer> roomIds;
    private Map<String, Integer> movieRatios;
    private Map<String, Map<Integer, Integer>> movieFormatRatios;
    private Map<String, List<Integer>> movieRoomIds;
}
