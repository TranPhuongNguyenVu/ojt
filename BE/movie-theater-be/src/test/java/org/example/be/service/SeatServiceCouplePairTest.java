package org.example.be.service;

import org.example.be.entity.Seat;
import org.example.be.exception.GlobalExceptionHandler.InvalidCoupleSeatPairException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SeatServiceCouplePairTest {

    private Seat seat(Integer id, int row, String column, Integer type, Integer pairId, String status) {
        return Seat.builder()
                .seatId(id)
                .cinemaRoomId(1)
                .seatRow(row)
                .seatColumn(column)
                .seatType(type)
                .pairSeatId(pairId)
                .status(status)
                .build();
    }

    @Test
    void acceptsHorizontalAdjacentPair() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 2, 2, Seat.STATUS_ACTIVE),
                seat(2, 1, "2", 2, 1, Seat.STATUS_ACTIVE));
        assertDoesNotThrow(() -> SeatService.validateCouplePairs(seats));
    }

    @Test
    void acceptsSeatMapWithoutAnyCouple() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 0, null, Seat.STATUS_ACTIVE),
                seat(2, 1, "2", 1, null, Seat.STATUS_INACTIVE),
                seat(3, 1, "3", 0, null, Seat.STATUS_AISLE));
        assertDoesNotThrow(() -> SeatService.validateCouplePairs(seats));
    }

    @Test
    void rejectsVerticalPair() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 2, 2, Seat.STATUS_ACTIVE),
                seat(2, 2, "1", 2, 1, Seat.STATUS_ACTIVE));
        InvalidCoupleSeatPairException ex = assertThrows(
                InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
        assertEquals(SeatService.VERTICAL_PAIR_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsSameRowButNotAdjacent() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 2, 2, Seat.STATUS_ACTIVE),
                seat(2, 1, "3", 2, 1, Seat.STATUS_ACTIVE));
        InvalidCoupleSeatPairException ex = assertThrows(
                InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
        assertEquals(SeatService.NOT_ADJACENT_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsNonMutualPair() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 2, 2, Seat.STATUS_ACTIVE),
                seat(2, 1, "2", 2, 3, Seat.STATUS_ACTIVE),
                seat(3, 1, "3", 2, 2, Seat.STATUS_ACTIVE));
        assertThrows(InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
    }

    @Test
    void rejectsPairWithMissingPartner() {
        List<Seat> seats = List.of(seat(1, 1, "1", 2, 99, Seat.STATUS_ACTIVE));
        InvalidCoupleSeatPairException ex = assertThrows(
                InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
        assertEquals(SeatService.PARTNER_NOT_FOUND_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsCoupleSeatWithoutPartner() {
        List<Seat> seats = List.of(seat(1, 1, "1", 2, null, Seat.STATUS_ACTIVE));
        InvalidCoupleSeatPairException ex = assertThrows(
                InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
        assertEquals(SeatService.MISSING_PAIR_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsPairingAnAisleSeat() {
        List<Seat> seats = List.of(
                seat(1, 1, "1", 2, 2, Seat.STATUS_ACTIVE),
                seat(2, 1, "2", 2, 1, Seat.STATUS_AISLE));
        InvalidCoupleSeatPairException ex = assertThrows(
                InvalidCoupleSeatPairException.class,
                () -> SeatService.validateCouplePairs(seats));
        assertEquals(SeatService.AISLE_SEAT_MESSAGE, ex.getMessage());
    }
}
