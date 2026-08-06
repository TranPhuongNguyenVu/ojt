package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionPriceDTO {
    private String size;
    private BigDecimal price;
}
