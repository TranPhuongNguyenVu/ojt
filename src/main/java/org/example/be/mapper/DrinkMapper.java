package org.example.be.mapper;

import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.dto.DrinkDTO;
import org.example.be.dto.DrinkRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Drink;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class DrinkMapper {

    @Mapping(target = "status", expression = "java(drink.getStatus() != null ? drink.getStatus().name() : null)")
    public abstract DrinkDTO toDTO(Drink drink);

    @Mapping(target = "size", expression = "java(price.getSize() != null ? price.getSize().name() : null)")
    public abstract ConcessionPriceDTO toDTO(ConcessionPrice price);

    @Mapping(target = "drinkId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "prices", ignore = true)
    public abstract Drink toEntity(DrinkRequestDTO requestDTO);
}
