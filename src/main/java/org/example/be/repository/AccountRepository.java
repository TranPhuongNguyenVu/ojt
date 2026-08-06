package org.example.be.repository;

import org.example.be.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {
    // Các hàm tự động hỗ trợ cho việc đăng nhập/đăng ký
    Optional<Account> findByUsername(String username);
    Optional<Account> findByUsernameIgnoreCase(String username);
    Optional<Account> findByEmail(String email);


    // Kiểm tra trùng lặp khi đăng ký
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByIdentityCard(String identityCard);

    boolean existsByEmailAndAccountIdNot(String email, String accountId);
    boolean existsByUsernameIgnoreCaseAndAccountIdNot(String username, String accountId);
    boolean existsByEmailIgnoreCaseAndAccountIdNot(String email, String accountId);
    boolean existsByPhoneNumberAndAccountIdNot(String phoneNumber, String accountId);
    boolean existsByIdentityCardAndAccountIdNot(String identityCard, String accountId);

    List<Account> findByRole_RoleName(String roleName);

}