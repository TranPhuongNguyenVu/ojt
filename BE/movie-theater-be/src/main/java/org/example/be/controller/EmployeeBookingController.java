package org.example.be.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.EmployeeBookingDetailDTO;
import org.example.be.dto.EmployeeConfirmBookingRequest;
import org.example.be.dto.EmployeeSalesHistoryDTO;
import org.example.be.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee/booking")
@RequiredArgsConstructor
public class EmployeeBookingController {

    private final BookingService bookingService;

    @PostMapping("/showtime/{scheduleId}/confirm")
    public ResponseEntity<ApiResponse<EmployeeBookingDetailDTO>> confirmEmployeeBooking(
            @PathVariable Integer scheduleId,
            @RequestBody EmployeeConfirmBookingRequest request) {
        try {
            EmployeeBookingDetailDTO result = bookingService.createEmployeeBooking(scheduleId, request);
            return ResponseEntity.ok(ApiResponse.success("Booking confirmed successfully", result));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.ok(ApiResponse.error(400, e.getMessage()));
        }
    }

    @GetMapping("/sales-history")
    public ResponseEntity<ApiResponse<List<EmployeeSalesHistoryDTO>>> getEmployeeSalesHistory() {
        List<EmployeeSalesHistoryDTO> history = bookingService.getEmployeeSalesHistory();
        return ResponseEntity.ok(ApiResponse.success("Employee ticket sales history", history));
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<EmployeeBookingDetailDTO>> getEmployeeBookingDetail(
            @PathVariable Integer invoiceId) {
        try {
            EmployeeBookingDetailDTO detail = bookingService.getEmployeeBookingDetail(invoiceId);
            return ResponseEntity.ok(ApiResponse.success("Booking detail", detail));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(404, e.getMessage()));
        }
    }
}
