package org.example.be.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboItemDTO {
    private Integer comboItemId;
    private Integer foodId;
    private String foodName;
    private Integer drinkId;
    private String drinkName;
    private String size;
    private BigDecimal price;
    private Integer quantity;
}
