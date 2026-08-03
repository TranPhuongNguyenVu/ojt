package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.AutoGenerateConfirmRequestDTO;
import org.example.be.dto.AutoGenerateConfirmResultDTO;
import org.example.be.dto.AutoGeneratePreviewDTO;
import org.example.be.dto.AutoGenerateRequestDTO;
import org.example.be.dto.ScheduleRequestDTO;
import org.example.be.dto.ScheduleResponseDTO;
import org.example.be.service.AutoGenerateService;
import org.example.be.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private AutoGenerateService autoGenerateService;

    @GetMapping
    public ApiResponse<List<ScheduleResponseDTO>> getAllSchedules() {
        return ApiResponse.success("All schedules", scheduleService.filterSchedules(null, null, null));
    }

    @GetMapping("/{id}")
    public ApiResponse<ScheduleResponseDTO> getScheduleById(@PathVariable Integer id) {
        return ApiResponse.success("Schedule details", scheduleService.getScheduleById(id));
    }

    @GetMapping("/movie/{movieId}")
    public ApiResponse<List<ScheduleResponseDTO>> getSchedulesByMovieId(@PathVariable String movieId) {
        return ApiResponse.success("Schedules for movie", scheduleService.getSchedulesByMovieId(movieId));
    }

    @GetMapping("/room/{cinemaRoomId}")
    public ApiResponse<List<ScheduleResponseDTO>> getSchedulesByCinemaRoomId(@PathVariable Integer cinemaRoomId) {
        return ApiResponse.success("Schedules for room", scheduleService.getSchedulesByCinemaRoomId(cinemaRoomId));
    }

    @GetMapping("/filter")
    public ApiResponse<List<ScheduleResponseDTO>> filterSchedules(
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) Integer cinemaRoomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Filtered schedules", scheduleService.filterSchedules(movieId, cinemaRoomId, date));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ScheduleResponseDTO> addSchedule(@Valid @RequestBody ScheduleRequestDTO request) {
        return ApiResponse.success("Schedule added", scheduleService.addSchedule(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ScheduleResponseDTO> updateSchedule(@PathVariable Integer id, @Valid @RequestBody ScheduleRequestDTO request) {
        return ApiResponse.success("Schedule updated", scheduleService.updateSchedule(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<Void> deleteSchedule(@PathVariable Integer id) {
        scheduleService.deleteSchedule(id);
        return ApiResponse.success("Schedule deleted", null);
    }

    @PostMapping("/auto-generate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<AutoGeneratePreviewDTO> autoGeneratePreview(@RequestBody AutoGenerateRequestDTO request) {
        return ApiResponse.success("Auto-generate preview", autoGenerateService.generatePreview(request));
    }

    @PostMapping("/auto-generate/confirm")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<AutoGenerateConfirmResultDTO> autoGenerateConfirm(@RequestBody AutoGenerateConfirmRequestDTO request) {
        return ApiResponse.success("Auto-generate confirmed", autoGenerateService.confirm(request));
    }
}
