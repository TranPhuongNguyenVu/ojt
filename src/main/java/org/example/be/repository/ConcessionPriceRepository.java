package org.example.be.repository;

import org.example.be.entity.ConcessionPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConcessionPriceRepository extends JpaRepository<ConcessionPrice, Integer> {
    void deleteByFood_FoodId(Integer foodId);

    void deleteByDrink_DrinkId(Integer drinkId);

    void deleteByCombo_ComboId(Integer comboId);
}
