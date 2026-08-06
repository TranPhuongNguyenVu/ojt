package org.example.be.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Vui lòng nhập tên đăng nhập.")
    @Size(max = 255, message = "Tên đăng nhập tối đa 255 ký tự.")
    private String username;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    @Size(max = 255, message = "Mật khẩu tối đa 255 ký tự.")
    private String password;
}
