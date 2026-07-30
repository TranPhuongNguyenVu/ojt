package org.example.be.repository;

import org.example.be.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    // Spring Boot sẽ tự hiểu hàm này tương đương câu SQL: SELECT * FROM ROLES WHERE ROLE_NAME = ?
    Optional<Role> findByRoleName(String roleName);
}