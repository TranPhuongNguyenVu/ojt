package org.example.be.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.PromotionApplyRequest;
import org.example.be.dto.PromotionApplyResultDTO;
import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Promotion;
import org.example.be.enums.PromotionDiscountType;
import org.example.be.enums.PromotionStatus;
import org.example.be.mapper.PromotionMapper;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.PromotionRepository;
//import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.multipart.MultipartFile;
//import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
//import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.util.Set;
//import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final AccountRepository accountRepository;
    private final PromotionMapper promotionMapper;
    private final EntityManager entityManager;
    //private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    //private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;

    /*@Value("${app.upload-dir:uploads}")
    private String uploadDir;*/

    public List<PromotionDTO> getAdminPromotions(String keyword) {
        List<Promotion> promotions = keyword == null || keyword.isBlank()
                ? promotionRepository.findByIsDeletedOrderByStartTimeDesc(0)
                : promotionRepository.searchForAdmin(keyword.trim());

        return promotions
                .stream()
                .map(promotionMapper::toDTO)
                .toList();
    }

    public PromotionDTO getAdminPromotion(Integer promotionId) {
        return promotionMapper.toDTO(findExistingPromotion(promotionId));
    }

    public PromotionDTO getPublicPromotion(Integer promotionId) {
        Promotion promotion = findExistingPromotion(promotionId);
        validatePromotionActive(promotion);
        return promotionMapper.toDTO(promotion);
    }

    private void validatePromotionActive(Promotion promotion) {
        LocalDateTime now = LocalDateTime.now();
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new IllegalArgumentException("Ưu đãi hiện không hoạt động.");
        }
        if (now.isBefore(promotion.getStartTime())) {
            throw new IllegalArgumentException("Ưu đãi chưa đến thời gian áp dụng.");
        }
        if (now.isAfter(promotion.getEndTime())) {
            throw new IllegalArgumentException("Ưu đãi đã hết hạn.");
        }
    }

    @Transactional
    public PromotionDTO createPromotion(PromotionRequestDTO requestDTO) {
        validatePromotionTime(requestDTO);
        Promotion promotion = promotionMapper.toEntity(requestDTO);
        promotion.setIsDeleted(0);
        promotion.setStatus(PromotionStatus.ACTIVE);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionDTO updatePromotion(Integer promotionId, PromotionRequestDTO requestDTO) {
        validatePromotionTime(requestDTO);
        if (requestDTO.getStatus() == PromotionStatus.DELETED) {
            throw new IllegalArgumentException("Vui lòng sử dụng chức năng xóa ưu đãi.");
        }
        Promotion promotion = findExistingPromotion(promotionId);
        promotionMapper.updateEntity(promotion, requestDTO);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
    }

    @Transactional
    public void deletePromotion(Integer promotionId) {
        Promotion promotion = findExistingPromotion(promotionId);
        validatePromotionCanBeDeleted(promotion);
        promotion.setIsDeleted(1);
        promotion.setStatus(PromotionStatus.DELETED);
        promotionRepository.save(promotion);
    }

    /*public String uploadPromotionImage(MultipartFile image) {
        validatePromotionImage(image);

        try {
            Path uploadPath = Paths.get(uploadDir, "promotions").toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalName = image.getOriginalFilename() == null ? "" : image.getOriginalFilename();
            String extension = getFileExtension(originalName);
            String fileName = UUID.randomUUID() + extension;
            Path targetPath = uploadPath.resolve(fileName).normalize();
            image.transferTo(targetPath);

            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/promotions/")
                    .path(fileName)
                    .toUriString();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Không thể tải ảnh ưu đãi lên.");
        }
    }*/

    public List<PromotionDTO> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findByIsDeletedAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        0, PromotionStatus.ACTIVE, now, now)
                .stream()
                .map(promotionMapper::toDTO)
                .sorted(Comparator
                        .comparing(PromotionDTO::getExpiringSoon, Comparator.reverseOrder())
                        .thenComparing(PromotionDTO::getDaysRemaining)
                        .thenComparing(PromotionDTO::getEndTime))
                .toList();
    }

    public List<PromotionDTO> getExpiredPromotions() {
        return promotionRepository.findByIsDeletedAndStatusAndEndTimeBefore(
                        0, PromotionStatus.ACTIVE, LocalDateTime.now())
                .stream()
                .map(promotionMapper::toDTO)
                .sorted(Comparator.comparing(PromotionDTO::getEndTime).reversed())
                .toList();
    }

    public PromotionApplyResultDTO validatePromotionForCustomer(
            Integer promotionId,
            PromotionApplyRequest request,
            String username
    ) {
        Promotion promotion = findExistingPromotion(promotionId);
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản khách hàng."));

        validatePromotionActive(promotion);
        validateUsageLimit(promotion);
        validateShowTime(promotion, request.getShowTime());
        validateBirthdayPromotion(promotion, account);

        return PromotionApplyResultDTO.builder()
                .applicable(true)
                .message("Mã ưu đãi hợp lệ.")
                .promotion(promotionMapper.toDTO(promotion))
                .build();
    }

    private Promotion findExistingPromotion(Integer promotionId) {
        return promotionRepository.findById(promotionId)
                .filter(promotion -> promotion.getIsDeleted() == 0)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ưu đãi."));
    }

    private void validatePromotionTime(PromotionRequestDTO requestDTO) {
        if (requestDTO.getDiscountLevel() == null && requestDTO.getPromotionValue() == null) {
            throw new IllegalArgumentException("Vui lòng nhập mức giảm cho ưu đãi.");
        }
        if (requestDTO.getStartTime() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu không được để trống.");
        }
        if (requestDTO.getEndTime() == null) {
            throw new IllegalArgumentException("Thời gian kết thúc không được để trống.");
        }
        if (!requestDTO.getEndTime().isAfter(requestDTO.getStartTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
        java.math.BigDecimal discountValue = requestDTO.getDiscountLevel() != null
                ? requestDTO.getDiscountLevel()
                : requestDTO.getPromotionValue();
        PromotionDiscountType discountType = requestDTO.getDiscountType() == null
                ? PromotionDiscountType.FIXED
                : requestDTO.getDiscountType();
        if (discountType == PromotionDiscountType.PERCENT
                && discountValue.compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Mức giảm phần trăm không được vượt quá 100%.");
        }
        if ((requestDTO.getApplicableStartTime() == null) != (requestDTO.getApplicableEndTime() == null)) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ khung giờ áp dụng.");
        }
        if (requestDTO.getApplicableStartTime() != null
                && !requestDTO.getApplicableEndTime().isAfter(requestDTO.getApplicableStartTime())) {
            throw new IllegalArgumentException("Giờ kết thúc áp dụng phải sau giờ bắt đầu.");
        }
    }

    /*private void validatePromotionImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh ưu đãi.");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(image.getContentType())) {
            throw new IllegalArgumentException("Ảnh ưu đãi chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.");
        }
        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Ảnh ưu đãi không được vượt quá 5 MB.");
        }
    }*/

    /*private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return "";
        }
        return fileName.substring(dotIndex).toLowerCase();
    }*/

    private void validatePromotionCanBeDeleted(Promotion promotion) {
        Number pendingInvoiceCount = (Number) entityManager.createNativeQuery("""
                        select count(1)
                        from invoice
                        where promotion_id = ?1
                          and status = 0
                        """)
                .setParameter(1, promotion.getPromotionId())
                .getSingleResult();

        if (pendingInvoiceCount.longValue() > 0) {
            throw new IllegalArgumentException("Không thể xóa ưu đãi đang được dùng trong giao dịch chờ thanh toán.");
        }
    }

    private void validateShowTime(Promotion promotion, LocalDateTime showTime) {
        if (showTime == null) {
            throw new IllegalArgumentException("Thời gian suất chiếu không được để trống.");
        }

        if (promotion.getApplicableDayOfWeek() != null
                && showTime.getDayOfWeek().getValue() != promotion.getApplicableDayOfWeek()) {
            throw new IllegalArgumentException("Suất chiếu không đúng thứ được áp dụng cho ưu đãi này.");
        }

        if (promotion.getApplicableStartTime() != null) {
            LocalTime showLocalTime = showTime.toLocalTime();
            if (showLocalTime.isBefore(promotion.getApplicableStartTime())
                    || !showLocalTime.isBefore(promotion.getApplicableEndTime())) {
                throw new IllegalArgumentException("Suất chiếu nằm ngoài khung giờ áp dụng ưu đãi.");
            }
        }
    }

    private void validateUsageLimit(Promotion promotion) {
        if (promotion.getUsageLimit() != null
                && promotion.getUsedCount() != null
                && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            throw new IllegalArgumentException("Ưu đãi đã hết lượt sử dụng.");
        }
    }

    private void validateBirthdayPromotion(Promotion promotion, Account account) {
        if (Boolean.TRUE.equals(promotion.getBirthdayOnly())) {
            if (account.getDateOfBirth() == null
                    || account.getDateOfBirth().getMonthValue() != LocalDateTime.now().getMonthValue()) {
                throw new IllegalArgumentException("Ưu đãi sinh nhật chỉ áp dụng trong tháng sinh nhật của khách hàng.");
            }
        }
    }
}
