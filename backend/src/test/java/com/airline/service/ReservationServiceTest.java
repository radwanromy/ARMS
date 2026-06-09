package com.airline.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.airline.dto.PassengerDTO;
import com.airline.dto.ReservationDTO;
import com.airline.dto.ReservationRequest;
import com.airline.model.*;
import com.airline.repository.FlightRepository;
import com.airline.repository.PassengerRepository;
import com.airline.repository.ReservationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private PassengerRepository passengerRepository;

    @Mock
    private UserService userService;

    @Mock
    private FlightService flightService;

    @Mock
    private MetricsService metricsService;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void makeReservation_WhenSeatsAvailable_ShouldSucceed() {
        // Given
        Flight flight = Flight.builder()
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
                .build();

        User user = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .role(Role.USER)
                .build();

        List<PassengerDTO> passengers = new ArrayList<>();
        passengers.add(PassengerDTO.builder()
                .fullName("John Doe")
                .build());

        ReservationRequest request = ReservationRequest.builder()
                .flightId(1L)
                .seatNumber("12A")
                .seatClass("ECONOMY")
                .passengers(passengers)
                .build();

        when(flightRepository.findById(1L)).thenReturn(Optional.of(flight));
        when(userService.getCurrentUser()).thenReturn(user);

        Reservation savedReservation = Reservation.builder()
                .id(1L)
                .bookingReference("AIR12345678")
                .user(user)
                .flight(flight)
                .seatNumber("12A")
                .seatClass(SeatClass.ECONOMY)
                .totalPrice(BigDecimal.valueOf(500))
                .status(ReservationStatus.PENDING)
                .build();

        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
        doAnswer(invocation -> {
            Runnable runnable = invocation.getArgument(0);
            runnable.run();
            return null;
        }).when(metricsService).recordReservationProcessing(any(Runnable.class));

        // When
        ReservationDTO result = reservationService.makeReservation(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getBookingReference()).startsWith("AIR");
        assertThat(flight.getAvailableEconomySeats()).isEqualTo(149);
    }
}
