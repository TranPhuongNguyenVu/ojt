package org.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateEmployeeRequest {

    @NotBlank(message = "Vui lòng nhập họ và tên.")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự.")
    private String fullName;

    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Giới tính tối đa 10 ký tự.")
    private String gender;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    @Size(max = 255, message = "Email tối đa 255 ký tự.")
    private String email;

    @Size(max = 12, message = "CMND/CCCD tối đa 12 ký tự.")
    private String identityCard;

    @Size(max = 10, message = "Số điện thoại tối đa 10 ký tự.")
    private String phoneNumber;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
    private String address;

    @Size(max = 500, message = "URL hình ảnh tối đa 500 ký tự.")
    private String image;
}
