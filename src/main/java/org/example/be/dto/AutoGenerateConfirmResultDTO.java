package org.example.be.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoGenerateConfirmResultDTO {
    private List<ScheduleResponseDTO> saved;
    private List<ScheduleCandidateDTO> failed;
}
