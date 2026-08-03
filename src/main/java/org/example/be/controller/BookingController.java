package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.ConfirmPaymentRequest;
import org.example.be.dto.SeatHoldResponseDTO;
import org.example.be.dto.SeatResponseDTO;
import org.example.be.dto.BookingHistoryResponseDTO;
import org.example.be.dto.PointsHistoryResponseDTO;
import org.example.be.entity.Invoice;
import org.example.be.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping("/showtime/{scheduleId}/seats")
    public ApiResponse<List<SeatResponseDTO>> getSeatsBySchedule(@PathVariable Integer scheduleId) {
        List<SeatResponseDTO> seats = bookingService.getSeatsBySchedule(scheduleId);
        return ApiResponse.success("List of seats for showtime", seats);
    }

    @GetMapping("/member-score")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Integer> getMemberScore() {
        Integer score = bookingService.getMemberScore();
        return ApiResponse.success("Member score", score);
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<BookingHistoryResponseDTO>> getBookingHistory() {
        List<BookingHistoryResponseDTO> history = bookingService.getBookingHistory();
        return ApiResponse.success("List of booking history", history);
    }

    @GetMapping("/points-history")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<PointsHistoryResponseDTO>> getPointsHistory() {
        List<PointsHistoryResponseDTO> pointsHistory = bookingService.getPointsHistory();
        return ApiResponse.success("Points history", pointsHistory);
    }

    @PostMapping("/showtime/{scheduleId}/confirm")
    public ApiResponse<SeatHoldResponseDTO> confirmBooking(
            @PathVariable Integer scheduleId,
            @RequestBody List<Integer> seatIds) {
        try {
            SeatHoldResponseDTO held = bookingService.confirmBooking(scheduleId, seatIds);
            return ApiResponse.success("Giữ ghế thành công", held);
        } catch (IllegalStateException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/showtime/{scheduleId}/release")
    public ApiResponse<Void> releaseSeats(
            @PathVariable Integer scheduleId,
            @RequestBody List<Integer> seatIds) {
        try {
            bookingService.releaseSeats(scheduleId, seatIds);
            return ApiResponse.success("Đã hủy giữ ghế", null);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/showtime/{scheduleId}/payment")
    public ApiResponse<Invoice> confirmPayment(
            @PathVariable Integer scheduleId,
            @RequestBody ConfirmPaymentRequest request) {
        try {
            request.setScheduleId(scheduleId);
            Invoice invoice = bookingService.createInvoiceAndPayment(request);
            return ApiResponse.success("Thanh toán thành công", invoice);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/invoice/{invoiceId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> cancelTicket(@PathVariable Integer invoiceId) {
        try {
            bookingService.cancelTicket(invoiceId);
            return ApiResponse.success("Hủy vé thành công", null);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
