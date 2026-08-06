package org.example.be.mapper;

import org.example.be.dto.SeatDTO;
import org.example.be.entity.Seat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SeatMapper {

    // Chuyển đổi từ Entity sang DTO
    SeatDTO toDTO(Seat seat);

    // Chuyển đổi từ DTO sang Entity (bỏ qua cinemaRoomId vì SeatDTO không chứa thông tin này)
    @Mapping(target = "cinemaRoomId", ignore = true)
    Seat toEntity(SeatDTO dto);
}
