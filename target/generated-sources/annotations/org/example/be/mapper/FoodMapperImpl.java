package org.example.be.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.example.be.dto.ConcessionPriceDTO;
import org.example.be.dto.FoodDTO;
import org.example.be.dto.FoodRequestDTO;
import org.example.be.entity.ConcessionPrice;
import org.example.be.entity.Food;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class FoodMapperImpl extends FoodMapper {

    @Override
    public FoodDTO toDTO(Food food) {
        if ( food == null ) {
            return null;
        }

        FoodDTO.FoodDTOBuilder foodDTO = FoodDTO.builder();

        foodDTO.foodId( food.getFoodId() );
        foodDTO.foodName( food.getFoodName() );
        foodDTO.description( food.getDescription() );
        foodDTO.image( food.getImage() );
        foodDTO.prices( concessionPriceListToConcessionPriceDTOList( food.getPrices() ) );

        foodDTO.status( food.getStatus() != null ? food.getStatus().name() : null );

        return foodDTO.build();
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
    public Food toEntity(FoodRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Food.FoodBuilder food = Food.builder();

        food.foodName( requestDTO.getFoodName() );
        food.description( requestDTO.getDescription() );
        food.image( requestDTO.getImage() );

        return food.build();
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
