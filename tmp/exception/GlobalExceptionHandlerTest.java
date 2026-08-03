package org.example.be.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @RestController
    static class ThrowingController {

        @GetMapping("/throws-not-found")
        String notFound() {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cinema room not found.");
        }

        @GetMapping("/throws-conflict")
        String conflict() {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên phòng chiếu đã tồn tại trong hệ thống.");
        }

        @GetMapping("/throws-without-reason")
        String withoutReason() {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        @GetMapping("/throws-runtime")
        String runtime() {
            throw new RuntimeException("boom");
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void responseStatusExceptionKeepsItsStatusInsteadOfBecomingServerError() throws Exception {
        mockMvc.perform(get("/throws-not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Cinema room not found."));
    }

    @Test
    void responseStatusExceptionKeepsConflictStatus() throws Exception {
        mockMvc.perform(get("/throws-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Tên phòng chiếu đã tồn tại trong hệ thống."));
    }

    @Test
    void responseStatusExceptionWithoutReasonFallsBackToStatusDetail() throws Exception {
        mockMvc.perform(get("/throws-without-reason"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void unexpectedExceptionStillFallsThroughToServerError() throws Exception {
        mockMvc.perform(get("/throws-runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500));
    }
}
