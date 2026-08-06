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
    /** Room IDs allowed to receive new schedules even on days they already have existing schedules. */
    private List<Integer> allowInsertIntoBusyDayRoomIds;
}
