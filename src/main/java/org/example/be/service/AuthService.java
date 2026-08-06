package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.AccountDTO;
import org.example.be.dto.AuthResponse;
import org.example.be.dto.LoginRequest;
import org.example.be.dto.RegisterRequest;
import org.example.be.dto.ResetPasswordRequest;
import org.example.be.entity.Account;
import org.example.be.entity.Member;
import org.example.be.entity.Role;
import org.example.be.mapper.AccountMapper;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.MemberRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountMapper accountMapper;
    private final MemberRepository memberRepository;
    private final org.example.be.config.JwtUtil jwtUtil;
    private final AccountEmailService accountEmailService;
    private final OtpService otpService;

    // 1. LOGIC ĐĂNG KÝ (Mình khôi phục lại hàm này cho bạn rồi)
    public void register(RegisterRequest request) {

        if (accountRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại!");
        }
        if (accountRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (request.getDateOfBirth().isAfter(today)) {
            throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
        }
        if (java.time.Period.between(request.getDateOfBirth(), today).getYears() > 100) {
            throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
        }

        Account account = new Account();
        Role role = new Role();
        role.setRoleId(2);
        account.setUsername(request.getUsername());
        account.setEmail(request.getEmail());
        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setFullName(request.getFullName());
        account.setDateOfBirth(request.getDateOfBirth());
        account.setGender(request.getGender());
        account.setIdentityCard(request.getIdentityCard());
        account.setPhoneNumber(request.getPhoneNumber());
        account.setAddress(request.getAddress());
        account.setRole(role);
        // [QUAN TRỌNG]: Khóa tài khoản ngay từ lúc mới đẻ
        account.setStatus(0);
        account.setCreatedBy("Customer");
        Account savedAccount = accountRepository.save(account);
        // Khai sinh Member mới
        Member newMember = new Member();
        newMember.setMemberId(java.util.UUID.randomUUID().toString());
        newMember.setScore(0);
        newMember.setAccount(savedAccount);
        memberRepository.save(newMember);
        // ========================================================
        // [QUAN TRỌNG]: ĐẺ MÃ OTP VÀ GỬI EMAIL (Hệ chống đụng độ)
        // ========================================================
        // Dán mác _REGISTER vào email để tạo Chìa khóa độc nhất
        String otpKey = request.getEmail().trim().toLowerCase() + "_REGISTER";
        String otpCode = otpService.generateAndStoreOtp(otpKey);
        accountEmailService.sendNotification(
                request.getEmail(),
                "Mã xác thực tài khoản ELITE Cinema",
                "XÁC THỰC OTP",
                "Chào mừng đến với ELITE Cinema",
                request.getFullName(),
                List.of("Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP bên dưới để kích hoạt tài khoản."),
                null,
                "MÃ OTP CỦA BẠN",
                otpCode,
                "Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!");
        // ========================================================
        // Ghi Log sự kiện
        System.out.println(String.format(
                "📝 [SECURITY LOG] - Time: %s | Action: REGISTER (PENDING OTP) | Account: %s | Status: SUCCESS",
                java.time.LocalDateTime.now(), request.getUsername()
        ));
    }

    // 2. LOGIC ĐĂNG NHẬP (Bản Final - Đạt chuẩn bảo mật quốc tế)
    public AuthResponse login(LoginRequest request) {
        // Cố tình tạo 1 biến lưu chung 1 câu báo lỗi để Hacker không dò được tên
        String invalidMsg = "Username/ password is invalid. Please try again!";

        // 1. Kiểm tra Username (Không có thì quăng câu lỗi chung)
        Account account = accountRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException(invalidMsg));

        // 2. Kiểm tra Mật khẩu (Sai pass cũng quăng câu lỗi y hệt như trên)
        boolean isPasswordMatch = passwordEncoder.matches(request.getPassword(), account.getPassword());
        if (!isPasswordMatch) {
            throw new IllegalArgumentException(invalidMsg);
        }

        // 3. Kiểm tra tài khoản bị khóa (status = 2) hoặc xóa mềm (status = 3)
        if (account.getStatus() != null && account.getStatus() == 2) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Admin.");
        }
        if (account.getStatus() != null && account.getStatus() == 3) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị xóa!");
        }

        // 4. Kêu máy tự động in ra Token
        String token = jwtUtil.generateToken(account);

        // 5. Lấy thông tin User
        AccountDTO accountDTO = accountMapper.toDTO(account);

        // 6. Đóng gói cả Token và Thông tin User vào chung một hộp
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setAccount(accountDTO);

        return response; // Gửi đi
    }

    public void forgotPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ email!");
        }
        Account account = accountRepository.findByEmail(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("Email không chính xác!"));

        String otpKey = email.trim().toLowerCase() + "_FORGOT";
        String otpCode = otpService.generateAndStoreOtp(otpKey);

        accountEmailService.sendNotification(
                email.trim(),
                "Khôi phục mật khẩu tài khoản ELITE Cinema",
                "KHÔI PHỤC MẬT KHẨU",
                "Yêu cầu khôi phục mật khẩu",
                account.getFullName(),
                List.of("Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng sử dụng mã OTP bên dưới để tiếp tục."),
                null,
                "MÃ OTP CỦA BẠN",
                otpCode,
                "Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!");
    }

    public void verifyForgotOtp(String email, String otpCode) {
        if (email == null || otpCode == null) {
            throw new IllegalArgumentException("Email và mã OTP không được để trống!");
        }
        String otpKey = email.trim().toLowerCase() + "_FORGOT";
        boolean isValid = otpService.checkOtpOnly(otpKey, otpCode.trim());
        if (!isValid) {
            throw new IllegalArgumentException("Mã OTP không chính xác hoặc đã hết hạn!");
        }
    }

    public void resetPassword(ResetPasswordRequest request) {
        String otpKey = request.getEmail().trim().toLowerCase() + "_FORGOT";
        boolean isValid = otpService.validateOtp(otpKey, request.getOtpCode().trim());
        if (!isValid) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã quá hạn!");
        }

        Account account = accountRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản gắn với email này!"));

        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
    }
}