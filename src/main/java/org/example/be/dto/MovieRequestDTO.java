package org.example.be.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import org.example.be.validation.ValidMovieDateRange;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ValidMovieDateRange
public class MovieRequestDTO {
    @NotBlank(message = "English name is required")
    private String movieNameEnglish;
    @NotBlank(message = "Vietnamese name is required")
    private String movieNameVn;
    private String director;
    private String actor;
    private String movieProductionCompany;
    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer duration;
    @NotBlank(message = "Trailer is required")
    private String trailer;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String content;
    @NotBlank(message = "Large image is required")
    private String largeImage;
    @NotBlank(message = "Small image is required")
    private String smallImage;
    @NotEmpty(message = "At least one type is required")
    private List<Integer> typeIds;
    @NotEmpty(message = "At least one version is required")
    private List<Integer> versionIds;
}
