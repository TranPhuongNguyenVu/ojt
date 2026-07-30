package org.example.be.mapper;

import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.entity.Combo;
import org.example.be.entity.ConcessionPrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class ComboMapper {

    @Mapping(target = "status", expression = "java(combo.getStatus() != null ? combo.getStatus().name() : null)")
    public abstract ComboDTO toDTO(Combo combo);

    @Mapping(target = "size", expression = "java(price.getSize() != null ? price.getSize().name() : null)")
    public abstract ConcessionPriceDTO toDTO(ConcessionPrice price);

    @Mapping(target = "comboId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "prices", ignore = true)
    public abstract Combo toEntity(ComboRequestDTO requestDTO);
}
