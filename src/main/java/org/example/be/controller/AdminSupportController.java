package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.SupportRequestResponseDTO;
import org.example.be.dto.UpdateSupportRequestDTO;
import org.example.be.enums.SupportRequestStatus;
import org.example.be.service.SupportRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/support")
@PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
public class AdminSupportController {

    private final SupportRequestService supportRequestService;

    public AdminSupportController(SupportRequestService supportRequestService) {
        this.supportRequestService = supportRequestService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupportRequestResponseDTO>>> list(
            @RequestParam(required = false) SupportRequestStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                "Danh sách yêu cầu hỗ trợ",
                supportRequestService.listAll(status)
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupportRequestResponseDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Chi tiết yêu cầu hỗ trợ",
                supportRequestService.getById(id)
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("newCount", supportRequestService.countNew());
        return ResponseEntity.ok(ApiResponse.success("Thống kê hỗ trợ", stats));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SupportRequestResponseDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupportRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật yêu cầu hỗ trợ",
                supportRequestService.update(id, request)
        ));
    }
}
