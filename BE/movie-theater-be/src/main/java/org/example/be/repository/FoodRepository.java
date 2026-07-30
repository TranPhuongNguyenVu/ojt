package org.example.be.repository;

import org.example.be.entity.Food;
import org.example.be.enums.ConcessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {
    List<Food> findByStatusNot(ConcessionStatus status);
}
