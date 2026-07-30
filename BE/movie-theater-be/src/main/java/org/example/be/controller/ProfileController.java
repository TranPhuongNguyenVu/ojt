package org.example.be.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.AccountDTO;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.ProfileUpdateRequest;
import org.example.be.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    /** Lấy thông tin tài khoản đang đăng nhập */
    @GetMapping
    public ResponseEntity<ApiResponse<AccountDTO>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin profile thành công.", profileService.getMyProfile()));
    }

    /** Cập nhật thông tin cá nhân */
    @PutMapping
    public ResponseEntity<ApiResponse<AccountDTO>> updateMyProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin profile thành công.", profileService.updateMyProfile(request)));
    }

    /** Đổi mật khẩu */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Vui lòng nhập mật khẩu hiện tại."));
        }
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Vui lòng nhập mật khẩu mới."));
        }

        profileService.changeMyPassword(currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công.", null));
    }
}
