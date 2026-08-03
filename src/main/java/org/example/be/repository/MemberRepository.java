package org.example.be.repository;

import org.example.be.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, String> {
    Optional<Member> findByAccountAccountId(String accountId);

    @Query("SELECT m FROM Member m JOIN FETCH m.account a JOIN FETCH a.role WHERE a.identityCard = :identityCard")
    Optional<Member> findByAccountIdentityCard(@Param("identityCard") String identityCard);

    @Query("SELECT m FROM Member m JOIN FETCH m.account a JOIN FETCH a.role WHERE a.phoneNumber = :phoneNumber")
    Optional<Member> findByAccountPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query("SELECT m FROM Member m JOIN FETCH m.account a JOIN FETCH a.role WHERE m.memberId = :memberId")
    Optional<Member> findByIdWithAccount(@Param("memberId") String memberId);
}