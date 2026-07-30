package org.example.be.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCinemaRoomRequest {

    @NotBlank(message = "Tên phòng chiếu không được để trống.")
    private String cinemaRoomName;

    @NotEmpty(message = "Phòng chiếu phải có ít nhất một định dạng.")
    private List<Integer> formatIds;
}
