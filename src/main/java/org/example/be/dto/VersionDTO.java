package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionDTO {
    private Integer versionId;
    private String versionName;
    private BigDecimal basePrice;
    private BigDecimal vipPrice;
    private BigDecimal couplePrice;
}
