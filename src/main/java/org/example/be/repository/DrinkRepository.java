package org.example.be.repository;

import org.example.be.entity.Drink;
import org.example.be.enums.ConcessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DrinkRepository extends JpaRepository<Drink, Integer> {
    List<Drink> findByStatusNot(ConcessionStatus status);
}
