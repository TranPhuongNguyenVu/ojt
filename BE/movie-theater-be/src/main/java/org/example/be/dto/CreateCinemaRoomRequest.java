package org.example.be.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCinemaRoomRequest {

    public static final String DUPLICATE_NAME = "Tên phòng chiếu đã tồn tại trong hệ thống.";

    @NotBlank(message = "Tên phòng chiếu không được để trống.")
    private String cinemaRoomName;

    @NotNull(message = "Số cột phải lớn hơn 0.")
    @Min(value = 1, message = "Số cột phải lớn hơn 0.")
    @Max(value = 10, message = "Số cột không được vượt quá 10.")
    private Integer columns;

    @NotNull(message = "Số hàng phải lớn hơn 0.")
    @Min(value = 1, message = "Số hàng phải lớn hơn 0.")
    @Max(value = 10, message = "Số hàng không được vượt quá 10.")
    private Integer rows;

    @NotEmpty(message = "Phòng chiếu phải có ít nhất một định dạng.")
    private List<Integer> formatIds;

    @NotNull(message = "Danh sách ghế không được rỗng.")
    @NotEmpty(message = "Danh sách ghế không được rỗng.")
    @Valid
    private List<SeatCreateItem> seats;
}
