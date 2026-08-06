package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionReactivateRequestDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.enums.PromotionStatus;
import org.example.be.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PromotionController {

    @Autowired
    private PromotionService promotionService;

    @GetMapping("/api/promotions")
    public ResponseEntity<ApiResponse<List<PromotionDTO>>> getAllPromotions(
            @RequestParam(required = false) String keyword) {
        List<PromotionDTO> list = promotionService.getAdminPromotions(keyword, false);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi thành công.", list));
    }

    @GetMapping("/api/promotions/active")
    public ResponseEntity<ApiResponse<List<PromotionDTO>>> getActivePromotions() {
        List<PromotionDTO> list = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi đang hiệu lực thành công.", list));
    }

    @GetMapping("/api/promotions/{promotionId}")
    public ResponseEntity<ApiResponse<PromotionDTO>> getPromotionById(@PathVariable Integer promotionId) {
        PromotionDTO promotion = promotionService.getAdminPromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khuyến mãi thành công.", promotion));
    }

    @PostMapping("/api/promotions")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> createPromotion(
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO created = promotionService.createPromotion(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Tạo khuyến mãi thành công.", created));
    }

    @PutMapping("/api/promotions/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> updatePromotion(
            @PathVariable Integer promotionId,
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO updated = promotionService.updatePromotion(promotionId, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khuyến mãi thành công.", updated));
    }

    @DeleteMapping("/api/promotions/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Integer promotionId) {
        promotionService.deletePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công.", null));
    }

    @PatchMapping("/api/promotions/{promotionId}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> activatePromotion(@PathVariable Integer promotionId) {
        PromotionDTO activated = promotionService.activatePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt khuyến mãi thành công.", activated));
    }

    @PatchMapping("/api/promotions/{promotionId}/deactivate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> deactivatePromotion(@PathVariable Integer promotionId) {
        PromotionDTO deactivated = promotionService.deactivatePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Tạm ngừng khuyến mãi thành công.", deactivated));
    }

    @PatchMapping("/api/promotions/{promotionId}/reactivate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> reactivatePromotion(
            @PathVariable Integer promotionId,
            @RequestBody(required = false) PromotionReactivateRequestDTO requestDTO) {
        PromotionStatus targetStatus = requestDTO != null && requestDTO.getStatus() != null
                ? requestDTO.getStatus()
                : PromotionStatus.INACTIVE;
        PromotionDTO reactivated = promotionService.reactivatePromotion(promotionId, targetStatus);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục khuyến mãi thành công.", reactivated));
    }

    @GetMapping("/api/promotions/validate")
    public ResponseEntity<ApiResponse<PromotionDTO>> validatePromotion(
            @RequestParam String code,
            @RequestParam(required = false) Integer scheduleId,
            @RequestParam(required = false) String memberId,
            Authentication auth) {
        String username = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        boolean forEmployee = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    return "ROLE_Employee".equals(role)
                            || "ROLE_Admin".equals(role)
                            || "ROLE_SystemAdmin".equals(role);
                });

        PromotionDTO promotion = promotionService.validateByCode(
                code, scheduleId, username, memberId, forEmployee);
        return ResponseEntity.ok(ApiResponse.success("Mã khuyến mãi hợp lệ.", promotion));
    }

    @GetMapping("/api/admin/promotions")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<List<PromotionDTO>>> getAllPromotionsAdmin(
            @RequestParam(required = false) String keyword) {
        List<PromotionDTO> list = promotionService.getAdminPromotions(keyword, true);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi thành công.", list));
    }

    @GetMapping("/api/admin/promotions/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<PromotionDTO>> getPromotionByIdAdmin(@PathVariable Integer promotionId) {
        PromotionDTO promotion = promotionService.getAdminPromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khuyến mãi thành công.", promotion));
    }
}
