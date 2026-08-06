package org.example.be.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateTypeRequest {
    @NotBlank(message = "Tên thể loại không được để trống.")
    @Size(max = 100, message = "Tên thể loại tối đa 100 ký tự.")
    private String typeName;
}
