package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrinkDTO {
    private Integer drinkId;
    private String drinkName;
    private String description;
    private String image;
    private String status;
    private List<ConcessionPriceDTO> prices;
}
