package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.CreateEmployeeRequest;
import org.example.be.dto.EmployeeDTO;
import org.example.be.dto.UpdateEmployeeRequest;
import org.example.be.entity.Account;
import org.example.be.entity.Employee;
import org.example.be.entity.Role;
import org.example.be.mapper.EmployeeMapper;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.EmployeeRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final int MAX_SEARCH_LENGTH = 28;
    private static final int STATUS_ACTIVE = 1;
    private static final int STATUS_DISABLED = 2;
    private static final int STATUS_PENDING = 0;

    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;
    private final AccountEmailService accountEmailService;

    public List<EmployeeDTO> getEmployees(String keyword) {
        validateKeyword(keyword);
        String normalized = normalizeKeyword(keyword);
        List<Employee> list = (normalized == null)
                ? employeeRepository.findAllWithAccount()
                : employeeRepository.searchEmployees(normalized);
        return list.stream()
                .map(employeeMapper::toDTO)
                .toList();
    }

    public EmployeeDTO getEmployeeById(String employeeId) {
        Employee employee = employeeRepository.findByIdWithAccount(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));
        return employeeMapper.toDTO(employee);
    }

    @Transactional
    public EmployeeDTO updateEmployee(String employeeId, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findByIdWithAccount(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));
        Account account = employee.getAccount();

        validateUniqueFields(account.getAccountId(), request);
        validateDateOfBirth(request.getDateOfBirth());

        account.setFullName(request.getFullName().trim());
        account.setEmail(request.getEmail().trim());
        account.setGender(StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null);
        account.setDateOfBirth(request.getDateOfBirth());
        account.setIdentityCard(StringUtils.hasText(request.getIdentityCard()) ? request.getIdentityCard().trim() : null);
        account.setPhoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        account.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        account.setImage(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null);

        accountRepository.save(account);
        return employeeMapper.toDTO(employee);
    }

    @Transactional
    public void resetPassword(String employeeId) {
        Employee employee = findEmployeeOrThrow(employeeId);
        Account account = employee.getAccount();
        validateEmployeeRole(account);

        String newPassword = generateRandomPassword();
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);

        accountEmailService.sendNotification(
                account.getEmail(),
                "Khôi phục mật khẩu tài khoản nhân viên",
                "KHÔI PHỤC MẬT KHẨU",
                "Mật khẩu của bạn đã được đặt lại",
                account.getFullName(),
                List.of("Yêu cầu khôi phục mật khẩu cho tài khoản nhân viên của bạn đã được thực hiện bởi Quản trị viên."),
                null,
                "MẬT KHẨU MỚI",
                newPassword,
                "Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu mới để đảm bảo an toàn.");
    }

    @Transactional
    public EmployeeDTO createEmployee(CreateEmployeeRequest request) {
        if (accountRepository.existsByUsernameIgnoreCase(request.getUsername().trim())) {
            throw new IllegalArgumentException(CreateEmployeeRequest.DUPLICATE_ACCOUNT_MESSAGE);
        }
        if (accountRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác.");
        }
        if (accountRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }
        if (accountRepository.existsByIdentityCard(request.getIdentityCard().trim())) {
            throw new IllegalArgumentException("CMND/CCCD đã được sử dụng bởi tài khoản khác.");
        }
        validateDateOfBirth(request.getDateOfBirth());

        Role employeeRole = roleRepository.findByRoleName("Employee")
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quyền Employee."));

        String creator = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        String rawPassword = generateRandomPassword();

        Account account = Account.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .identityCard(request.getIdentityCard().trim())
                .address(request.getAddress().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender().trim())
                .image(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null)
                .status(STATUS_PENDING)
                .role(employeeRole)
                .createdBy(creator)
                .build();

        Account savedAccount = accountRepository.save(account);
        Employee employee = Employee.builder().account(savedAccount).build();
        Employee savedEmployee = employeeRepository.save(employee);

        accountEmailService.sendNotification(
                request.getEmail().trim(),
                "Thông tin tài khoản nhân viên ELITE Cinema",
                "TÀI KHOẢN MỚI",
                "Tài khoản nhân viên của bạn đã sẵn sàng",
                request.getFullName().trim(),
                List.of("Bạn đã được cấp tài khoản nhân viên tại hệ thống ELITE Cinema."),
                List.of(new AccountEmailService.FieldRow("TÊN ĐĂNG NHẬP", request.getUsername().trim())),
                "MẬT KHẨU TẠM THỜI",
                rawPassword,
                "Vui lòng đăng nhập bằng mật khẩu tạm thời, sau đó đổi mật khẩu mới để kích hoạt tài khoản. "
                        + "Mã OTP sẽ được gửi đến email của bạn khi bạn thực hiện đổi mật khẩu.");

        return employeeMapper.toDTO(savedEmployee);
    }

    @Transactional
    public EmployeeDTO deactivateEmployee(String employeeId) {
        Employee employee = findEmployeeOrThrow(employeeId);
        Account account = employee.getAccount();
        validateEmployeeRole(account);

        if (account.getStatus() != null && account.getStatus() == STATUS_DISABLED) {
            throw new IllegalArgumentException("Nhân viên đã bị vô hiệu hóa.");
        }

        account.setStatus(STATUS_DISABLED);
        accountRepository.save(account);
        return employeeMapper.toDTO(employee);
    }

    @Transactional
    public EmployeeDTO restoreEmployee(String employeeId) {
        Employee employee = findEmployeeOrThrow(employeeId);
        Account account = employee.getAccount();
        validateEmployeeRole(account);

        if (account.getStatus() == null || account.getStatus() != STATUS_DISABLED) {
            throw new IllegalArgumentException("Chỉ có thể khôi phục nhân viên đang bị vô hiệu hóa.");
        }

        account.setStatus(STATUS_ACTIVE);
        accountRepository.save(account);
        return employeeMapper.toDTO(employee);
    }

    @Transactional
    public void deleteEmployee(String employeeId) {
        Employee employee = findEmployeeOrThrow(employeeId);
        Account account = employee.getAccount();
        validateEmployeeRole(account);

        employeeRepository.delete(employee);
        accountRepository.delete(account);
    }

    private Employee findEmployeeOrThrow(String employeeId) {
        return employeeRepository.findByIdWithAccount(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));
    }

    private void validateEmployeeRole(Account account) {
        if (account.getRole() == null || !"Employee".equals(account.getRole().getRoleName())) {
            throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản nhân viên.");
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

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

    private void validateUniqueFields(String accountId, UpdateEmployeeRequest request) {
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
    }

    private void validateKeyword(String keyword) {
        if (keyword != null && keyword.length() > MAX_SEARCH_LENGTH) {
            throw new IllegalArgumentException("Từ khóa tìm kiếm tối đa 28 ký tự.");
        }
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
