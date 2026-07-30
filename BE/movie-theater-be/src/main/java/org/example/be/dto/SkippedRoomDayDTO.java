package org.example.be.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkippedRoomDayDTO {
    private LocalDate date;
    private Integer cinemaRoomId;
    private String cinemaRoomName;
}
