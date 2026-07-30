package org.example.be.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PromotionApplyRequest {
    @NotNull(message = "Thời gian suất chiếu không được để trống.")
    private LocalDateTime showTime;
}
