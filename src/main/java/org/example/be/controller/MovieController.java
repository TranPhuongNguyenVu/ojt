package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
public class MovieController {
    @Autowired
    private MovieService movieService;

    @GetMapping("/api/movies")
    public ApiResponse<List<MovieDTO>> getAllMovies() {
        return ApiResponse.success("List of movies", movieService.getMovies(false));
    }

    @GetMapping("/api/movies/schedulable")
    public ApiResponse<List<MovieDTO>> getSchedulableMovies() {
        return ApiResponse.success("Schedulable movies", movieService.getSchedulableMovies());
    }

    @GetMapping("/api/movies/with-showtimes")
    public ApiResponse<List<MovieDTO>> getMoviesWithShowtimes() {
        return ApiResponse.success("Movies with showtimes", movieService.getMoviesWithShowtimes());
    }

    @GetMapping("/api/movies/search")
    public ApiResponse<List<MovieDTO>> searchMovies(@RequestParam String keyword) {
        return ApiResponse.success("Search results", movieService.searchMovies(keyword, false));
    }

    @GetMapping("/api/movies/{id}")
    public ApiResponse<MovieDTO> getMovieById(@PathVariable String id) {
        return ApiResponse.success("Movie details", movieService.getPublicMovieById(id));
    }

    @PostMapping("/api/movies")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> addMovie(@Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie added", movieService.addMovie(requestDTO));
    }

    @PutMapping("/api/movies/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> updateMovie(@PathVariable String id, @Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie updated", movieService.updateMovie(id, requestDTO));
    }

    @PatchMapping("/api/movies/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> activateMovie(@PathVariable String id) {
        return ApiResponse.success("Movie restored", movieService.activateMovie(id));
    }

    @DeleteMapping("/api/movies/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> deleteMovie(@PathVariable String id) {
        return ApiResponse.success("Movie deleted", movieService.deleteMovie(id));
    }

    @GetMapping("/api/admin/movies")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<MovieDTO>> getAllMoviesAdmin() {
        return ApiResponse.success("List of movies", movieService.getMovies(true));
    }

    @GetMapping("/api/admin/movies/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<MovieDTO>> searchMoviesAdmin(@RequestParam String keyword) {
        return ApiResponse.success("Search results", movieService.searchMovies(keyword, true));
    }

    @GetMapping("/api/admin/movies/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> getMovieByIdAdmin(@PathVariable String id) {
        return ApiResponse.success("Movie details", movieService.getMovieById(id));
    }
}
