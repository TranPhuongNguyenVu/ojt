package org.example.be.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboItemDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.entity.Combo;
import org.example.be.entity.ComboItem;
import org.example.be.entity.ConcessionPrice;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class ComboMapperImpl extends ComboMapper {

    @Override
    public ComboDTO toDTO(Combo combo) {
        if ( combo == null ) {
            return null;
        }

        ComboDTO.ComboDTOBuilder comboDTO = ComboDTO.builder();

        comboDTO.comboId( combo.getComboId() );
        comboDTO.comboName( combo.getComboName() );
        comboDTO.description( combo.getDescription() );
        comboDTO.image( combo.getImage() );
        comboDTO.prices( concessionPriceListToConcessionPriceDTOList( combo.getPrices() ) );
        comboDTO.items( comboItemListToComboItemDTOList( combo.getItems() ) );

        comboDTO.status( combo.getStatus() != null ? combo.getStatus().name() : null );

        return comboDTO.build();
    }

    @Override
    public ConcessionPriceDTO toDTO(ConcessionPrice price) {
        if ( price == null ) {
            return null;
        }

        ConcessionPriceDTO.ConcessionPriceDTOBuilder concessionPriceDTO = ConcessionPriceDTO.builder();

        concessionPriceDTO.price( price.getPrice() );

        concessionPriceDTO.size( price.getSize() != null ? price.getSize().name() : null );

        return concessionPriceDTO.build();
    }

    @Override
    public ComboItemDTO toDTO(ComboItem item) {
        if ( item == null ) {
            return null;
        }

        ComboItemDTO.ComboItemDTOBuilder comboItemDTO = ComboItemDTO.builder();

        comboItemDTO.comboItemId( item.getComboItemId() );
        comboItemDTO.quantity( item.getQuantity() );

        comboItemDTO.foodId( item.getFood() != null ? item.getFood().getFoodId() : null );
        comboItemDTO.foodName( item.getFood() != null ? item.getFood().getFoodName() : null );
        comboItemDTO.drinkId( item.getDrink() != null ? item.getDrink().getDrinkId() : null );
        comboItemDTO.drinkName( item.getDrink() != null ? item.getDrink().getDrinkName() : null );
        comboItemDTO.size( item.getSize() != null ? item.getSize().name() : null );
        comboItemDTO.price( resolveItemPrice(item) );

        return comboItemDTO.build();
    }

    @Override
    public Combo toEntity(ComboRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Combo.ComboBuilder combo = Combo.builder();

        combo.comboName( requestDTO.getComboName() );
        combo.description( requestDTO.getDescription() );
        combo.image( requestDTO.getImage() );

        return combo.build();
    }

    protected List<ConcessionPriceDTO> concessionPriceListToConcessionPriceDTOList(List<ConcessionPrice> list) {
        if ( list == null ) {
            return null;
        }

        List<ConcessionPriceDTO> list1 = new ArrayList<ConcessionPriceDTO>( list.size() );
        for ( ConcessionPrice concessionPrice : list ) {
            list1.add( toDTO( concessionPrice ) );
        }

        return list1;
    }

    protected List<ComboItemDTO> comboItemListToComboItemDTOList(List<ComboItem> list) {
        if ( list == null ) {
            return null;
        }

        List<ComboItemDTO> list1 = new ArrayList<ComboItemDTO>( list.size() );
        for ( ComboItem comboItem : list ) {
            list1.add( toDTO( comboItem ) );
        }

        return list1;
    }
}
