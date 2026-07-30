package org.example.be.mapper;

import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.dto.TypeDTO;
import org.example.be.dto.VersionDTO;
import org.example.be.entity.Movie;
import org.example.be.entity.Type;
import org.example.be.entity.Version;
import org.example.be.service.MovieStatusResolver;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class MovieMapper {

    @Autowired
    protected MovieStatusResolver statusResolver;

    @Mapping(target = "status", expression = "java(statusResolver.resolve(movie).name())")
    public abstract MovieDTO toDTO(Movie movie);

    public abstract TypeDTO toDTO(Type type);

    public abstract VersionDTO toDTO(Version version);

    @Mapping(target = "movieId", ignore = true)
    @Mapping(target = "types", ignore = true)
    @Mapping(target = "versions", ignore = true)
    @Mapping(target = "status", ignore = true)
    public abstract Movie toEntity(MovieRequestDTO requestDTO);
}
