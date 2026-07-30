package org.example.be.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatUpdateItem {

    private Integer seatId;

    @NotNull(message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    @Min(value = 0, message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    @Max(value = 2, message = "Loại ghế chỉ được là 0 (Normal), 1 (VIP) hoặc 2 (Couple).")
    private Integer seatType;

    @NotBlank(message = "Trạng thái ghế không được để trống.")
    @Pattern(regexp = "ACTIVE|INACTIVE|AISLE",
            message = "Trạng thái ghế chỉ được là ACTIVE, INACTIVE hoặc AISLE.")
    private String status;

    private Integer pairSeatId;
    private String seatColumn;
    private Integer seatRow;
}
