package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoGenerateConfirmRequestDTO {
    private List<ScheduleCandidateDTO> candidates;
}
