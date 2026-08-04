package org.example.be.mapper;

import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.dto.TypeDTO;
import org.example.be.dto.VersionDTO;
import org.example.be.entity.Movie;
import org.example.be.entity.Type;
import org.example.be.entity.Version;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-08-04T07:44:45+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class MovieMapperImpl extends MovieMapper {

    @Override
    public MovieDTO toDTO(Movie movie) {
        if ( movie == null ) {
            return null;
        }

        MovieDTO.MovieDTOBuilder movieDTO = MovieDTO.builder();

        movieDTO.movieId( movie.getMovieId() );
        movieDTO.movieNameEnglish( movie.getMovieNameEnglish() );
        movieDTO.movieNameVn( movie.getMovieNameVn() );
        movieDTO.director( movie.getDirector() );
        movieDTO.actor( movie.getActor() );
        movieDTO.movieProductionCompany( movie.getMovieProductionCompany() );
        movieDTO.duration( movie.getDuration() );
        movieDTO.trailer( movie.getTrailer() );
        movieDTO.fromDate( movie.getFromDate() );
        movieDTO.toDate( movie.getToDate() );
        movieDTO.content( movie.getContent() );
        movieDTO.largeImage( movie.getLargeImage() );
        movieDTO.smallImage( movie.getSmallImage() );
        movieDTO.types( typeSetToTypeDTOSet( movie.getTypes() ) );
        movieDTO.versions( versionSetToVersionDTOSet( movie.getVersions() ) );

        movieDTO.status( statusResolver.resolve(movie).name() );

        return movieDTO.build();
    }

    @Override
    public TypeDTO toDTO(Type type) {
        if ( type == null ) {
            return null;
        }

        TypeDTO.TypeDTOBuilder typeDTO = TypeDTO.builder();

        typeDTO.typeId( type.getTypeId() );
        typeDTO.typeName( type.getTypeName() );

        return typeDTO.build();
    }

    @Override
    public VersionDTO toDTO(Version version) {
        if ( version == null ) {
            return null;
        }

        VersionDTO.VersionDTOBuilder versionDTO = VersionDTO.builder();

        versionDTO.versionId( version.getVersionId() );
        versionDTO.versionName( version.getVersionName() );
        versionDTO.basePrice( version.getBasePrice() );
        versionDTO.vipPrice( version.getVipPrice() );
        versionDTO.couplePrice( version.getCouplePrice() );

        return versionDTO.build();
    }

    @Override
    public Movie toEntity(MovieRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Movie.MovieBuilder movie = Movie.builder();

        movie.movieNameEnglish( requestDTO.getMovieNameEnglish() );
        movie.movieNameVn( requestDTO.getMovieNameVn() );
        movie.director( requestDTO.getDirector() );
        movie.actor( requestDTO.getActor() );
        movie.movieProductionCompany( requestDTO.getMovieProductionCompany() );
        movie.duration( requestDTO.getDuration() );
        movie.trailer( requestDTO.getTrailer() );
        movie.fromDate( requestDTO.getFromDate() );
        movie.toDate( requestDTO.getToDate() );
        movie.content( requestDTO.getContent() );
        movie.largeImage( requestDTO.getLargeImage() );
        movie.smallImage( requestDTO.getSmallImage() );

        return movie.build();
    }

    protected Set<TypeDTO> typeSetToTypeDTOSet(Set<Type> set) {
        if ( set == null ) {
            return null;
        }

        Set<TypeDTO> set1 = new LinkedHashSet<TypeDTO>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Type type : set ) {
            set1.add( toDTO( type ) );
        }

        return set1;
    }

    protected Set<VersionDTO> versionSetToVersionDTOSet(Set<Version> set) {
        if ( set == null ) {
            return null;
        }

        Set<VersionDTO> set1 = new LinkedHashSet<VersionDTO>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Version version : set ) {
            set1.add( toDTO( version ) );
        }

        return set1;
    }
}
