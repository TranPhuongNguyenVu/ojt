package org.example.be.repository;

import org.example.be.entity.GoldenHourConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldenHourConfigRepository extends JpaRepository<GoldenHourConfig, Integer> {
    List<GoldenHourConfig> findByActiveTrue();
}
