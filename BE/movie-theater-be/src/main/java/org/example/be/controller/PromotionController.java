package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.entity.Promotion;
import org.example.be.enums.PromotionStatus;
import org.example.be.repository.PromotionRepository;
import org.example.be.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
            @RequestParam(required = false) String keyword) {
        List<PromotionDTO> list = promotionService.getAdminPromotions(keyword);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khuyến mãi thành công.", list));
    }

    /** Lấy chi tiết một khuyến mãi */
    @GetMapping("/{promotionId}")
    public ResponseEntity<ApiResponse<PromotionDTO>> getPromotionById(@PathVariable Integer promotionId) {
        PromotionDTO promotion = promotionService.getAdminPromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khuyến mãi thành công.", promotion));
    }

    /** Tạo mới khuyến mãi - Chỉ Admin/Employee được dùng */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> createPromotion(
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO created = promotionService.createPromotion(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Tạo khuyến mãi thành công.", created));
    }

    /** Cập nhật khuyến mãi - Chỉ Admin/Employee được dùng */
    @PutMapping("/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<PromotionDTO>> updatePromotion(
            @PathVariable Integer promotionId,
            @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionDTO updated = promotionService.updatePromotion(promotionId, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khuyến mãi thành công.", updated));
    }

    /** Xóa khuyến mãi - Chỉ Admin/Employee được dùng */
    @DeleteMapping("/{promotionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_Employee')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Integer promotionId) {
        promotionService.deletePromotion(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công.", null));
    }

    /** Validate mã khuyến mãi khi khách hàng áp dụng */
    @GetMapping("/validate")
    public ApiResponse<Promotion> validatePromotion(@RequestParam String code) {
        Promotion promotion = promotionRepository.findByTitleIgnoreCaseAndIsDeletedAndStatus(
                code, 0, PromotionStatus.ACTIVE).orElse(null);

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

        return ApiResponse.success("Mã khuyến mãi hợp lệ", promotion);
    }
}