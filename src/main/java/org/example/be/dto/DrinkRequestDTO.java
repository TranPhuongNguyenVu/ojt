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
public class DrinkRequestDTO {
    @NotBlank(message = "Vui lòng nhập tên thức uống.")
    @Size(max = 150, message = "Tên thức uống tối đa 150 ký tự.")
    private String drinkName;

    private String description;

    private String image;

    private String status;

    @NotEmpty(message = "Vui lòng chọn ít nhất một loại giá.")
    @Valid
    private List<ConcessionPriceRequestDTO> prices;
}
