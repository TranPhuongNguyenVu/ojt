package org.example.be.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsHistoryResponseDTO {
    private Integer txnId;
    private String title;
    private LocalDateTime date;
    private Integer points;
    private String txnType; // "ADD" or "SUB"
    private Double balanceAfter;
}
