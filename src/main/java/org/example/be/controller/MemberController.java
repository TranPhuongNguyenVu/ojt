package org.example.be.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateMemberRequest;
import org.example.be.dto.MemberDTO;
import org.example.be.dto.ProfileUpdateRequest;
import org.example.be.dto.UpdateMemberRequest;
import org.example.be.service.MemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /** Tự xem thông tin cá nhân (Member đang đăng nhập) — không cần quyền Admin/Employee */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberDTO>> getMyMemberInfo() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cá nhân thành công", memberService.getMyProfile()));
    }

    /** Tự cập nhật thông tin cá nhân (Member đang đăng nhập) */
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<MemberDTO>> updateMyMemberInfo(@Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", memberService.updateMyProfile(request)));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<MemberDTO>> lookupMember(@RequestParam String query) {
        MemberDTO member = memberService.lookupMember(query);
        if (member == null) {
            return ResponseEntity.ok(ApiResponse.error(404, "No member has found!"));
        }
        return ResponseEntity.ok(ApiResponse.success("Member found", member));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin', 'ROLE_Employee')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<MemberDTO>>> getListMembers() {
        List<MemberDTO> list = memberService.getAllMembers();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Thành viên thành công", list));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @DeleteMapping("/{memberId}")
    public ResponseEntity<ApiResponse<Void>> deleteMember(@PathVariable String memberId) {
        memberService.deleteMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành viên thành công", null));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @PatchMapping("/{memberId}/lock")
    public ResponseEntity<ApiResponse<MemberDTO>> lockMember(@PathVariable String memberId) {
        MemberDTO dto = memberService.lockMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", dto));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @PatchMapping("/{memberId}/unlock")
    public ResponseEntity<ApiResponse<MemberDTO>> unlockMember(@PathVariable String memberId) {
        MemberDTO dto = memberService.unlockMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", dto));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @PutMapping("/{memberId}")
    public ResponseEntity<ApiResponse<MemberDTO>> updateMember(
            @PathVariable String memberId,
            @jakarta.validation.Valid @RequestBody UpdateMemberRequest request) {
        try {
            MemberDTO updated = memberService.updateMember(memberId, request);
            return ResponseEntity.ok(ApiResponse.success("Update information successfully", updated));
        } catch (Exception e) {
            String actor = "Customer";
            try {
                actor = org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication().getName();
            } catch (Exception ex) {}
            System.out.println(String.format(
                    "📝 [MEMBER EDIT LOG] - Time: %s | Action: UPDATE_MEMBER | Actor: %s | TargetMemberID: %s | Status: FAILED | Reason: %s",
                    java.time.LocalDateTime.now(), actor, memberId, e.getMessage()
            ));
            throw e;
        }
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @PostMapping("/{memberId}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable String memberId) {
        memberService.resetPassword(memberId);
        return ResponseEntity.ok(ApiResponse.success("Reset mật khẩu thành công và đã gửi mail về khách hàng.", null));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    @PostMapping
    public ResponseEntity<ApiResponse<MemberDTO>> createMember(
            @jakarta.validation.Valid @RequestBody CreateMemberRequest request) {
        MemberDTO created = memberService.createMember(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm mới thành viên thành công", created));
    }
}
