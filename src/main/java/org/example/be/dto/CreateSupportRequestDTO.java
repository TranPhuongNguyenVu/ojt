package org.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSupportRequestDTO {

    @NotBlank(message = "Vui lòng nhập họ tên!")
    @Size(max = 120, message = "Họ tên tối đa 120 ký tự!")
    private String fullName;

    @NotBlank(message = "Vui lòng nhập email!")
    @Email(message = "Email không hợp lệ!")
    @Size(max = 150, message = "Email tối đa 150 ký tự!")
    private String email;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự!")
    private String phone;

    @NotBlank(message = "Vui lòng nhập chủ đề!")
    @Size(max = 200, message = "Chủ đề tối đa 200 ký tự!")
    private String subject;

    @NotBlank(message = "Vui lòng nhập nội dung!")
    @Size(min = 10, max = 5000, message = "Nội dung cần từ 10 đến 5000 ký tự!")
    private String message;
}
