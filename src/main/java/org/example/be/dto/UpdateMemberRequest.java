package org.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateMemberRequest {

    @NotBlank(message = "Vui lòng nhập tên đăng nhập.")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Tên đăng nhập chỉ được phép chứa chữ cái và số (viết liền không dấu, không khoảng trắng).")
    @Size(min = 5, max = 20, message = "Tên đăng nhập phải dài từ 5 đến 20 ký tự.")
    private String username;

    @Size(max = 255, message = "Mật khẩu tối đa 255 ký tự.")
    private String password;

    @NotBlank(message = "Vui lòng nhập họ và tên.")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng.")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự.")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập email.")
    @Email(message = "Email không hợp lệ.")
    @Size(max = 255, message = "Email tối đa 255 ký tự.")
    private String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại.")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.")
    private String phoneNumber;

    @NotNull(message = "Vui lòng nhập ngày sinh.")
    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Giới tính tối đa 10 ký tự.")
    private String gender;

    @NotBlank(message = "Vui lòng nhập CMND/CCCD.")
    @Pattern(regexp = "^\\d{9}$|^\\d{12}$", message = "Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số.")
    private String identityCard;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
    private String address;

    @Size(max = 500, message = "URL hình ảnh tối đa 500 ký tự.")
    private String image;
}
