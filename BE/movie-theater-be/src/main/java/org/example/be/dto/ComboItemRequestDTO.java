package org.example.be.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.example.be.enums.ConcessionSize;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboItemRequestDTO {
    private Integer foodId;

    private Integer drinkId;

    @NotNull(message = "Size is required")
    private ConcessionSize size;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than 0")
    private Integer quantity;
}
