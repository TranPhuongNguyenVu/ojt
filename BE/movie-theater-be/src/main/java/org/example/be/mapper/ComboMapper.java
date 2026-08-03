package org.example.be.mapper;

import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboItemDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.entity.Combo;
import org.example.be.entity.ComboItem;
import org.example.be.entity.ConcessionPrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class ComboMapper {

    @Mapping(target = "status", expression = "java(combo.getStatus() != null ? combo.getStatus().name() : null)")
    public abstract ComboDTO toDTO(Combo combo);

    @Mapping(target = "size", expression = "java(price.getSize() != null ? price.getSize().name() : null)")
    public abstract ConcessionPriceDTO toDTO(ConcessionPrice price);

    @Mapping(target = "foodId", expression = "java(item.getFood() != null ? item.getFood().getFoodId() : null)")
    @Mapping(target = "foodName", expression = "java(item.getFood() != null ? item.getFood().getFoodName() : null)")
    @Mapping(target = "drinkId", expression = "java(item.getDrink() != null ? item.getDrink().getDrinkId() : null)")
    @Mapping(target = "drinkName", expression = "java(item.getDrink() != null ? item.getDrink().getDrinkName() : null)")
    @Mapping(target = "size", expression = "java(item.getSize() != null ? item.getSize().name() : null)")
    @Mapping(target = "price", expression = "java(resolveItemPrice(item))")
    public abstract ComboItemDTO toDTO(ComboItem item);

    protected BigDecimal resolveItemPrice(ComboItem item) {
        List<ConcessionPrice> prices = item.getFood() != null
                ? item.getFood().getPrices()
                : (item.getDrink() != null ? item.getDrink().getPrices() : null);
        if (prices == null || item.getSize() == null) {
            return null;
        }
        return prices.stream()
                .filter(p -> p.getSize() == item.getSize())
                .map(ConcessionPrice::getPrice)
                .findFirst()
                .orElse(null);
    }

    @Mapping(target = "comboId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "prices", ignore = true)
    @Mapping(target = "items", ignore = true)
    public abstract Combo toEntity(ComboRequestDTO requestDTO);
}
