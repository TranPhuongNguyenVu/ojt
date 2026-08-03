package org.example.be.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "Vui lòng nhập họ tên.")
    @Size(max = 255, message = "Họ tên tối đa 255 ký tự.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    @Size(max = 255, message = "Email tối đa 255 ký tự.")
    private String email;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự.")
    private String phoneNumber;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
    private String address;

    @Size(max = 10, message = "Giới tính tối đa 10 ký tự.")
    private String gender;

    private LocalDate dateOfBirth;

    @Size(max = 500, message = "URL ảnh tối đa 500 ký tự.")
    private String image;
}
