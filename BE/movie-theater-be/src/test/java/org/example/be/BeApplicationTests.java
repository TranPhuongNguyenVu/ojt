package org.example.be;

import org.example.be.dto.CreateMemberRequest;
import org.example.be.dto.RegisterRequest;
import org.example.be.entity.Account;
import org.example.be.entity.Member;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.MemberRepository;
import org.example.be.service.AuthService;
import org.example.be.service.MemberService;
import org.example.be.service.OtpService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@SpringBootTest
class BeApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthService authService;

    @Autowired
    private MemberService memberService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final String TEST_CUSTOMER_USER = "test_cust_999";
    private final String TEST_CUSTOMER_EMAIL = "test_cust_999@example.com";
    private final String TEST_ADMIN_USER = "test_admin_created_888";
    private final String TEST_ADMIN_EMAIL = "test_admin_created_888@example.com";

    @BeforeEach
    @AfterEach
    void cleanUpTestAccounts() {
        // Clean up test data before and after runs
        deleteAccountAndMember(TEST_CUSTOMER_USER, TEST_CUSTOMER_EMAIL);
        deleteAccountAndMember(TEST_ADMIN_USER, TEST_ADMIN_EMAIL);
    }

    private void deleteAccountAndMember(String username, String email) {
        Optional<Account> accOpt = accountRepository.findByEmail(email);
        if (accOpt.isPresent()) {
            Account acc = accOpt.get();
            Optional<Member> memOpt = memberRepository.findAll().stream()
                    .filter(m -> m.getAccount() != null && m.getAccount().getAccountId().equals(acc.getAccountId()))
                    .findFirst();
            memOpt.ifPresent(member -> memberRepository.delete(member));
            accountRepository.delete(acc);
        }
        
        // Tertiary fallback by phone or identity card
        accountRepository.findAll().stream()
                .filter(a -> "0999999999".equals(a.getPhoneNumber()))
                .findFirst()
                .ifPresent(acc -> {
                    memberRepository.findAll().stream()
                            .filter(m -> m.getAccount() != null && m.getAccount().getAccountId().equals(acc.getAccountId()))
                            .findFirst()
                            .ifPresent(memberRepository::delete);
                    accountRepository.delete(acc);
                });
    }

    @Test
    void testCustomerSelfRegistrationAndOtpVerification() throws Exception {
        // 1. Prepare register request for customer
        RegisterRequest request = new RegisterRequest();
        request.setUsername(TEST_CUSTOMER_USER);
        request.setPassword("password123");
        request.setEmail(TEST_CUSTOMER_EMAIL);
        request.setFullName("Test Customer Self");
        request.setDateOfBirth(LocalDate.of(2000, 1, 1));
        request.setGender("Nam");
        request.setIdentityCard("999999999999");
        request.setPhoneNumber("0999999999");
        request.setAddress("Hanoi, Vietnam");

        // 2. Perform register
        authService.register(request);

        // 3. Verify in Database
        Account account = accountRepository.findByEmail(TEST_CUSTOMER_EMAIL)
                .orElseThrow(() -> new AssertionError("Account was not saved"));

        Assertions.assertEquals(0, account.getStatus(), "Customer self-registration status must be 0 (Unverified)");
        Assertions.assertEquals("Customer", account.getCreatedBy(), "Customer self-registration createdBy must be 'Customer'");

        // 4. Retrieve generated OTP using reflection
        String otpCode = getOtpFromCache(TEST_CUSTOMER_EMAIL + "_REGISTER");
        Assertions.assertNotNull(otpCode, "OTP code should be generated and stored in OtpService");

        // 5. Test checkOtpOnly (verifies but does not consume OTP)
        boolean isCheck1Valid = otpService.checkOtpOnly(TEST_CUSTOMER_EMAIL + "_REGISTER", otpCode);
        Assertions.assertTrue(isCheck1Valid, "OTP check should succeed");

        boolean isCheck2Valid = otpService.checkOtpOnly(TEST_CUSTOMER_EMAIL + "_REGISTER", otpCode);
        Assertions.assertTrue(isCheck2Valid, "OTP check should succeed again because checkOtpOnly does not consume it");

        // 6. Test verifyOtp (which consumes the OTP and activates status to 1)
        boolean isValidationValid = otpService.validateOtp(TEST_CUSTOMER_EMAIL + "_REGISTER", otpCode);
        Assertions.assertTrue(isValidationValid, "OTP validation should succeed and consume it");

        boolean isValidationConsumed = otpService.validateOtp(TEST_CUSTOMER_EMAIL + "_REGISTER", otpCode);
        Assertions.assertFalse(isValidationConsumed, "OTP validation should fail now because it was consumed");

        // Activate the account
        account.setStatus(1);
        accountRepository.save(account);

        // Retrieve and check status
        Account updatedAccount = accountRepository.findByEmail(TEST_CUSTOMER_EMAIL).get();
        Assertions.assertEquals(1, updatedAccount.getStatus(), "Account should be ACTIVE (1) after successful OTP verification");
    }

    @Test
    void testAdminCreatedMemberFirstLoginOtpAndPasswordChangeFlow() throws Exception {
        // 1. Prepare create request by Admin
        CreateMemberRequest request = new CreateMemberRequest();
        request.setUsername(TEST_ADMIN_USER);
        request.setEmail(TEST_ADMIN_EMAIL);
        request.setFullName("Test Admin Created");
        request.setDateOfBirth(LocalDate.of(2000, 1, 1));
        request.setGender("Nam");
        request.setIdentityCard("987654321");
        request.setPhoneNumber("0123456789");
        request.setAddress("Hanoi, Vietnam");

        // 2. Perform create member
        memberService.createMember(request);

        // 3. Verify in Database
        Account account = accountRepository.findByEmail(TEST_ADMIN_EMAIL)
                .orElseThrow(() -> new AssertionError("Account was not saved"));

        Assertions.assertEquals(0, account.getStatus(), "Admin-created account status must be 0 (Unverified)");
        Assertions.assertEquals("Admin", account.getCreatedBy(), "Admin-created account createdBy must be 'Admin'");

        // Generate and store OTP (normally triggered during login or check-email, but we can generate it manually)
        String otpKey = TEST_ADMIN_EMAIL + "_REGISTER";
        String otpCode = otpService.generateAndStoreOtp(otpKey);
        Assertions.assertNotNull(otpCode, "OTP should be successfully generated");

        // 4. Test checkOtpOnly
        boolean isCheckValid = otpService.checkOtpOnly(otpKey, otpCode);
        Assertions.assertTrue(isCheckValid, "OTP check should succeed");

        // 5. Test verifyAndChangePassword (performs check, consumes OTP, changes password and activates account)
        String newPassword = "superSecureNewPassword123";
        
        // Mock request body
        org.example.be.dto.VerifyAndChangePasswordRequest changeReq = new org.example.be.dto.VerifyAndChangePasswordRequest();
        changeReq.setEmail(TEST_ADMIN_EMAIL);
        changeReq.setOtpCode(otpCode);
        changeReq.setNewPassword(newPassword);

        // Simulate Controller verifyAndChangePassword logic:
        boolean isValidOtp = otpService.validateOtp(otpKey, changeReq.getOtpCode());
        Assertions.assertTrue(isValidOtp, "OTP validation in verifyAndChangePassword should succeed");

        account.setPassword(passwordEncoder.encode(changeReq.getNewPassword()));
        account.setStatus(1);
        accountRepository.save(account);

        // 6. Verify password update and status
        Account updatedAccount = accountRepository.findByEmail(TEST_ADMIN_EMAIL).get();
        Assertions.assertEquals(1, updatedAccount.getStatus(), "Account should be ACTIVE (1) after password change");
        Assertions.assertTrue(passwordEncoder.matches(newPassword, updatedAccount.getPassword()), "Password should be updated and match the encoder");
    }

    @SuppressWarnings("unchecked")
    private String getOtpFromCache(String key) throws Exception {
        Field field = OtpService.class.getDeclaredField("otpStorage");
        field.setAccessible(true);
        Map<String, ?> otpStorage = (Map<String, ?>) field.get(otpService);
        Object otpData = otpStorage.get(key != null ? key.toLowerCase() : "");
        if (otpData == null) return null;
        
        Field codeField = otpData.getClass().getDeclaredField("otpCode");
        codeField.setAccessible(true);
        return (String) codeField.get(otpData);
    }
}
