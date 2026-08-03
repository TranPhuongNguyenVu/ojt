package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatFormatPriceDTO {
    private Integer versionId;
    private String versionName;
    private BigDecimal price;
}
