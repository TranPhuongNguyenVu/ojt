package org.example.be.mapper;

import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.dto.FoodDTO;
import org.example.be.dto.FoodRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Food;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class FoodMapper {

    @Mapping(target = "status", expression = "java(food.getStatus() != null ? food.getStatus().name() : null)")
    public abstract FoodDTO toDTO(Food food);

    @Mapping(target = "size", expression = "java(price.getSize() != null ? price.getSize().name() : null)")
    public abstract ConcessionPriceDTO toDTO(ConcessionPrice price);

    @Mapping(target = "foodId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "prices", ignore = true)
    public abstract Food toEntity(FoodRequestDTO requestDTO);
}
