package org.example.be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.be.enums.PromotionDiscountType;
import org.example.be.enums.PromotionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionDTO {
    private Integer promotionId;
    private String title;
    private String content;
    private String detail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal promotionValue;
    private PromotionDiscountType discountType;
    private BigDecimal discountLevel;
    private Integer usageLimit;
    private Integer usedCount;
    private String image;
    private String bookingUrl;
    private PromotionStatus status;
    private Integer applicableDayOfWeek;
    private LocalTime applicableStartTime;
    private LocalTime applicableEndTime;
    private Boolean birthdayOnly;
    private Boolean allowMultipleUsePerCustomer;
    private Boolean expiringSoon;
    private Long daysRemaining;
}
