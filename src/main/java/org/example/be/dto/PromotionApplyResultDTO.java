package org.example.be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionApplyResultDTO {
    private Boolean applicable;
    private String message;
    private PromotionDTO promotion;
}
