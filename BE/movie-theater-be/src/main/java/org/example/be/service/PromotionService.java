package org.example.be.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.be.dto.PromotionApplyRequest;
import org.example.be.dto.PromotionApplyResultDTO;
import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.entity.Account;
import org.example.be.entity.Invoice;
import org.example.be.entity.Promotion;
import org.example.be.entity.PromotionUsage;
import org.example.be.entity.Schedule;
import org.example.be.enums.PromotionDiscountType;
import org.example.be.enums.PromotionStatus;
import org.example.be.event.InvoicePaidEvent;
import org.example.be.mapper.PromotionMapper;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.InvoiceRepository;
import org.example.be.repository.PromotionRepository;
import org.example.be.repository.PromotionUsageRepository;
import org.example.be.repository.ScheduleRepository;
//import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
//import org.springframework.web.multipart.MultipartFile;
//import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
//import java.io.IOException;
import java.math.BigDecimal;
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
@Slf4j
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final AccountRepository accountRepository;
    private final PromotionMapper promotionMapper;
    private final EntityManager entityManager;
    private final PromotionUsageRepository promotionUsageRepository;
    private final InvoiceRepository invoiceRepository;
    private final ScheduleRepository scheduleRepository;
    //private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    //private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;

    /*@Value("${app.upload-dir:uploads}")
    private String uploadDir;*/

    public List<PromotionDTO> getAdminPromotions(String keyword, boolean isAdmin) {
        List<Promotion> promotions;
        if (isAdmin) {
            promotions = keyword == null || keyword.isBlank()
                    ? promotionRepository.findAllByOrderByStartTimeDesc()
                    : promotionRepository.searchAllStatusesForAdmin(keyword.trim());
        } else {
            promotions = keyword == null || keyword.isBlank()
                    ? promotionRepository.findByStatusNotOrderByStartTimeDesc(PromotionStatus.DELETED)
                    : promotionRepository.searchForAdmin(keyword.trim());
        }

        return promotions.stream().map(promotionMapper::toDTO).toList();
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
        promotion.setStatus(PromotionStatus.ACTIVE);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionDTO updatePromotion(Integer promotionId, PromotionRequestDTO requestDTO) {
        try {
            validatePromotionTime(requestDTO);
            if (requestDTO.getStatus() == PromotionStatus.DELETED) {
                throw new IllegalArgumentException("Vui lòng sử dụng chức năng xóa ưu đãi.");
            }
            Promotion promotion = findExistingPromotion(promotionId);

            BigDecimal newDiscountValue = requestDTO.getDiscountLevel() != null
                    ? requestDTO.getDiscountLevel()
                    : requestDTO.getPromotionValue();
            PromotionDiscountType newDiscountType = requestDTO.getDiscountType() == null
                    ? PromotionDiscountType.FIXED
                    : requestDTO.getDiscountType();
            boolean discountChanged = newDiscountType != promotion.getDiscountType()
                    || newDiscountValue.compareTo(promotion.getPromotionValue()) != 0;

            if (discountChanged && hasPendingInvoiceUsage(promotionId)) {
                throw new IllegalArgumentException(
                        "Không thể thay đổi mức giảm của ưu đãi đang được dùng trong giao dịch chờ thanh toán.");
            }

            promotionMapper.updateEntity(promotion, requestDTO);
            return promotionMapper.toDTO(promotionRepository.save(promotion));
        } catch (IllegalArgumentException ex) {
            log.warn("Update promotion failed [promotionId={}, discountType={}, promotionValue={}, discountLevel={}, status={}]: {}",
                    promotionId, requestDTO.getDiscountType(), requestDTO.getPromotionValue(),
                    requestDTO.getDiscountLevel(), requestDTO.getStatus(), ex.getMessage());
            throw ex;
        } catch (RuntimeException ex) {
            log.error("Unexpected error updating promotion [promotionId={}]", promotionId, ex);
            throw ex;
        }
    }

    @Transactional
    public void deletePromotion(Integer promotionId) {
        Promotion promotion = findExistingPromotion(promotionId);
        validatePromotionCanBeDeleted(promotion);
        promotion.setStatus(PromotionStatus.DELETED);
        promotionRepository.save(promotion);
    }

    @Transactional
    public PromotionDTO activatePromotion(Integer promotionId) {
        Promotion promotion = findExistingPromotion(promotionId);
        if (promotion.getStatus() == PromotionStatus.ACTIVE) {
            throw new IllegalArgumentException("Ưu đãi đã đang hoạt động.");
        }
        promotion.setStatus(PromotionStatus.ACTIVE);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionDTO deactivatePromotion(Integer promotionId) {
        Promotion promotion = findExistingPromotion(promotionId);
        if (promotion.getStatus() == PromotionStatus.INACTIVE) {
            throw new IllegalArgumentException("Ưu đãi đã tạm ngừng trước đó.");
        }
        promotion.setStatus(PromotionStatus.INACTIVE);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
    }

    @Transactional
    public PromotionDTO reactivatePromotion(Integer promotionId, PromotionStatus targetStatus) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ưu đãi."));
        if (promotion.getStatus() != PromotionStatus.DELETED) {
            throw new IllegalArgumentException("Ưu đãi chưa bị xóa, không thể khôi phục.");
        }
        if (targetStatus != PromotionStatus.ACTIVE && targetStatus != PromotionStatus.INACTIVE) {
            throw new IllegalArgumentException("Trạng thái khôi phục không hợp lệ.");
        }
        promotion.setStatus(targetStatus);
        return promotionMapper.toDTO(promotionRepository.save(promotion));
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
        return promotionRepository.findByStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                        PromotionStatus.ACTIVE, now, now)
                .stream()
                .map(promotionMapper::toDTO)
                .sorted(Comparator
                        .comparing(PromotionDTO::getExpiringSoon, Comparator.reverseOrder())
                        .thenComparing(PromotionDTO::getDaysRemaining)
                        .thenComparing(PromotionDTO::getEndTime))
                .toList();
    }

    public List<PromotionDTO> getExpiredPromotions() {
        return promotionRepository.findByStatusAndEndTimeBefore(
                        PromotionStatus.ACTIVE, LocalDateTime.now())
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
        validateSingleUsePerCustomer(promotion, account.getAccountId());

        return PromotionApplyResultDTO.builder()
                .applicable(true)
                .message("Mã ưu đãi hợp lệ.")
                .promotion(promotionMapper.toDTO(promotion))
                .build();
    }

    /** Dùng cho bước khách nhập mã ưu đãi ở trang thanh toán (đã biết suất chiếu qua scheduleId). */
    public void assertCustomerCanUsePromotion(Integer promotionId, String username, Integer scheduleId) {
        Promotion promotion = findExistingPromotion(promotionId);

        if (scheduleId != null) {
            Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
            if (schedule != null) {
                validateShowTime(promotion, schedule.getStartTime());
            }
        }

        if (username == null) {
            return;
        }
        Account account = accountRepository.findByUsername(username).orElse(null);
        if (account == null) {
            return;
        }
        validateBirthdayPromotion(promotion, account);
        validateSingleUsePerCustomer(promotion, account.getAccountId());
    }

    /**
     * Ghi nhận một lượt sử dụng ưu đãi khi hóa đơn được thanh toán thành công (idempotent theo invoiceId).
     * Chạy trong transaction riêng vì được gọi từ listener AFTER_COMMIT, lúc đó transaction gốc đã kết thúc.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvoicePaid(InvoicePaidEvent event) {
        Integer invoiceId = event.invoiceId();
        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null || invoice.getPromotionId() == null) {
            return;
        }
        if (promotionUsageRepository.existsByInvoiceId(invoiceId)) {
            return;
        }
        Promotion promotion = promotionRepository.findById(invoice.getPromotionId()).orElse(null);
        if (promotion == null) {
            return;
        }

        promotion.setUsedCount((promotion.getUsedCount() == null ? 0 : promotion.getUsedCount()) + 1);
        promotionRepository.save(promotion);

        promotionUsageRepository.save(PromotionUsage.builder()
                .customerId(invoice.getAccountId())
                .promotionId(promotion.getPromotionId())
                .invoiceId(invoiceId)
                .usedAt(LocalDateTime.now())
                .build());
    }

    private Promotion findExistingPromotion(Integer promotionId) {
        return promotionRepository.findById(promotionId)
                .filter(promotion -> promotion.getStatus() != PromotionStatus.DELETED)
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
        if (hasPendingInvoiceUsage(promotion.getPromotionId())) {
            throw new IllegalArgumentException("Không thể xóa ưu đãi đang được dùng trong giao dịch chờ thanh toán.");
        }
    }

    private boolean hasPendingInvoiceUsage(Integer promotionId) {
        Number pendingInvoiceCount = (Number) entityManager.createNativeQuery("""
                        select count(1)
                        from invoice
                        where promotion_id = ?1
                          and status = 0
                        """)
                .setParameter(1, promotionId)
                .getSingleResult();

        return pendingInvoiceCount.longValue() > 0;
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

    private void validateSingleUsePerCustomer(Promotion promotion, String customerId) {
        if (Boolean.FALSE.equals(promotion.getAllowMultipleUsePerCustomer())
                && promotionUsageRepository.existsByPromotionIdAndCustomerId(promotion.getPromotionId(), customerId)) {
            throw new IllegalArgumentException("Bạn đã sử dụng ưu đãi này trước đó.");
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
