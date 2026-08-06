package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.EmployeeDashboardDTO;
import org.example.be.service.EmployeeDashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employee/dashboard")
@PreAuthorize("hasAnyAuthority('ROLE_Employee', 'ROLE_Admin', 'ROLE_SystemAdmin')")
public class EmployeeDashboardController {
    private final EmployeeDashboardService employeeDashboardService;

    public EmployeeDashboardController(EmployeeDashboardService employeeDashboardService) {
        this.employeeDashboardService = employeeDashboardService;
    }

    @GetMapping("/overview")
    public ApiResponse<EmployeeDashboardDTO.Overview> getOverview() {
        return ApiResponse.success(
                "Employee dashboard overview",
                employeeDashboardService.getOverview()
        );
    }

    @GetMapping("/operational")
    public ApiResponse<EmployeeDashboardDTO.OperationalStats> getOperationalStats() {
        return ApiResponse.success(
                "Today's operational statistics",
                employeeDashboardService.getOperationalStats()
        );
    }

    @GetMapping("/upcoming-showtimes")
    public ApiResponse<List<EmployeeDashboardDTO.UpcomingShowtime>> getUpcomingShowtimes() {
        return ApiResponse.success(
                "Upcoming showtimes",
                employeeDashboardService.getUpcomingShowtimes()
        );
    }
}
