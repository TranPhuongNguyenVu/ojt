package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionLineDTO {
    private String itemName;
    private String size;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
}
