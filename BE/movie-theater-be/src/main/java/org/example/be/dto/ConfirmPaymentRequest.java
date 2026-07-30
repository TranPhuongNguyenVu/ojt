package org.example.be.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmPaymentRequest {
    private Integer scheduleId;
    private List<Integer> seatIds;
    private Integer promotionId;
    private Integer useScore;
    private Double totalMoney;
    private String paymentMethod; // "MOMO" or "CASH"
}
