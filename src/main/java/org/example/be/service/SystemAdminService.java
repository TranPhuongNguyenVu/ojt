package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.AdminDTO;
import org.example.be.dto.CreateAdminRequest;
import org.example.be.dto.UpdateAdminRequest;
import org.example.be.entity.Account;
import org.example.be.entity.Role;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemAdminService {

    private static final int STATUS_ACTIVE   = 1;
    private static final int STATUS_DISABLED = 2;
    // Mật khẩu mặc định khi reset - cố định theo yêu cầu
    private static final String DEFAULT_RESET_PASSWORD = "Admin@123456";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Mapping helper ───────────────────────────────────────────────────────
    private AdminDTO toDTO(Account account) {
        return AdminDTO.builder()
                .accountId(account.getAccountId())
                .username(account.getUsername())
                .fullName(account.getFullName())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .identityCard(account.getIdentityCard())
                .address(account.getAddress())
                .gender(account.getGender())
                .dateOfBirth(account.getDateOfBirth())
                .image(account.getImage())
                .status(account.getStatus())
                .registerDate(account.getRegisterDate())
                .createdBy(account.getCreatedBy())
                .build();
    }

    // ─── GET all Admins ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AdminDTO> getAllAdmins() {
        return accountRepository.findByRole_RoleName("Admin")
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ─── GET single Admin ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public AdminDTO getAdminById(String accountId) {
        Account account = findAdminAccountOrThrow(accountId);
        return toDTO(account);
    }

    // ─── CREATE Admin ─────────────────────────────────────────────────────────
    @Transactional
    public AdminDTO createAdmin(CreateAdminRequest request) {
        // Validate unique fields across ALL accounts
        if (accountRepository.existsByUsernameIgnoreCase(request.getUsername().trim())) {
            throw new IllegalArgumentException("Tên đăng nhập đã được sử dụng bởi tài khoản khác.");
        }
        if (accountRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác.");
        }
        if (StringUtils.hasText(request.getPhoneNumber())
                && accountRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }
        if (StringUtils.hasText(request.getIdentityCard())
                && accountRepository.existsByIdentityCard(request.getIdentityCard().trim())) {
            throw new IllegalArgumentException("CMND/CCCD đã được sử dụng bởi tài khoản khác.");
        }
        validateDateOfBirth(request.getDateOfBirth());

        Role adminRole = roleRepository.findByRoleName("Admin")
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy quyền Admin trong hệ thống."));

        String creator = SecurityContextHolder.getContext().getAuthentication().getName();

        Account account = Account.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(DEFAULT_RESET_PASSWORD)) // Mật khẩu mặc định khi tạo mới
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null)
                .identityCard(StringUtils.hasText(request.getIdentityCard()) ? request.getIdentityCard().trim() : null)
                .address(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null)
                .gender(StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null)
                .dateOfBirth(request.getDateOfBirth())
                .image(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null)
                .status(STATUS_ACTIVE)
                .role(adminRole)
                .createdBy(creator)
                .build();

        return toDTO(accountRepository.save(account));
    }

    // ─── UPDATE Admin ─────────────────────────────────────────────────────────
    @Transactional
    public AdminDTO updateAdmin(String accountId, UpdateAdminRequest request) {
        Account account = findAdminAccountOrThrow(accountId);

        // Validate unique fields (excluding this account)
        if (StringUtils.hasText(request.getEmail())
                && accountRepository.existsByEmailAndAccountIdNot(request.getEmail().trim(), accountId)) {
            throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác.");
        }
        if (StringUtils.hasText(request.getPhoneNumber())
                && accountRepository.existsByPhoneNumberAndAccountIdNot(request.getPhoneNumber().trim(), accountId)) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }
        if (StringUtils.hasText(request.getIdentityCard())
                && accountRepository.existsByIdentityCardAndAccountIdNot(request.getIdentityCard().trim(), accountId)) {
            throw new IllegalArgumentException("CMND/CCCD đã được sử dụng bởi tài khoản khác.");
        }
        validateDateOfBirth(request.getDateOfBirth());

        account.setFullName(request.getFullName().trim());
        account.setEmail(request.getEmail().trim());
        account.setPhoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        account.setIdentityCard(StringUtils.hasText(request.getIdentityCard()) ? request.getIdentityCard().trim() : null);
        account.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        account.setGender(StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null);
        account.setDateOfBirth(request.getDateOfBirth());
        account.setImage(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null);

        return toDTO(accountRepository.save(account));
    }

    // ─── DEACTIVATE Admin ─────────────────────────────────────────────────────
    @Transactional
    public AdminDTO deactivateAdmin(String accountId) {
        Account account = findAdminAccountOrThrow(accountId);
        if (STATUS_DISABLED == account.getStatus()) {
            throw new IllegalArgumentException("Tài khoản Admin này đã bị vô hiệu hóa.");
        }
        account.setStatus(STATUS_DISABLED);
        return toDTO(accountRepository.save(account));
    }

    // ─── RESTORE Admin ────────────────────────────────────────────────────────
    @Transactional
    public AdminDTO restoreAdmin(String accountId) {
        Account account = findAdminAccountOrThrow(accountId);
        if (STATUS_ACTIVE == account.getStatus()) {
            throw new IllegalArgumentException("Tài khoản Admin này đang hoạt động bình thường.");
        }
        account.setStatus(STATUS_ACTIVE);
        return toDTO(accountRepository.save(account));
    }

    // ─── RESET PASSWORD ───────────────────────────────────────────────────────
    @Transactional
    public void resetAdminPassword(String accountId) {
        Account account = findAdminAccountOrThrow(accountId);
        account.setPassword(passwordEncoder.encode(DEFAULT_RESET_PASSWORD));
        accountRepository.save(account);
    }

    // ─── DELETE Admin ─────────────────────────────────────────────────────────
    @Transactional
    public void deleteAdmin(String accountId) {
        Account account = findAdminAccountOrThrow(accountId);
        accountRepository.delete(account);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────
    private void validateDateOfBirth(java.time.LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return;
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
        }
        if (java.time.Period.between(dateOfBirth, today).getYears() > 100) {
            throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
        }
    }

    private Account findAdminAccountOrThrow(String accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản ID: " + accountId));
        if (account.getRole() == null || !"Admin".equals(account.getRole().getRoleName())) {
            throw new IllegalArgumentException("Tài khoản này không phải Admin.");
        }
        return account;
    }
}
