package org.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateEmployeeRequest {

    public static final String DUPLICATE_ACCOUNT_MESSAGE =
            "The inputted account is already existed, please choose another account name";

    @Size(max = 500, message = "URL hình ảnh tối đa 500 ký tự.")
    private String image;

    @NotBlank(message = "Vui lòng nhập tài khoản.")
    @Size(max = 28, message = "Tài khoản tối đa 28 ký tự.")
    private String username;

    @NotNull(message = "Vui lòng nhập ngày sinh.")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Vui lòng chọn giới tính.")
    @Size(max = 10, message = "Giới tính tối đa 10 ký tự.")
    private String gender;

    @NotBlank(message = "Vui lòng nhập tên nhân viên.")
    @Size(max = 28, message = "Tên nhân viên tối đa 28 ký tự.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập CMND/CCCD.")
    @Size(max = 28, message = "CMND/CCCD tối đa 28 ký tự.")
    private String identityCard;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    @Size(max = 28, message = "Email tối đa 28 ký tự.")
    private String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại.")
    @Size(max = 28, message = "Số điện thoại tối đa 28 ký tự.")
    private String phoneNumber;

    @NotBlank(message = "Vui lòng nhập địa chỉ.")
    @Size(max = 28, message = "Địa chỉ tối đa 28 ký tự.")
    private String address;
}
