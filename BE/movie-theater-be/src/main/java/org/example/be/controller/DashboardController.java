package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.DashboardDTO;
import org.example.be.service.DashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasAuthority('ROLE_Admin')")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    public ApiResponse<DashboardDTO.Overview> getOverview(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId) {
        return ApiResponse.success(
                "Dashboard overview",
                dashboardService.getOverview(timeFilter, startDate, endDate, movieId)
        );
    }

    @GetMapping("/kpis")
    public ApiResponse<DashboardDTO.Kpi> getKpis(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId) {
        return ApiResponse.success(
                "Dashboard KPI cards",
                dashboardService.getKpis(timeFilter, startDate, endDate, movieId)
        );
    }

    @GetMapping("/revenue-trend")
    public ApiResponse<List<DashboardDTO.Trend>> getRevenueTrend(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId) {
        return ApiResponse.success(
                "Revenue trend",
                dashboardService.getRevenueTrend(timeFilter, startDate, endDate, movieId)
        );
    }

    @GetMapping("/revenue-by-movie")
    public ApiResponse<List<DashboardDTO.MovieRevenue>> getRevenueByMovie(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId) {
        return ApiResponse.success(
                "Revenue distribution by movie",
                dashboardService.getRevenueByMovie(timeFilter, startDate, endDate, movieId)
        );
    }

    @GetMapping("/ticket-sales-by-time-slot")
    public ApiResponse<List<DashboardDTO.TimeSlot>> getTicketSalesByTimeSlot(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId) {
        return ApiResponse.success(
                "Ticket sales by time slot",
                dashboardService.getTicketSalesByTimeSlot(timeFilter, startDate, endDate, movieId)
        );
    }

    @GetMapping("/top-revenue-movies")
    public ApiResponse<List<DashboardDTO.MovieRevenue>> getTopRevenueMovies(
            @RequestParam(defaultValue = "THIS_MONTH") String timeFilter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String movieId,
            @RequestParam(defaultValue = "5") Integer limit) {
        return ApiResponse.success(
                "Top revenue movies",
                dashboardService.getTopRevenueMovies(timeFilter, startDate, endDate, movieId, limit)
        );
    }

    @GetMapping("/operational")
    public ApiResponse<DashboardDTO.Operational> getOperationalStatistics() {
        return ApiResponse.success(
                "Current operational statistics",
                dashboardService.getOperationalStatistics()
        );
    }

    @GetMapping("/movies")
    public ApiResponse<List<DashboardDTO.MovieOption>> getMovieOptions() {
        return ApiResponse.success(
                "Movie filter options",
                dashboardService.getMovieOptions()
        );
    }
}
