package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionReactivateRequestDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.entity.Promotion;
import org.example.be.enums.PromotionStatus;
import org.example.be.repository.PromotionRepository;
import org.example.be.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private PromotionService promotionService;

    /** Lấy danh sách ưu đãi (hỗ trợ tìm kiếm từ khóa cho Admin/Employee, hoặc trả về ưu đãi chưa xóa) */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PromotionDTO>>> getAllPromotions(
            @RequestParam(required = false) String keyword,
            Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_SystemAdmin"));
        List<PromotionDTO> list = promotionService.getAdminPromotions(keyword, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi thành công.", list));
    }

    /** Ưu đãi đang hiệu lực (ACTIVE, trong khung thời gian áp dụng) — dùng cho quầy bán vé nhân viên. */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PromotionDTO>>> getActivePromotions() {
        List<PromotionDTO> list = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi đang hiệu lực thành công.", list));
    }

    /** Lấy chi tiết một khuyến mãi */
    @GetMapping("/{promotionId}")
    public ResponseEntity<ApiResponse<PromotionDTO>> getPromotionById(@PathVariable Integer promotionId) {
        PromotionDTO promotion = promotionService.getAdminPromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khuyến mãi thành công.", promotion));
    }

    /** Tạo mới khuyến mãi - Chỉ Admin/Employee được dùng */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> createPromotion(
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO created = promotionService.createPromotion(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Tạo khuyến mãi thành công.", created));
    }

    /** Cập nhật khuyến mãi - Chỉ Admin/Employee được dùng */
    @PutMapping("/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> updatePromotion(
            @PathVariable Integer promotionId,
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO updated = promotionService.updatePromotion(promotionId, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khuyến mãi thành công.", updated));
    }

    /** Xóa khuyến mãi - Chỉ Admin/Employee được dùng */
    @DeleteMapping("/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Integer promotionId) {
        promotionService.deletePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công.", null));
    }

    /** Kích hoạt lại khuyến mãi đang tạm ngừng - Chỉ Admin/Employee được dùng */
    @PatchMapping("/{promotionId}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> activatePromotion(@PathVariable Integer promotionId) {
        PromotionDTO activated = promotionService.activatePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt khuyến mãi thành công.", activated));
    }

    /** Tạm ngừng khuyến mãi đang hoạt động - Chỉ Admin/Employee được dùng */
    @PatchMapping("/{promotionId}/deactivate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> deactivatePromotion(@PathVariable Integer promotionId) {
        PromotionDTO deactivated = promotionService.deactivatePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Tạm ngừng khuyến mãi thành công.", deactivated));
    }

    /** Khôi phục khuyến mãi đã xóa mềm - Chỉ Admin/SystemAdmin được dùng (không mở cho Employee) */
    @PatchMapping("/{promotionId}/reactivate")
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

    /** Validate mã khuyến mãi khi khách hàng áp dụng */
    @GetMapping("/validate")
    public ApiResponse<Promotion> validatePromotion(
            @RequestParam String code,
            @RequestParam(required = false) Integer scheduleId,
            Authentication auth) {
        Promotion promotion = promotionRepository.findByTitleIgnoreCaseAndStatus(
                code, PromotionStatus.ACTIVE).orElse(null);

        if (promotion == null) {
            return ApiResponse.error(400, "Mã khuyến mãi không tồn tại hoặc đã bị hủy.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promotion.getStartTime()) || now.isAfter(promotion.getEndTime())) {
            return ApiResponse.error(400, "Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng.");
        }

        if (promotion.getUsageLimit() != null && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            return ApiResponse.error(400, "Mã khuyến mãi đã hết lượt sử dụng.");
        }

        try {
            String username = auth != null && auth.isAuthenticated() ? auth.getName() : null;
            promotionService.assertCustomerCanUsePromotion(promotion.getPromotionId(), username, scheduleId);
        } catch (IllegalArgumentException ex) {
            return ApiResponse.error(400, ex.getMessage());
        }

        return ApiResponse.success("Mã khuyến mãi hợp lệ", promotion);
    }
}