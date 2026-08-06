package org.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyAndChangePasswordRequest {

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    private String email;

    @NotBlank(message = "Vui lòng nhập mã OTP.")
    private String otpCode;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&).")
    @Size(max = 255, message = "Mật khẩu tối đa 255 ký tự.")
    private String newPassword;
}
