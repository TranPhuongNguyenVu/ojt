package org.example.be.mapper;

import org.example.be.dto.CinemaRoomDTO;
import org.example.be.dto.VersionDTO;
import org.example.be.entity.CinemaRoom;
import org.example.be.entity.Version;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CinemaRoomMapper {

    public CinemaRoomDTO toDTO(CinemaRoom cinemaRoom) {
        if (cinemaRoom == null) return null;

        List<VersionDTO> formats = formatSetToDto(cinemaRoom.getFormats());

        return CinemaRoomDTO.builder()
                .cinemaRoomId(cinemaRoom.getCinemaRoomId())
                .cinemaRoomName(cinemaRoom.getCinemaRoomName())
                .seatQuantity(cinemaRoom.getSeatQuantity())
                .formats(formats)
                .status(cinemaRoom.getStatus() != null ? cinemaRoom.getStatus().name() : null)
                .build();
    }

    public List<VersionDTO> formatSetToDto(Set<Version> versions) {
        if (versions == null || versions.isEmpty()) return Collections.emptyList();
        return versions.stream()
                .map(v -> VersionDTO.builder()
                        .versionId(v.getVersionId())
                        .versionName(v.getVersionName())
                        .basePrice(v.getBasePrice())
                        .vipPrice(v.getVipPrice())
                        .couplePrice(v.getCouplePrice())
                        .build())
                .sorted((a, b) -> Integer.compare(a.getVersionId(), b.getVersionId()))
                .collect(Collectors.toList());
    }
}
