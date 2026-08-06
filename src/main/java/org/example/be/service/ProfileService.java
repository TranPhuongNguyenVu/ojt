package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.AccountDTO;
import org.example.be.dto.ProfileUpdateRequest;
import org.example.be.entity.Account;
import org.example.be.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Lấy thông tin profile tài khoản hiện tại ────────────────────────────
    @Transactional(readOnly = true)
    public AccountDTO getMyProfile() {
        Account account = getCurrentAccountOrThrow();
        return toDTO(account);
    }

    // ─── Cập nhật thông tin profile ───────────────────────────────────────────
    @Transactional
    public AccountDTO updateMyProfile(ProfileUpdateRequest request) {
        Account account = getCurrentAccountOrThrow();

        // Kiểm tra trùng email (trừ tài khoản hiện tại)
        if (StringUtils.hasText(request.getEmail())
                && accountRepository.existsByEmailAndAccountIdNot(request.getEmail().trim(), account.getAccountId())) {
            throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác.");
        }
        // Kiểm tra trùng SĐT (trừ tài khoản hiện tại)
        if (StringUtils.hasText(request.getPhoneNumber())
                && accountRepository.existsByPhoneNumberAndAccountIdNot(request.getPhoneNumber().trim(), account.getAccountId())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }
        if (request.getDateOfBirth() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (request.getDateOfBirth().isAfter(today)) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
            }
            if (java.time.Period.between(request.getDateOfBirth(), today).getYears() > 100) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
            }
        }

        account.setFullName(request.getFullName().trim());
        account.setEmail(request.getEmail().trim());
        account.setPhoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        account.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        account.setGender(StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null);
        account.setDateOfBirth(request.getDateOfBirth());
        account.setImage(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null);

        return toDTO(accountRepository.save(account));
    }

    // ─── Đổi mật khẩu ────────────────────────────────────────────────────────
    @Transactional
    public void changeMyPassword(String currentPassword, String newPassword) {
        Account account = getCurrentAccountOrThrow();

        if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác.");
        }

        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";
        if (!newPassword.matches(passwordRegex)) {
            throw new IllegalArgumentException(
                    "Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!");
        }

        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────
    private Account getCurrentAccountOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Vui lòng đăng nhập để thực hiện thao tác này.");
        }
        String username = auth.getName();
        return accountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy tài khoản đang đăng nhập."));
    }

    private AccountDTO toDTO(Account account) {
        return AccountDTO.builder()
                .accountId(account.getAccountId())
                .username(account.getUsername())
                .fullName(account.getFullName())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .address(account.getAddress())
                .gender(account.getGender())
                .image(account.getImage())
                .roleName(account.getRole() != null ? account.getRole().getRoleName() : null)
                .status(account.getStatus())
                .registerDate(account.getRegisterDate())
                .createdBy(account.getCreatedBy())
                .build();
    }
}
