package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeConfirmBookingRequest {
    private List<Integer> seatIds;
    private String memberId;
    private Integer pointsToUse;
    /** Optional popcorn/drink/combo total from counter sale (same idea as member MoMo totalMoney). */
    private Double concessionTotal;
    private List<ConcessionSelectionRequest> concessions;
}
