package org.example.be.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CinemaRoomDetailDTO {
    private Integer cinemaRoomId;
    private String cinemaRoomName;
    private Integer seatQuantity;
    private List<VersionDTO> formats;
    private List<SeatDTO> seats;
    private String status;
    /** True nếu phòng còn suất chiếu chưa kết thúc (không CANCELLED/DELETED). */
    private Boolean hasUpcomingSchedules;
}
