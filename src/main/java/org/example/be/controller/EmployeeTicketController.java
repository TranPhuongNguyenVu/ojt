package org.example.be.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.TicketDetailDTO;
import org.example.be.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Employee', 'ROLE_Admin', 'ROLE_SystemAdmin')")
public class EmployeeTicketController {

    private final TicketService ticketService;

    @GetMapping("/{ticketCode}")
    public ResponseEntity<ApiResponse<TicketDetailDTO>> previewTicket(@PathVariable String ticketCode) {
        TicketDetailDTO detail = ticketService.getTicketDetailByCode(ticketCode);
        return ResponseEntity.ok(ApiResponse.success("Ticket detail", detail));
    }

    @PostMapping("/{ticketCode}/check-in")
    public ResponseEntity<ApiResponse<TicketDetailDTO>> checkIn(@PathVariable String ticketCode) {
        TicketDetailDTO detail = ticketService.checkIn(ticketCode);
        return ResponseEntity.ok(ApiResponse.success("Ticket checked in successfully", detail));
    }
}
