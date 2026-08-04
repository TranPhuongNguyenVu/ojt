package org.example.be.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.dto.DrinkDTO;
import org.example.be.dto.DrinkRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Drink;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class DrinkMapperImpl extends DrinkMapper {

    @Override
    public DrinkDTO toDTO(Drink drink) {
        if ( drink == null ) {
            return null;
        }

        DrinkDTO.DrinkDTOBuilder drinkDTO = DrinkDTO.builder();

        drinkDTO.drinkId( drink.getDrinkId() );
        drinkDTO.drinkName( drink.getDrinkName() );
        drinkDTO.description( drink.getDescription() );
        drinkDTO.image( drink.getImage() );
        drinkDTO.prices( concessionPriceListToConcessionPriceDTOList( drink.getPrices() ) );

        drinkDTO.status( drink.getStatus() != null ? drink.getStatus().name() : null );

        return drinkDTO.build();
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
    public Drink toEntity(DrinkRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Drink.DrinkBuilder drink = Drink.builder();

        drink.drinkName( requestDTO.getDrinkName() );
        drink.description( requestDTO.getDescription() );
        drink.image( requestDTO.getImage() );

        return drink.build();
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
}
