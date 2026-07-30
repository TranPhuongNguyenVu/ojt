package org.example.be.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateMemberRequest;
import org.example.be.dto.MemberDTO;
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

    // Gài ổ khóa bảo mật: Chỉ Sếp Tổng (Admin) và Nhân viên mới có chìa khóa mở cửa
//    @PreAuthorize("hasAuthority('ROLE_Admin') or hasAuthority('ROLE_Employee')")
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<MemberDTO>> lookupMember(@RequestParam String query) {
        MemberDTO member = memberService.lookupMember(query);
        if (member == null) {
            return ResponseEntity.ok(ApiResponse.error(404, "No member has found!"));
        }
        return ResponseEntity.ok(ApiResponse.success("Member found", member));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MemberDTO>>> getListMembers() {

        // Nhờ thằng Service xuống kho bê danh sách lên (Service đã dùng Mapper ép sang DTO sẵn rồi)
        List<MemberDTO> list = memberService.getAllMembers();

        // Đóng hộp kiện hàng (bọc trong ApiResponse) ném ra mạng cho thằng Frontend hứng
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Thành viên thành công", list));
    }
    @DeleteMapping("/{memberId}")
    public ResponseEntity<ApiResponse<Void>> deleteMember(@PathVariable String memberId) {
        memberService.deleteMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành viên thành công", null));
    }

    @PatchMapping("/{memberId}/lock")
    public ResponseEntity<ApiResponse<MemberDTO>> lockMember(@PathVariable String memberId) {
        MemberDTO dto = memberService.lockMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản thành công", dto));
    }

    @PatchMapping("/{memberId}/unlock")
    public ResponseEntity<ApiResponse<MemberDTO>> unlockMember(@PathVariable String memberId) {
        MemberDTO dto = memberService.unlockMember(memberId);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", dto));
    }

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

    @PostMapping("/{memberId}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable String memberId) {
        memberService.resetPassword(memberId);
        return ResponseEntity.ok(ApiResponse.success("Reset mật khẩu thành công và đã gửi mail về khách hàng.", null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemberDTO>> createMember(
            @jakarta.validation.Valid @RequestBody CreateMemberRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        System.out.println("=== createMember Request Diagnostic ===");
        System.out.println("Authorization Header: " + httpRequest.getHeader("Authorization"));
        if (httpRequest.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : httpRequest.getCookies()) {
                System.out.println("Cookie: name=" + c.getName() + ", value=" + c.getValue());
            }
        } else {
            System.out.println("No Cookies in request");
        }
        System.out.println("=======================================");
        MemberDTO created = memberService.createMember(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm mới thành viên thành công", created));
    }
}
