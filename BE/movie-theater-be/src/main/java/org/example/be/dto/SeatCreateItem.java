package org.example.be.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatCreateItem {

    @NotBlank(message = "Cột ghế không được để trống.")
    private String seatColumn;

    @NotNull(message = "Hàng ghế phải lớn hơn 0.")
    @Min(value = 1, message = "Hàng ghế phải lớn hơn 0.")
    private Integer seatRow;

    @NotNull(message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    @Min(value = 0, message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    @Max(value = 2, message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    private Integer seatType;
}
