package org.example.be.repository;

import org.example.be.entity.ScoreTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreTransactionRepository extends JpaRepository<ScoreTransaction, Integer> {
    List<ScoreTransaction> findByMemberIdOrderByTxnIdDesc(String memberId);
}
