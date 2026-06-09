package com.airline.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.airline.dto.FlightDTO;
import com.airline.model.Flight;
import com.airline.model.FlightStatus;
import com.airline.repository.FlightRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ExtendWith(MockitoExtension.class)
class FlightServiceTest {

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private MetricsService metricsService;

    @InjectMocks
    private FlightService flightService;

    @Test
    void searchFlights_ShouldReturnAvailableFlights() {
        // Given
        LocalDate date = LocalDate.of(2026, 12, 25);
        List<Flight> mockFlights = new ArrayList<>();
        mockFlights.add(Flight.builder()
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
                .availableEconomySeats(100)
                .availableBusinessSeats(20)
                .status(FlightStatus.SCHEDULED)
                .build());

        when(flightRepository.findByOriginAndDestinationAndDepartureTimeBetween(
                anyString(), anyString(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(mockFlights);

        // When
        List<FlightDTO> result = flightService.searchFlights("New York", "London", date, "ECONOMY");

        // Then
        assertThat(result).isNotEmpty();
        assertThat(result.get(0).getAvailableEconomySeats()).isGreaterThan(0);
        verify(flightRepository, times(1)).findByOriginAndDestinationAndDepartureTimeBetween(
                anyString(), anyString(), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
