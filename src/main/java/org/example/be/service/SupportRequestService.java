package org.example.be.service;

import org.example.be.dto.CreateSupportRequestDTO;
import org.example.be.dto.SupportRequestResponseDTO;
import org.example.be.dto.UpdateSupportRequestDTO;
import org.example.be.entity.SupportRequest;
import org.example.be.enums.SupportRequestStatus;
import org.example.be.repository.SupportRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;

    public SupportRequestService(SupportRequestRepository supportRequestRepository) {
        this.supportRequestRepository = supportRequestRepository;
    }

    @Transactional
    public SupportRequestResponseDTO create(CreateSupportRequestDTO request) {
        SupportRequest entity = SupportRequest.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(blankToNull(request.getPhone()))
                .subject(request.getSubject().trim())
                .message(request.getMessage().trim())
                .status(SupportRequestStatus.NEW)
                .build();

        return toDto(supportRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<SupportRequestResponseDTO> listAll(SupportRequestStatus status) {
        List<SupportRequest> items = status == null
                ? supportRequestRepository.findAllByOrderByCreatedAtDesc()
                : supportRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return items.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SupportRequestResponseDTO getById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public SupportRequestResponseDTO update(Long id, UpdateSupportRequestDTO request) {
        SupportRequest entity = findOrThrow(id);
        entity.setStatus(request.getStatus());
        if (request.getAdminNote() != null) {
            String note = request.getAdminNote().trim();
            entity.setAdminNote(note.isEmpty() ? null : note);
        }
        return toDto(supportRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public long countNew() {
        return supportRequestRepository.countByStatus(SupportRequestStatus.NEW);
    }

    private SupportRequest findOrThrow(Long id) {
        return supportRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu hỗ trợ #" + id));
    }

    private SupportRequestResponseDTO toDto(SupportRequest entity) {
        return SupportRequestResponseDTO.builder()
                .supportRequestId(entity.getSupportRequestId())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .subject(entity.getSubject())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .adminNote(entity.getAdminNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
