package org.example.be.mapper;

import javax.annotation.processing.Generated;
import org.example.be.dto.SeatDTO;
import org.example.be.entity.Seat;
import org.example.be.enums.SeatStatus;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class SeatMapperImpl implements SeatMapper {

    @Override
    public SeatDTO toDTO(Seat seat) {
        if ( seat == null ) {
            return null;
        }

        SeatDTO.SeatDTOBuilder seatDTO = SeatDTO.builder();

        seatDTO.seatId( seat.getSeatId() );
        seatDTO.seatColumn( seat.getSeatColumn() );
        seatDTO.seatRow( seat.getSeatRow() );
        seatDTO.seatType( seat.getSeatType() );
        seatDTO.pairSeatId( seat.getPairSeatId() );
        if ( seat.getStatus() != null ) {
            seatDTO.status( seat.getStatus().name() );
        }

        return seatDTO.build();
    }

    @Override
    public Seat toEntity(SeatDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Seat.SeatBuilder seat = Seat.builder();

        seat.seatId( dto.getSeatId() );
        seat.seatColumn( dto.getSeatColumn() );
        seat.seatRow( dto.getSeatRow() );
        seat.seatType( dto.getSeatType() );
        seat.pairSeatId( dto.getPairSeatId() );
        if ( dto.getStatus() != null ) {
            seat.status( Enum.valueOf( SeatStatus.class, dto.getStatus() ) );
        }

        return seat.build();
    }
}
