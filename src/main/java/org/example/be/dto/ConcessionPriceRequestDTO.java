package org.example.be.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.example.be.enums.ConcessionSize;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionPriceRequestDTO {
    @NotNull(message = "Vui lòng chọn kích cỡ giá.")
    private ConcessionSize size;

    @NotNull(message = "Vui lòng nhập giá bán.")
    @Positive(message = "Giá bán phải lớn hơn 0.")
    @DecimalMax(value = "10000000", message = "Giá bán tối đa là 10000000đ.")
    private BigDecimal price;
}
