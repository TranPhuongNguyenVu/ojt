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

    @NotNull(message = "Vui lòng chọn kích cỡ thành phần.")
    private ConcessionSize size;

    @NotNull(message = "Vui lòng nhập số lượng thành phần.")
    @Min(value = 1, message = "Số lượng thành phần phải lớn hơn 0.")
    private Integer quantity;
}
