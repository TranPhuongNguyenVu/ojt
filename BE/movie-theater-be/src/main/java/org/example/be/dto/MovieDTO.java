package org.example.be.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDTO {
    private String movieId;
    private String movieNameEnglish;
    private String movieNameVn;
    private String director;
    private String actor;
    private String movieProductionCompany;
    private Integer duration;
    private String trailer;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String content;
    private String largeImage;
    private String smallImage;
    private String status;
    private Set<TypeDTO> types;
    private Set<VersionDTO> versions;
}
