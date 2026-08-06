package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateSupportRequestDTO;
import org.example.be.dto.SupportRequestResponseDTO;
import org.example.be.service.SupportRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportRequestService supportRequestService;

    public SupportController(SupportRequestService supportRequestService) {
        this.supportRequestService = supportRequestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SupportRequestResponseDTO>> create(
            @Valid @RequestBody CreateSupportRequestDTO request) {
        SupportRequestResponseDTO created = supportRequestService.create(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất.",
                created
        ));
    }
}
