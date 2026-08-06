package org.example.be.repository;

import org.example.be.entity.ComboItem;
import org.example.be.enums.ConcessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComboItemRepository extends JpaRepository<ComboItem, Integer> {
    void deleteByCombo_ComboId(Integer comboId);

    /** True if the food is still referenced by a combo that hasn't been deleted — blocks deleting the food out from under a live combo. */
    boolean existsByFood_FoodIdAndCombo_StatusNot(Integer foodId, ConcessionStatus status);

    /** True if the drink is still referenced by a combo that hasn't been deleted — blocks deleting the drink out from under a live combo. */
    boolean existsByDrink_DrinkIdAndCombo_StatusNot(Integer drinkId, ConcessionStatus status);
}
