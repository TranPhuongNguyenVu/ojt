package org.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

@Entity
@Table(name = "PROMOTION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROMOTION_ID")
    private Integer promotionId;

    @Column(name = "TITLE", length = 150, nullable = false)
    private String title;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "DETAIL", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "START_TIME", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "END_TIME", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "PROMOTION_VALUE", precision = 12, scale = 2, nullable = false)
    private BigDecimal promotionValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "DISCOUNT_TYPE", length = 20, nullable = false)
    private PromotionDiscountType discountType;

    @Column(name = "USAGE_LIMIT")
    private Integer usageLimit;

    @Builder.Default
    @Column(name = "USED_COUNT", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "IMAGE", length = 500)
    private String image;

    @Column(name = "BOOKING_URL", length = 500)
    private String bookingUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    private PromotionStatus status;

    @Column(name = "APPLICABLE_DAY_OF_WEEK")
    private Integer applicableDayOfWeek;

    @Column(name = "APPLICABLE_START_TIME")
    private LocalTime applicableStartTime;

    @Column(name = "APPLICABLE_END_TIME")
    private LocalTime applicableEndTime;

    @Builder.Default
    @Column(name = "BIRTHDAY_ONLY", nullable = false)
    private Boolean birthdayOnly = false;

    @Builder.Default
    @Column(name = "IS_DELETED", nullable = false)
    private Integer isDeleted = 0;
}
