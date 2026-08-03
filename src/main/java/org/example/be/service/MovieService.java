package org.example.be.service;

import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.example.be.mapper.MovieMapper;
import org.example.be.repository.MovieRepository;
import jakarta.persistence.EntityNotFoundException;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.TypeRepository;
import org.example.be.repository.VersionRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MovieService {
    private static final Set<MovieStatus> CUSTOMER_HIDDEN_STATUSES =
            EnumSet.of(MovieStatus.UNSCHEDULED, MovieStatus.INACTIVE);

    @Autowired
    private MovieRepository movieRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private TypeRepository typeRepository;
    @Autowired
    private VersionRepository versionRepository;
    @Autowired
    private MovieMapper movieMapper;
    @Autowired
    private MovieStatusResolver movieStatusResolver;

    @Transactional(readOnly = true)
    public List<MovieDTO> getMovies(boolean isAdmin) {
        List<Movie> movies = isAdmin
                ? movieRepository.findAll()
                : movieRepository.findByStatusIsNullOrStatusNot(MovieStatus.INACTIVE);
        return filterForAudience(mapWithStatus(movies), isAdmin);
    }

    /** Movies eligible to be picked when creating a showtime — excludes UNSCHEDULED/INACTIVE regardless of caller role. */
    @Transactional(readOnly = true)
    public List<MovieDTO> getSchedulableMovies() {
        return mapWithStatus(movieRepository.findAll()).stream()
                .filter(dto -> !CUSTOMER_HIDDEN_STATUSES.contains(MovieStatus.valueOf(dto.getStatus())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovieDTO> searchMovies(String keyword, boolean isAdmin) {
        List<Movie> base = isAdmin
                ? movieRepository.findAll()
                : movieRepository.findByStatusIsNullOrStatusNot(MovieStatus.INACTIVE);
        String needle = TextNormalizeUtil.stripDiacritics(keyword).toLowerCase();
        List<Movie> matched = base.stream()
                .filter(m -> TextNormalizeUtil.stripDiacritics(m.getMovieNameVn()).toLowerCase().contains(needle)
                        || TextNormalizeUtil.stripDiacritics(m.getMovieNameEnglish()).toLowerCase().contains(needle))
                .collect(Collectors.toList());
        return filterForAudience(mapWithStatus(matched), isAdmin);
    }

    @Transactional
    public MovieDTO addMovie(MovieRequestDTO requestDTO) {
        Movie movie = movieMapper.toEntity(requestDTO);
        movie.setMovieId(UUID.randomUUID().toString());

        movie.setTypes(new HashSet<>(typeRepository.findAllById(requestDTO.getTypeIds())));
        movie.setVersions(new HashSet<>(versionRepository.findAllById(requestDTO.getVersionIds())));
        movie.setStatus(movieStatusResolver.resolve(movie));
        return toDtoWithStatus(movieRepository.save(movie));
    }

    @Transactional
    public MovieDTO updateMovie(String id, MovieRequestDTO requestDTO) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));

        if (scheduleRepository.existsUpcomingByMovieId(id, LocalDateTime.now())) {
            throw new IllegalStateException("Không thể cập nhật phim đang có lịch chiếu.");
        }

        movie.setMovieNameEnglish(requestDTO.getMovieNameEnglish());
        movie.setMovieNameVn(requestDTO.getMovieNameVn());
        movie.setDirector(requestDTO.getDirector());
        movie.setActor(requestDTO.getActor());
        movie.setMovieProductionCompany(requestDTO.getMovieProductionCompany());
        movie.setDuration(requestDTO.getDuration());
        movie.setTrailer(requestDTO.getTrailer());
        movie.setFromDate(requestDTO.getFromDate());
        movie.setToDate(requestDTO.getToDate());
        movie.setContent(requestDTO.getContent());
        movie.setLargeImage(requestDTO.getLargeImage());
        movie.setSmallImage(requestDTO.getSmallImage());
        movie.setTypes(new HashSet<>(typeRepository.findAllById(requestDTO.getTypeIds())));
        movie.setVersions(new HashSet<>(versionRepository.findAllById(requestDTO.getVersionIds())));
        movie.setStatus(movieStatusResolver.resolve(movie));

        return toDtoWithStatus(movieRepository.save(movie));
    }

    /** Restores a deactivated movie; status được tính lại ngay theo fromDate/toDate và ghi vào DB. */
    @Transactional
    public MovieDTO activateMovie(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));
        if (movie.getStatus() != MovieStatus.INACTIVE) {
            throw new IllegalStateException("Phim chưa bị ngừng hoạt động.");
        }
        movie.setStatus(null);
        movie.setStatus(movieStatusResolver.resolve(movie));
        return toDtoWithStatus(movieRepository.save(movie));
    }

    /**
     * Deactivating a movie is only allowed if it has NEVER had a schedule created for it (any
     * status, including past/ended/cancelled ones) — once a movie has been scheduled, its
     * history must be preserved, so it can only be turned UNSCHEDULED (via {@link #updateMovie}),
     * never INACTIVE.
     */
    @Transactional
    public MovieDTO deleteMovie(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));

        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new IllegalStateException("Phim đã ngừng hoạt động trước đó.");
        }

        if (scheduleRepository.existsAnyByMovieId(id)) {
            throw new IllegalStateException(
                    "Không thể ngừng hoạt động phim đã từng có xuất chiếu. Vui lòng cập nhật phim để gỡ lịch chiếu (chuyển sang chưa có lịch chiếu) thay vì thao tác này.");
        }

        movie.setStatus(MovieStatus.INACTIVE);
        return toDtoWithStatus(movieRepository.save(movie));
    }

    @Transactional(readOnly = true)
    public MovieDTO getMovieById(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));
        return toDtoWithStatus(movie);
    }

    private List<MovieDTO> filterForAudience(List<MovieDTO> movies, boolean isAdmin) {
        if (isAdmin) {
            return movies;
        }
        return movies.stream()
                .filter(dto -> !CUSTOMER_HIDDEN_STATUSES.contains(MovieStatus.valueOf(dto.getStatus())))
                .collect(Collectors.toList());
    }

    private List<MovieDTO> mapWithStatus(List<Movie> movies) {
        return movies.stream()
                .map(movieMapper::toDTO)
                .collect(Collectors.toList());
    }

    private MovieDTO toDtoWithStatus(Movie movie) {
        return movieMapper.toDTO(movie);
    }
}
