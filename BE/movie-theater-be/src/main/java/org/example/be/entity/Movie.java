package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.MovieStatus;
import java.time.LocalDate;

@Entity
@Table(name = "MOVIE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {
    @Id
    @Column(name = "MOVIE_ID", length = 36)
    private String movieId;

    @Column(name = "MOVIE_NAME_ENGLISH", length = 255)
    private String movieNameEnglish;

    @Column(name = "MOVIE_NAME_VN", length = 255)
    private String movieNameVn;

    @Column(name = "DIRECTOR", length = 255)
    private String director;

    @Column(name = "ACTOR", length = 500)
    private String actor;

    @Column(name = "MOVIE_PRODUCTION_COMPANY", length = 255)
    private String movieProductionCompany;

    @Column(name = "DURATION")
    private Integer duration;

    @Column(name = "TRAILER", length = 500)
    private String trailer;

    @Column(name = "FROM_DATE")
    private LocalDate fromDate;

    @ManyToMany
    @JoinTable(
            name = "MOVIE_TYPE",
            joinColumns = @JoinColumn(name = "MOVIE_ID"),
            inverseJoinColumns = @JoinColumn(name = "TYPE_ID")
    )
    private java.util.Set<Type> types;

    @ManyToMany
    @JoinTable(
            name = "MOVIE_VERSION",
            joinColumns = @JoinColumn(name = "MOVIE_ID"),
            inverseJoinColumns = @JoinColumn(name = "VERSION_ID")
    )
    private java.util.Set<Version> versions;

    @Column(name = "TO_DATE")
    private LocalDate toDate;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "LARGE_IMAGE", length = 500)
    private String largeImage;

    @Column(name = "SMALL_IMAGE", length = 500)
    private String smallImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20)
    private MovieStatus status;
}
