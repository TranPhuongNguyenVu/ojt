package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.SeatStatusEventDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastSeatStatus(Integer scheduleId, List<Integer> seatIds, Integer bookingStatus) {
        broadcastSeatStatus(scheduleId, seatIds, bookingStatus, null, null);
    }

    public void broadcastSeatStatus(
            Integer scheduleId,
            List<Integer> seatIds,
            Integer bookingStatus,
            String reservedBy,
            LocalDateTime reservedAt) {
        if (scheduleId == null || seatIds == null || seatIds.isEmpty()) {
            return;
        }

        List<SeatStatusEventDTO.SeatStatusItem> seats = seatIds.stream()
                .map(seatId -> SeatStatusEventDTO.SeatStatusItem.builder()
                        .seatId(seatId)
                        .bookingStatus(bookingStatus)
                        .reservedBy(reservedBy)
                        .reservedAt(reservedAt)
                        .build())
                .toList();

        SeatStatusEventDTO event = SeatStatusEventDTO.builder()
                .scheduleId(scheduleId)
                .seats(seats)
                .build();

        messagingTemplate.convertAndSend("/topic/seats/" + scheduleId, event);
    }
}
