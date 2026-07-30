package org.example.be.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class PromotionRequestDTO {
    @NotBlank(message = "Tiêu đề ưu đãi không được để trống.")
    @Size(max = 150, message = "Tiêu đề ưu đãi tối đa 150 ký tự.")
    private String title;

    private String content;
    private String detail;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị ưu đãi phải lớn hơn 0.")
    private BigDecimal promotionValue;

    private PromotionDiscountType discountType;

    @DecimalMin(value = "0.0", inclusive = false, message = "Mức giảm phải lớn hơn 0.")
    private BigDecimal discountLevel;

    @Min(value = 1, message = "Giới hạn lượt dùng phải lớn hơn 0.")
    private Integer usageLimit;

    @Size(max = 500, message = "URL hình ảnh tối đa 500 ký tự.")
    private String image;

    @Size(max = 500, message = "Booking URL tối đa 500 ký tự.")
    private String bookingUrl;

    private PromotionStatus status;

    @Min(value = 1, message = "Thứ áp dụng phải từ 1 đến 7.")
    @Max(value = 7, message = "Thứ áp dụng phải từ 1 đến 7.")
    private Integer applicableDayOfWeek;

    private LocalTime applicableStartTime;
    private LocalTime applicableEndTime;
    private Boolean birthdayOnly;
}
