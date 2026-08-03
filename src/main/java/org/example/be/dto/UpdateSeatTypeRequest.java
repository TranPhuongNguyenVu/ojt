package org.example.be.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSeatTypeRequest {

    // Được gán từ path variable trong Controller, client không cần truyền
    private Integer cinemaRoomId;

    @NotNull(message = "Danh sách ghế không được rỗng.")
    @NotEmpty(message = "Danh sách ghế không được rỗng.")
    @Valid
    private List<SeatUpdateItem> seats;

    private Boolean recreate;
}