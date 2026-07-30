package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatTypeSurchargeUpdateDTO {
    private BigDecimal extraPrice;
}
