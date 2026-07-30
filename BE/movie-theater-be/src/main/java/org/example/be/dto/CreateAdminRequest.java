package org.example.be.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateAdminRequest {

    @NotBlank(message = "Vui lòng nhập tên đăng nhập.")
    @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự.")
    private String username;

    @NotBlank(message = "Vui lòng nhập họ tên.")
    @Size(max = 255, message = "Họ tên tối đa 255 ký tự.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    @Size(max = 255, message = "Email tối đa 255 ký tự.")
    private String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại.")
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự.")
    private String phoneNumber;

    @NotBlank(message = "Vui lòng nhập CMND/CCCD.")
    @Size(max = 20, message = "CMND/CCCD tối đa 20 ký tự.")
    private String identityCard;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
    private String address;

    @Size(max = 10, message = "Giới tính tối đa 10 ký tự.")
    private String gender;

    private LocalDate dateOfBirth;

    @Size(max = 500, message = "URL ảnh tối đa 500 ký tự.")
    private String image;
}
