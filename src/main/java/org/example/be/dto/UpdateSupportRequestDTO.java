package org.example.be.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.example.be.enums.SupportRequestStatus;

@Getter
@Setter
public class UpdateSupportRequestDTO {

    @NotNull(message = "Trạng thái không được để trống!")
    private SupportRequestStatus status;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự!")
    private String adminNote;
}
