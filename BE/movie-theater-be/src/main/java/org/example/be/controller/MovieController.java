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
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin"));
        return ApiResponse.success("List of movies", movieService.getMovies(isAdmin));
    }

    @GetMapping("/search")
    public ApiResponse<List<MovieDTO>> searchMovies(@RequestParam String keyword, Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin"));
        return ApiResponse.success("Search results", movieService.searchMovies(keyword, isAdmin));
    }

    @GetMapping("/{id}")
    public ApiResponse<MovieDTO> getMovieById(@PathVariable String id) {
        return ApiResponse.success("Movie details", movieService.getMovieById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<MovieDTO> addMovie(@Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie added", movieService.addMovie(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<MovieDTO> updateMovie(@PathVariable String id, @Valid @RequestBody MovieRequestDTO requestDTO) {
        return ApiResponse.success("Movie updated", movieService.updateMovie(id, requestDTO));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<MovieDTO> activateMovie(@PathVariable String id) {
        return ApiResponse.success("Movie restored", movieService.activateMovie(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<MovieDTO> deleteMovie(@PathVariable String id) {
        return ApiResponse.success("Movie deleted", movieService.deleteMovie(id));
    }
}
