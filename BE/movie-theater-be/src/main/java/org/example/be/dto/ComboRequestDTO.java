package org.example.be.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboRequestDTO {
    @NotBlank(message = "Combo name is required")
    @Size(max = 150, message = "Combo name must be at most 150 characters")
    private String comboName;

    private String description;

    private String image;

    private String status;

    @NotEmpty(message = "At least one price is required")
    @Valid
    private List<ConcessionPriceRequestDTO> prices;
}
