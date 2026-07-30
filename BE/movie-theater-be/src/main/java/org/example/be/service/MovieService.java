package org.example.be.service;

import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.example.be.entity.Schedule;
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

import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MovieService {
    private static final Set<MovieStatus> CUSTOMER_HIDDEN_STATUSES =
            EnumSet.of(MovieStatus.INACTIVE, MovieStatus.DELETED);

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
    private ScheduleService scheduleService;
    @Autowired
    private MovieStatusResolver movieStatusResolver;

    @Transactional(readOnly = true)
    public List<MovieDTO> getMovies(boolean isAdmin) {
        List<Movie> movies = isAdmin
                ? movieRepository.findAll()
                : movieRepository.findByStatusIsNullOrStatusNot(MovieStatus.DELETED);
        return filterForAudience(mapWithStatus(movies), isAdmin);
    }

    @Transactional(readOnly = true)
    public List<MovieDTO> searchMovies(String keyword, boolean isAdmin) {
        List<Movie> base = isAdmin
                ? movieRepository.findAll()
                : movieRepository.findByStatusIsNullOrStatusNot(MovieStatus.DELETED);
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

        if (scheduleRepository.existsByMovieId(id)) {
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

    /** Restores a soft-deleted movie; status được tính lại ngay theo fromDate/toDate và ghi vào DB. */
    @Transactional
    public MovieDTO activateMovie(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));
        if (movie.getStatus() != MovieStatus.DELETED) {
            throw new IllegalStateException("Phim chưa bị xóa.");
        }
        movie.setStatus(null);
        movie.setStatus(movieStatusResolver.resolve(movie));
        return toDtoWithStatus(movieRepository.save(movie));
    }

    @Transactional
    public MovieDTO deleteMovie(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found"));

        if (movie.getStatus() == MovieStatus.DELETED) {
            throw new IllegalStateException("Phim đã được xóa trước đó.");
        }

        List<Schedule> blocking = scheduleRepository.findActiveByMovieId(id).stream()
                .filter(s -> !scheduleService.canCancelOrDelete(s))
                .collect(Collectors.toList());
        if (!blocking.isEmpty()) {
            throw new IllegalStateException(
                    "Không thể xóa phim: còn suất chiếu trong vòng 2 ngày tới chưa thể hủy.");
        }

        movie.setStatus(MovieStatus.DELETED);
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
