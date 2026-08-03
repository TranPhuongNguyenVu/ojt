package org.example.be.config;

import lombok.RequiredArgsConstructor;
import org.example.be.entity.Account;
import org.example.be.entity.Role;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SystemAdminAccountSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role sysAdminRole = roleRepository.findByRoleName("SystemAdmin")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("SystemAdmin").build()));

        if (accountRepository.findByUsername("sysadmin").isEmpty()) {
            Account sysAdmin = Account.builder()
                    .username("sysadmin")
                    .password(passwordEncoder.encode("123456"))
                    .fullName("Quản trị hệ thống")
                    .email("sysadmin@mtms.vn")
                    .identityCard("000000000")
                    .phoneNumber("0900000000")
                    .status(1)
                    .role(sysAdminRole)
                    .build();
            accountRepository.save(sysAdmin);
        }
    }
}
