package org.example.be.mapper;

import org.example.be.dto.PromotionDTO;
import org.example.be.dto.PromotionRequestDTO;
import org.example.be.entity.Promotion;
import org.example.be.enums.PromotionDiscountType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class PromotionMapper {
    public PromotionDTO toDTO(Promotion promotion) {
        LocalDateTime now = LocalDateTime.now();
        long daysRemaining = Duration.between(now, promotion.getEndTime()).toDays();
        boolean expiringSoon = !promotion.getEndTime().isBefore(now)
                && !promotion.getEndTime().isAfter(now.plusDays(7));

        return PromotionDTO.builder()
                .promotionId(promotion.getPromotionId())
                .title(promotion.getTitle())
                .content(promotion.getContent())
                .detail(promotion.getDetail())
                .startTime(promotion.getStartTime())
                .endTime(promotion.getEndTime())
                .promotionValue(promotion.getPromotionValue())
                .discountType(promotion.getDiscountType())
                .discountLevel(promotion.getPromotionValue())
                .usageLimit(promotion.getUsageLimit())
                .usedCount(promotion.getUsedCount())
                .image(promotion.getImage())
                .bookingUrl(promotion.getBookingUrl())
                .status(promotion.getStatus())
                .applicableDayOfWeek(promotion.getApplicableDayOfWeek())
                .applicableStartTime(promotion.getApplicableStartTime())
                .applicableEndTime(promotion.getApplicableEndTime())
                .birthdayOnly(promotion.getBirthdayOnly())
                .allowMultipleUsePerCustomer(promotion.getAllowMultipleUsePerCustomer())
                .expiringSoon(expiringSoon)
                .daysRemaining(daysRemaining)
                .build();
    }

    public Promotion toEntity(PromotionRequestDTO requestDTO) {
        Promotion promotion = new Promotion();
        updateEntity(promotion, requestDTO);
        return promotion;
    }

    public void updateEntity(Promotion promotion, PromotionRequestDTO requestDTO) {
        promotion.setTitle(requestDTO.getTitle());
        promotion.setContent(requestDTO.getContent());
        promotion.setDetail(requestDTO.getDetail());
        promotion.setStartTime(requestDTO.getStartTime());
        promotion.setEndTime(requestDTO.getEndTime());
        promotion.setPromotionValue(resolveDiscountLevel(requestDTO));
        promotion.setDiscountType(requestDTO.getDiscountType() == null ? PromotionDiscountType.FIXED : requestDTO.getDiscountType());
        promotion.setUsageLimit(requestDTO.getUsageLimit());
        promotion.setImage(requestDTO.getImage());
        promotion.setBookingUrl(requestDTO.getBookingUrl());
        if (requestDTO.getStatus() != null) {
            promotion.setStatus(requestDTO.getStatus());
        }
        promotion.setApplicableDayOfWeek(requestDTO.getApplicableDayOfWeek());
        promotion.setApplicableStartTime(requestDTO.getApplicableStartTime());
        promotion.setApplicableEndTime(requestDTO.getApplicableEndTime());
        promotion.setBirthdayOnly(Boolean.TRUE.equals(requestDTO.getBirthdayOnly()));
        promotion.setAllowMultipleUsePerCustomer(
                requestDTO.getAllowMultipleUsePerCustomer() == null || requestDTO.getAllowMultipleUsePerCustomer());
    }

    private BigDecimal resolveDiscountLevel(PromotionRequestDTO requestDTO) {
        return requestDTO.getDiscountLevel() != null
                ? requestDTO.getDiscountLevel()
                : requestDTO.getPromotionValue();
    }
}
