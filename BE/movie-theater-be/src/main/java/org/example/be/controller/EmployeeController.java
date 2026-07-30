package org.example.be.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateEmployeeRequest;
import org.example.be.dto.EmployeeDTO;
import org.example.be.dto.UpdateEmployeeRequest;
import org.example.be.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Validated
public class EmployeeController {

    private final EmployeeService employeeService;

    /**
     * AC-01, AC-04, AC-05: Danh sách nhân viên + tìm kiếm (keyword tối đa 28 ký tự).
     * AC-06: Chỉ Admin.
     */
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> listEmployees(
            @RequestParam(required = false)
            @Size(max = 28, message = "Từ khóa tìm kiếm tối đa 28 ký tự.")
            String keyword) {
        List<EmployeeDTO> employees = employeeService.getEmployees(keyword);
        String message = keyword == null || keyword.isBlank()
                ? "Lấy danh sách nhân viên thành công."
                : "Tìm kiếm nhân viên thành công.";
        return ResponseEntity.ok(ApiResponse.success(message, employees));
    }

    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getEmployee(@PathVariable String employeeId) {
        EmployeeDTO employee = employeeService.getEmployeeById(employeeId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhân viên thành công.", employee));
    }

    /** AC-03: Thêm nhân viên. AC-06: Chỉ Admin. */
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDTO>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeDTO created = employeeService.createEmployee(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm nhân viên thành công.", created));
    }

    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateEmployee(
            @PathVariable String employeeId,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeDTO updated = employeeService.updateEmployee(employeeId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhân viên thành công.", updated));
    }

    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @PostMapping("/{employeeId}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable String employeeId) {
        employeeService.resetPassword(employeeId);
        return ResponseEntity.ok(ApiResponse.success(
                "Reset mật khẩu thành công, vui lòng kiểm tra email để lấy mật khẩu mới.", null));
    }

    /**
     * Vô hiệu hóa — giữ record trong DB, account.status = 2, không cho đăng nhập.
     */
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @PatchMapping("/{employeeId}/deactivate")
    public ResponseEntity<ApiResponse<EmployeeDTO>> deactivateEmployee(@PathVariable String employeeId) {
        EmployeeDTO deactivated = employeeService.deactivateEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa nhân viên thành công.", deactivated));
    }

    /**
     * Khôi phục — đưa account.status từ 2 về 1, cho phép đăng nhập lại.
     */
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @PatchMapping("/{employeeId}/restore")
    public ResponseEntity<ApiResponse<EmployeeDTO>> restoreEmployee(@PathVariable String employeeId) {
        EmployeeDTO restored = employeeService.restoreEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục nhân viên thành công.", restored));
    }

    /**
     * Xóa vĩnh viễn — xóa cả EMPLOYEE và ACCOUNT khỏi DB.
     */
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    @DeleteMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable String employeeId) {
        employeeService.deleteEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhân viên thành công.", null));
    }
}
