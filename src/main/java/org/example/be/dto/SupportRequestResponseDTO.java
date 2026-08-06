package org.example.be.dto;

import lombok.Builder;
import lombok.Getter;
import org.example.be.enums.SupportRequestStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class SupportRequestResponseDTO {
    private Long supportRequestId;
    private String fullName;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private SupportRequestStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
