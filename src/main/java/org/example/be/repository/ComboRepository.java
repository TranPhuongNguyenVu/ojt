package org.example.be.repository;

import org.example.be.entity.Combo;
import org.example.be.enums.ConcessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComboRepository extends JpaRepository<Combo, Integer> {
    List<Combo> findByStatusNot(ConcessionStatus status);
}
