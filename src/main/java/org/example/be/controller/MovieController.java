package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.MovieDTO;
import org.example.be.dto.MovieRequestDTO;
import org.example.be.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    @Autowired
    private MovieService movieService;

    @GetMapping
    public ApiResponse<List<MovieDTO>> getAllMovies(Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_SystemAdmin"));
        return ApiResponse.success("List of movies", movieService.getMovies(isAdmin));
    }

    @GetMapping("/schedulable")
    public ApiResponse<List<MovieDTO>> getSchedulableMovies() {
        return ApiResponse.success("Schedulable movies", movieService.getSchedulableMovies());
    }

    @GetMapping("/search")
    public ApiResponse<List<MovieDTO>> searchMovies(@RequestParam String keyword, Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_SystemAdmin"));
        return ApiResponse.success("Search results", movieService.searchMovies(keyword, isAdmin));
    }

    @GetMapping("/{id}")
    public ApiResponse<MovieDTO> getMovieById(@PathVariable String id) {
        return ApiResponse.success("Movie details", movieService.getMovieById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> addMovie(@Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie added", movieService.addMovie(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> updateMovie(@PathVariable String id, @Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie updated", movieService.updateMovie(id, requestDTO));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> activateMovie(@PathVariable String id) {
        return ApiResponse.success("Movie restored", movieService.activateMovie(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<MovieDTO> deleteMovie(@PathVariable String id) {
        return ApiResponse.success("Movie deleted", movieService.deleteMovie(id));
    }
}
