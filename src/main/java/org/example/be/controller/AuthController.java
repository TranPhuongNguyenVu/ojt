package org.example.be.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.AuthResponse;
import org.example.be.dto.LoginRequest;
import org.example.be.dto.RegisterRequest;
import org.example.be.dto.ResetPasswordRequest;
import org.example.be.dto.VerifyAndChangePasswordRequest;
import org.example.be.dto.ChangePasswordRequest;
import org.example.be.entity.Account;
import org.example.be.repository.AccountRepository;
import org.example.be.service.AuthService;
import org.example.be.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.example.be.service.EmailService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công!", null));
    }

    // ĐÃ SỬA THÀNH AuthResponse Ở ĐÂY:
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        AuthResponse result = authService.login(request);

        // 1. Nhét Token vào HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("token", result.getToken())
                .httpOnly(true)       // Bọc thép, cấm Javascript React đụng vào
                .secure(true)         // Bắt buộc khi SameSite=None; trình duyệt vẫn coi http://localhost là secure context nên vẫn chạy local bình thường
                .path("/")            // Áp dụng cho mọi API
                .maxAge(24 * 60 * 60) // Tồn tại 1 ngày
                .sameSite("None")     // FE/BE khác domain -> Lax sẽ bị trình duyệt chặn không gửi cookie
                .build();
        // 2. Giữ token trong body để Swagger/curl test; FE vẫn dùng cookie
        // 3. Kẹp Cookie vào Header trả về
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Xác thực thành công!", result));
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Tạo một cái Cookie rỗng, đè lên cái Token cũ và set thời gian sống (Max-Age) = 0 để tiêu diệt nó ngay lập tức
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new ApiResponse<>(200, "Đăng xuất thành công!", null));
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otpCode) {

        // 1. Dựng lại đúng cái hình thù Chìa khóa lúc nãy (_REGISTER) để đối chiếu
        String otpKey = email.trim().toLowerCase() + "_REGISTER";
        boolean isValid = otpService.validateOtp(otpKey, otpCode);

        if (!isValid) {
            return ResponseEntity.badRequest().body("Mã OTP không hợp lệ hoặc đã quá 10 phút hạn sử dụng!");
        }
        // 2. Mã chuẩn -> Lôi Account dưới DB lên, gỡ phong ấn (status = 1)
        Account account = accountRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("Lỗi máy chủ: Không tìm thấy tài khoản gắn với Email này!"));

        account.setStatus(1);
        accountRepository.save(account);
        // 3. Trả kết quả xanh rờn cho Frontend
        return ResponseEntity.ok("Tuyệt vời! Xác thực tài khoản thành công! Bạn có thể Đăng nhập ngay bây giờ.");
    }

    @PostMapping("/verify-and-change-password")
    public ResponseEntity<?> verifyAndChangePassword(@RequestBody VerifyAndChangePasswordRequest request) {
        String otpKey = request.getEmail().trim().toLowerCase() + "_REGISTER";
        boolean isValid = otpService.validateOtp(otpKey, request.getOtpCode());

        if (!isValid) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Mã OTP không hợp lệ hoặc đã quá 10 phút hạn sử dụng!"));
        }

        Account account = accountRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản gắn với Email này!"));

        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        account.setStatus(1);
        accountRepository.save(account);

        return ResponseEntity.ok(ApiResponse.success("Tuyệt vời! Xác thực tài khoản và đổi mật khẩu thành công! Bạn có thể Đăng nhập ngay bây giờ.", null));
    }

    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(@RequestParam String email, @RequestParam String otpCode) {
        String otpKey = email.trim().toLowerCase() + "_REGISTER";
        boolean isValid = otpService.checkOtpOnly(otpKey, otpCode.trim());
        if (!isValid) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Mã OTP không hợp lệ hoặc đã quá 10 phút hạn sử dụng! Vui lòng dùng mã trong email mới nhất (sau khi bấm Gửi mã OTP)."));
        }
        return ResponseEntity.ok(ApiResponse.success("Mã OTP chính xác.", null));
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        Account account = accountRepository.findByEmail(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("Email không chính xác!"));

        String otpKey = email.trim().toLowerCase() + "_REGISTER";
        String otpCode = otpService.generateAndStoreOtp(otpKey);

        String tieuDe = "Mã xác thực tài khoản MTMS Cinema";
        String noiDung = "Chào " + account.getFullName() + ",\n\n"
                + "Mã xác thực OTP của bạn là: " + otpCode + "\n\n"
                + "Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!";
        emailService.sendSimpleEmail(email.trim(), tieuDe, noiDung);

        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi thành công!", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP khôi phục mật khẩu đã được gửi!", null));
    }

    @PostMapping("/verify-forgot-otp")
    public ResponseEntity<?> verifyForgotOtp(@RequestParam String email, @RequestParam String otpCode) {
        authService.verifyForgotOtp(email, otpCode);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP chính xác.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công!", null));
    }

    @PostMapping("/change-password/request")
    public ResponseEntity<?> requestChangePassword(@RequestBody ChangePasswordRequest request) {
        if (request.getEmail() == null || request.getCurrentPassword() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Vui lòng nhập đầy đủ thông tin!"));
        }

        Account account = accountRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản gắn với Email này!"));

        if (!passwordEncoder.matches(request.getCurrentPassword().trim(), account.getPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Mật khẩu hiện tại không chính xác!"));
        }

        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
        if (!request.getNewPassword().matches(passwordRegex)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)!"));
        }

        String otpKey = request.getEmail().trim().toLowerCase() + "_CHANGE_PASSWORD";
        String otpCode = otpService.generateAndStoreOtp(otpKey);

        String tieuDe = "Mã xác nhận thay đổi mật khẩu tài khoản MTMS Cinema";
        String noiDung = "Chào " + account.getFullName() + ",\n\n"
                + "Bạn đang thực hiện yêu cầu thay đổi mật khẩu. Mã xác thực OTP của bạn là: " + otpCode + "\n\n"
                + "Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!";
        emailService.sendSimpleEmail(request.getEmail().trim(), tieuDe, noiDung);

        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn thành công!", null));
    }

    @PostMapping("/change-password/confirm")
    public ResponseEntity<?> confirmChangePassword(@RequestBody VerifyAndChangePasswordRequest request) {
        if (request.getEmail() == null || request.getOtpCode() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Vui lòng nhập đầy đủ thông tin!"));
        }

        String otpKey = request.getEmail().trim().toLowerCase() + "_CHANGE_PASSWORD";
        boolean isValid = otpService.validateOtp(otpKey, request.getOtpCode().trim());
        if (!isValid) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Mã OTP không hợp lệ hoặc đã quá 10 phút hạn sử dụng!"));
        }

        Account account = accountRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản gắn với Email này!"));

        account.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        accountRepository.save(account);

        System.out.println(String.format(
                "📝 [SECURITY LOG] - Time: %s | Action: CHANGE_PASSWORD_OTP | Account: %s | Status: SUCCESS",
                java.time.LocalDateTime.now(), account.getUsername()
        ));

        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!", null));
    }
}