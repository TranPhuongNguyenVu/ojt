package org.example.be.repository;

import org.example.be.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    @Query("""
            SELECT e FROM Employee e
            JOIN FETCH e.account a
            WHERE a.status = 1 AND (
                LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(a.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(a.identityCard) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(a.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(a.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            ORDER BY a.fullName ASC
            """)
    List<Employee> searchEmployees(@Param("keyword") String keyword);

    @Query("""
            SELECT e FROM Employee e
            JOIN FETCH e.account a
            WHERE a.status = 1
            ORDER BY a.fullName ASC
            """)
    List<Employee> findAllWithAccount();

    @Query("SELECT e FROM Employee e JOIN FETCH e.account a JOIN FETCH a.role WHERE e.employeeId = :employeeId")
    Optional<Employee> findByIdWithAccount(@Param("employeeId") String employeeId);

    boolean existsByAccount_AccountId(String accountId);
}
