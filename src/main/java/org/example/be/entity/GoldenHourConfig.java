package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "GOLDEN_HOUR_CONFIG")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldenHourConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GOLDEN_HOUR_ID")
    private Integer goldenHourId;

    @Column(name = "START_TIME", nullable = false)
    private LocalTime startTime;

    @Column(name = "END_TIME", nullable = false)
    private LocalTime endTime;

    @Column(name = "DAYS_OF_WEEK", length = 100, nullable = false)
    private String daysOfWeek;

    @Column(name = "EXTRA_PRICE", nullable = false)
    private BigDecimal extraPrice;

    @Column(name = "ACTIVE", nullable = false)
    @Builder.Default
    private Boolean active = Boolean.TRUE;

    public Set<DayOfWeek> daysOfWeekSet() {
        if (daysOfWeek == null || daysOfWeek.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public void setDaysOfWeekSet(Set<DayOfWeek> days) {
        this.daysOfWeek = days == null ? "" : days.stream()
                .sorted()
                .map(DayOfWeek::name)
                .collect(Collectors.joining(","));
    }
}
