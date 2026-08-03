package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboDTO {
    private Integer comboId;
    private String comboName;
    private String description;
    private String image;
    private String status;
    private List<ConcessionPriceDTO> prices;
    private List<ComboItemDTO> items;
}
