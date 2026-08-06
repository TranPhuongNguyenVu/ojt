package org.example.be.service;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.CreateMemberRequest;
import org.example.be.dto.MemberDTO;
import org.example.be.dto.ProfileUpdateRequest;
import org.example.be.dto.UpdateMemberRequest;
import org.example.be.entity.Account;
import org.example.be.entity.Member;
import org.example.be.entity.Role;
import org.example.be.mapper.MemberMapper;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.MemberRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final int ACCOUNT_STATUS_ACTIVE = 1;

    private final MemberRepository memberRepository;
    private final MemberMapper memberMapper; // Gọi cái máy Mapper ra
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountEmailService accountEmailService;
    private final RoleRepository roleRepository;

    // ─── Tự xem / tự cập nhật thông tin cá nhân (Member đang đăng nhập) ───────
    @Transactional(readOnly = true)
    public MemberDTO getMyProfile() {
        return memberMapper.toDTO(getCurrentMemberOrThrow());
    }

    @Transactional
    public MemberDTO updateMyProfile(ProfileUpdateRequest request) {
        Member member = getCurrentMemberOrThrow();
        Account account = member.getAccount();

        if (StringUtils.hasText(request.getPhoneNumber())
                && accountRepository.existsByPhoneNumberAndAccountIdNot(request.getPhoneNumber().trim(), account.getAccountId())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }

        if (request.getDateOfBirth() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (request.getDateOfBirth().isAfter(today)) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
            }
            int age = java.time.Period.between(request.getDateOfBirth(), today).getYears();
            if (age < 18) {
                throw new IllegalArgumentException("Thành viên phải từ 18 tuổi trở lên.");
            }
            if (age > 100) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
            }
        }

        account.setFullName(request.getFullName().trim());
        account.setPhoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        account.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        account.setGender(StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null);
        account.setDateOfBirth(request.getDateOfBirth());
        account.setImage(StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null);

        accountRepository.save(account);
        return memberMapper.toDTO(member);
    }

    private Member getCurrentMemberOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Vui lòng đăng nhập để thực hiện thao tác này.");
        }
        Account account = accountRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy tài khoản đang đăng nhập."));
        return memberRepository.findByAccountAccountId(account.getAccountId())
                .orElseThrow(() -> new IllegalStateException("Tài khoản đang đăng nhập không phải là thành viên."));
    }

    public MemberDTO lookupMember(String query) {
        if (!StringUtils.hasText(query)) {
            return null;
        }
        String normalized = query.trim().replaceAll("\\s+", "");

        Optional<Member> memberOpt = memberRepository.findByAccountPhoneNumber(normalized);
        if (memberOpt.isEmpty()) {
            return null;
        }

        Member member = memberOpt.get();
        Account account = member.getAccount();
        if (account == null || account.getRole() == null || account.getRole().getRoleId() != 2) {
            return null;
        }
        if (account.getStatus() == null || account.getStatus() != ACCOUNT_STATUS_ACTIVE) {
            throw new IllegalArgumentException(
                    "Tài khoản thành viên này hiện không hoạt động, không thể gắn vào giao dịch mới.");
        }
        return memberMapper.toDTO(member);
    }

    public List<MemberDTO> getAllMembers() {
        // BƯỚC 1: Hút toàn bộ danh sách Member gốc (Entity) từ Database
        List<Member> memberListFromDB = memberRepository.findAll();

        // BƯỚC 2: Chuẩn bị một cái Rổ trống (ArrayList) để đựng DTO
        List<MemberDTO> resultList = new ArrayList<>();

        // BƯỚC 3: Dùng vòng lặp duyệt qua từng thằng Member
        for (Member member : memberListFromDB) {


            MemberDTO dto = memberMapper.toDTO(member);

            // Ném cái DTO vừa biến hình xong vào Rổ
            resultList.add(dto);
        }

        // BƯỚC 4: Bưng cái Rổ trả về cho Controller
        return resultList;
    }
    @Transactional
    public void deleteMember(String memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
        Account account = member.getAccount();
        if (account != null) {
            // Kiểm tra bảo mật: tránh xóa nhầm Admin/Employee qua API này
            if (account.getRole() == null || account.getRole().getRoleId() != 2) {
                throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản thành viên.");
            }
            // Xóa mềm tài khoản thành viên (status = 3: Soft Deleted)
            account.setStatus(3);
            accountRepository.save(account);
        }
    }

    @Transactional
    public MemberDTO lockMember(String memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
        Account account = member.getAccount();
        if (account == null) {
            throw new IllegalArgumentException("Thành viên không có tài khoản liên kết.");
        }
        if (account.getRole() == null || account.getRole().getRoleId() != 2) {
            throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản thành viên.");
        }
        account.setStatus(2); // 2 = Disabled
        accountRepository.save(account);
        return memberMapper.toDTO(member);
    }

    @Transactional
    public MemberDTO unlockMember(String memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
        Account account = member.getAccount();
        if (account == null) {
            throw new IllegalArgumentException("Thành viên không có tài khoản liên kết.");
        }
        if (account.getRole() == null || account.getRole().getRoleId() != 2) {
            throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản thành viên.");
        }
        account.setStatus(1); // 1 = Active
        accountRepository.save(account);
        return memberMapper.toDTO(member);
    }

    @Transactional
    public MemberDTO updateMember(String memberId, UpdateMemberRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
        Account account = member.getAccount();
        if (account == null) {
            throw new IllegalArgumentException("Thành viên không có tài khoản liên kết.");
        }
        if (account.getRole() == null || account.getRole().getRoleId() != 2) {
            throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản thành viên.");
        }

        validateUniqueFields(account.getAccountId(), request);

        if (request.getDateOfBirth() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (request.getDateOfBirth().isAfter(today)) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
            }
            int age = java.time.Period.between(request.getDateOfBirth(), today).getYears();
            if (age < 18) {
                throw new IllegalArgumentException("Thành viên đăng ký phải từ 18 tuổi trở lên.");
            }
            if (age > 100) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
            }
        }

        // Cập nhật Account (không chạm đến score ở Member)
        account.setUsername(request.getUsername().trim());
        if (org.springframework.util.StringUtils.hasText(request.getPassword())) {
            account.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        account.setFullName(request.getFullName().trim());
        account.setEmail(request.getEmail().trim());
        account.setGender(org.springframework.util.StringUtils.hasText(request.getGender()) ? request.getGender().trim() : null);
        account.setDateOfBirth(request.getDateOfBirth());
        account.setIdentityCard(org.springframework.util.StringUtils.hasText(request.getIdentityCard()) ? request.getIdentityCard().trim() : null);
        account.setPhoneNumber(org.springframework.util.StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        account.setAddress(org.springframework.util.StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        account.setImage(org.springframework.util.StringUtils.hasText(request.getImage()) ? request.getImage().trim() : null);

        accountRepository.save(account);

        // AC-04: Log edit event
        String actor = "Customer";
        try {
            actor = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
        } catch (Exception e) {}
        System.out.println(String.format(
                "📝 [MEMBER EDIT LOG] - Time: %s | Action: UPDATE_MEMBER | Actor: %s | TargetMemberID: %s | Status: SUCCESS",
                java.time.LocalDateTime.now(), actor, memberId
        ));

        return memberMapper.toDTO(member);
    }

    @Transactional
    public void resetPassword(String memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên."));
        Account account = member.getAccount();
        if (account == null) {
            throw new IllegalArgumentException("Thành viên không có tài khoản liên kết.");
        }
        if (account.getRole() == null || account.getRole().getRoleId() != 2) {
            throw new IllegalArgumentException("Chỉ thao tác được trên tài khoản thành viên.");
        }

        // Sinh mật khẩu ngẫu nhiên 8 ký tự
        String newPassword = generateRandomPassword();
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);

        // Gửi email
        accountEmailService.sendNotification(
                account.getEmail(),
                "Khôi phục mật khẩu tài khoản ELITE Cinema",
                "KHÔI PHỤC MẬT KHẨU",
                "Mật khẩu của bạn đã được đặt lại",
                account.getFullName(),
                List.of("Yêu cầu khôi phục mật khẩu cho tài khoản của bạn đã được thực hiện bởi Quản trị viên."),
                null,
                "MẬT KHẨU MỚI",
                newPassword,
                "Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu mới để đảm bảo an toàn.");
    }

    @Transactional
    public MemberDTO createMember(CreateMemberRequest request) {
        // Kiểm tra trùng lặp
        if (accountRepository.existsByUsernameIgnoreCase(request.getUsername().trim())) {
            throw new IllegalArgumentException("Tên đăng nhập đã được sử dụng.");
        }
        if (accountRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email đã được sử dụng.");
        }
        if (accountRepository.existsByPhoneNumber(request.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng.");
        }
        if (accountRepository.existsByIdentityCard(request.getIdentityCard().trim())) {
            throw new IllegalArgumentException("CMND/CCCD đã được sử dụng.");
        }

        if (request.getDateOfBirth() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (request.getDateOfBirth().isAfter(today)) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ.");
            }
            int age = java.time.Period.between(request.getDateOfBirth(), today).getYears();
            if (age < 18) {
                throw new IllegalArgumentException("Thành viên đăng ký phải từ 18 tuổi trở lên.");
            }
            if (age > 100) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ. Tuổi tối đa là 100.");
            }
        }

        Role memberRole = roleRepository.findById(2)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quyền Member."));

        // Lấy tài khoản người tạo đang đăng nhập hiện tại
        String creator = "Admin";
        try {
            creator = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
        } catch (Exception e) {
            // Fallback nếu chạy test không có context
        }

        // Tự sinh mật khẩu ngẫu nhiên 8 ký tự
        String rawPassword = generateRandomPassword();

        Account account = Account.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .identityCard(request.getIdentityCard().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender() != null ? request.getGender().trim() : null)
                .image(request.getImage() != null ? request.getImage().trim() : null)
                .status(0) // 0 = Unverified (cần đăng nhập lần đầu và đổi mật khẩu)
                .role(memberRole)
                .createdBy("Admin")
                .build();

        Account savedAccount = accountRepository.save(account);

        Member member = new Member();
        member.setMemberId(java.util.UUID.randomUUID().toString());
        member.setScore(0);
        member.setAccount(savedAccount);
        Member savedMember = memberRepository.save(member);

        // Gửi email thông báo tài khoản và mật khẩu
        accountEmailService.sendNotification(
                request.getEmail().trim(),
                "Thông tin tài khoản thành viên ELITE Cinema",
                "TÀI KHOẢN MỚI",
                "Tài khoản thành viên của bạn đã sẵn sàng",
                request.getFullName().trim(),
                List.of("Tài khoản thành viên của bạn đã được khởi tạo thành công bởi Ban quản trị ELITE Cinema."),
                List.of(new AccountEmailService.FieldRow("TÊN ĐĂNG NHẬP", request.getUsername().trim())),
                "MẬT KHẨU CỦA BẠN",
                rawPassword,
                "Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để sử dụng các dịch vụ của ELITE Cinema.");

        return memberMapper.toDTO(savedMember);
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

    private void validateUniqueFields(String accountId, UpdateMemberRequest request) {
        if (org.springframework.util.StringUtils.hasText(request.getUsername())
                && accountRepository.existsByUsernameIgnoreCaseAndAccountIdNot(request.getUsername().trim(), accountId)) {
            throw new IllegalArgumentException("Tên đăng nhập đã được sử dụng bởi tài khoản khác.");
        }
        if (org.springframework.util.StringUtils.hasText(request.getEmail())
                && accountRepository.existsByEmailIgnoreCaseAndAccountIdNot(request.getEmail().trim(), accountId)) {
            throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác.");
        }
        if (org.springframework.util.StringUtils.hasText(request.getPhoneNumber())
                && accountRepository.existsByPhoneNumberAndAccountIdNot(request.getPhoneNumber().trim(), accountId)) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng bởi tài khoản khác.");
        }
        if (org.springframework.util.StringUtils.hasText(request.getIdentityCard())
                && accountRepository.existsByIdentityCardAndAccountIdNot(request.getIdentityCard().trim(), accountId)) {
            throw new IllegalArgumentException("CMND/CCCD đã được sử dụng bởi tài khoản khác.");
        }
    }
}

