package org.example.be.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Dùng cho API tái tạo sơ đồ ghế (PUT /{id}/recreate-seats).
 * Backend tự tính capacity = rows × columns, KHÔNG nhận seatQuantity từ client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecreateSeatMapRequest {

    @NotNull(message = "Số hàng phải lớn hơn 0.")
    @Min(value = 1, message = "Số hàng phải lớn hơn 0.")
    @Max(value = 10, message = "Số hàng không được vượt quá 10.")
    private Integer rows;

    @NotNull(message = "Số cột phải lớn hơn 0.")
    @Min(value = 1, message = "Số cột phải lớn hơn 0.")
    @Max(value = 10, message = "Số cột không được vượt quá 10.")
    private Integer columns;
}
