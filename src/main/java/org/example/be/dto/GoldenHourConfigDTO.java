package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldenHourConfigDTO {
    private Integer goldenHourId;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<DayOfWeek> daysOfWeek;
    private BigDecimal extraPrice;
    private Boolean active;
}
