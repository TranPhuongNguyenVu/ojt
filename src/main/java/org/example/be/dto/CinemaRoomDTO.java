package org.example.be.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CinemaRoomDTO {
    private Integer cinemaRoomId;
    private String cinemaRoomName;
    private Integer seatQuantity;
    private List<VersionDTO> formats;
    private String status;
}
