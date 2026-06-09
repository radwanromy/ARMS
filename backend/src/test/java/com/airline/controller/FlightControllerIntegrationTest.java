package com.airline.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.airline.config.JwtTokenProvider;
import com.airline.dto.FlightDTO;
import com.airline.model.FlightStatus;
import com.airline.service.FlightService;
import com.airline.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@WebMvcTest(FlightController.class)
@AutoConfigureMockMvc(addFilters = false)
class FlightControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FlightService flightService;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void searchFlights_ShouldReturnOk() throws Exception {
        List<FlightDTO> mockDTOs = new ArrayList<>();
        mockDTOs.add(FlightDTO.builder()
                .id(1L)
                .flightNumber("AA123")
                .airline("American Airlines")
                .origin("New York")
                .destination("London")
                .departureTime(LocalDateTime.of(2026, 12, 25, 10, 0))
                .arrivalTime(LocalDateTime.of(2026, 12, 25, 22, 0))
                .economyPrice(BigDecimal.valueOf(500))
                .businessPrice(BigDecimal.valueOf(1200))
                .totalEconomySeats(150)
                .totalBusinessSeats(30)
                .availableEconomySeats(150)
                .availableBusinessSeats(30)
                .status(FlightStatus.SCHEDULED)
                .build());

        when(flightService.searchFlights(anyString(), anyString(), any(LocalDate.class), any())).thenReturn(mockDTOs);

        mockMvc.perform(get("/api/flights/search")
                .param("origin", "New York")
                .param("destination", "London")
                .param("date", "2026-12-25")
                .param("seatClass", "ECONOMY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].flightNumber").value("AA123"));
    }
}
