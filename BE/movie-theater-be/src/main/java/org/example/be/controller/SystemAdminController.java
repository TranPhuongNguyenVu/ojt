package org.example.be.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.AdminDTO;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateAdminRequest;
import org.example.be.dto.UpdateAdminRequest;
import org.example.be.service.SystemAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/system-admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_SystemAdmin')")
public class SystemAdminController {

    private final SystemAdminService systemAdminService;

    /** Lấy danh sách tất cả Admin */
    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<AdminDTO>>> getAllAdmins() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Admin thành công.", systemAdminService.getAllAdmins()));
    }

    /** Lấy chi tiết một Admin */
    @GetMapping("/admins/{accountId}")
    public ResponseEntity<ApiResponse<AdminDTO>> getAdmin(@PathVariable String accountId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Admin thành công.", systemAdminService.getAdminById(accountId)));
    }

    /** Tạo mới Admin – mật khẩu mặc định là Admin@123456 */
    @PostMapping("/admins")
    public ResponseEntity<ApiResponse<AdminDTO>> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        AdminDTO created = systemAdminService.createAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo tài khoản Admin thành công. Mật khẩu mặc định: Admin@123456", created));
    }

    /** Cập nhật thông tin Admin */
    @PutMapping("/admins/{accountId}")
    public ResponseEntity<ApiResponse<AdminDTO>> updateAdmin(
            @PathVariable String accountId,
            @Valid @RequestBody UpdateAdminRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin Admin thành công.", systemAdminService.updateAdmin(accountId, request)));
    }

    /** Khóa tài khoản Admin */
    @PatchMapping("/admins/{accountId}/deactivate")
    public ResponseEntity<ApiResponse<AdminDTO>> deactivateAdmin(@PathVariable String accountId) {
        return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa tài khoản Admin.", systemAdminService.deactivateAdmin(accountId)));
    }

    /** Khôi phục tài khoản Admin */
    @PatchMapping("/admins/{accountId}/restore")
    public ResponseEntity<ApiResponse<AdminDTO>> restoreAdmin(@PathVariable String accountId) {
        return ResponseEntity.ok(ApiResponse.success("Đã khôi phục tài khoản Admin.", systemAdminService.restoreAdmin(accountId)));
    }

    /** Reset mật khẩu Admin về Admin@123456 */
    @PostMapping("/admins/{accountId}/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetAdminPassword(@PathVariable String accountId) {
        systemAdminService.resetAdminPassword(accountId);
        return ResponseEntity.ok(ApiResponse.success(
                "Đặt lại mật khẩu thành công.",
                Map.of("defaultPassword", "Admin@123456")));
    }

    /** Xóa vĩnh viễn tài khoản Admin */
    @DeleteMapping("/admins/{accountId}")
    public ResponseEntity<ApiResponse<Void>> deleteAdmin(@PathVariable String accountId) {
        systemAdminService.deleteAdmin(accountId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài khoản Admin thành công.", null));
    }
}
