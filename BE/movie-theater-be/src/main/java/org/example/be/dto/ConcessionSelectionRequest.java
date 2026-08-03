package org.example.be.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionSelectionRequest {
    private String itemType;
    private Integer itemId;
    private String size;
    private Integer quantity;
}
