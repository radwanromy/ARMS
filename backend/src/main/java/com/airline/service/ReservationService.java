package com.airline.service;

import com.airline.dto.*;
import com.airline.exception.ResourceNotFoundException;
import com.airline.exception.SeatUnavailableException;
import com.airline.model.*;
import com.airline.repository.FlightRepository;
import com.airline.repository.PassengerRepository;
import com.airline.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final FlightRepository flightRepository;
    private final PassengerRepository passengerRepository;
    private final UserService userService;
    private final FlightService flightService;
    private final MetricsService metricsService;

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public ReservationDTO makeReservation(ReservationRequest request) {
        final ReservationDTO[] result = new ReservationDTO[1];

        metricsService.recordReservationProcessing(() -> {
            Flight flight = flightRepository.findById(request.getFlightId())
                    .orElseThrow(() -> new ResourceNotFoundException("Flight not found with ID: " + request.getFlightId()));

            int passengerCount = (request.getPassengers() != null && !request.getPassengers().isEmpty()) 
                    ? request.getPassengers().size() : 1;

            SeatClass seatClass;
            try {
                seatClass = SeatClass.valueOf(request.getSeatClass().toUpperCase());
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid seat class: " + request.getSeatClass());
            }

            // Validate and deduct seats
            if (seatClass == SeatClass.BUSINESS) {
                if (flight.getAvailableBusinessSeats() < passengerCount) {
                    throw new SeatUnavailableException("Not enough business seats available (Requested: " + passengerCount + ")");
                }
                flight.setAvailableBusinessSeats(flight.getAvailableBusinessSeats() - passengerCount);
            } else {
                if (flight.getAvailableEconomySeats() < passengerCount) {
                    throw new SeatUnavailableException("Not enough economy seats available (Requested: " + passengerCount + ")");
                }
                flight.setAvailableEconomySeats(flight.getAvailableEconomySeats() - passengerCount);
            }

            flightRepository.save(flight);

            // Calculate Price
            BigDecimal unitPrice = (seatClass == SeatClass.BUSINESS) ? flight.getBusinessPrice() : flight.getEconomyPrice();
            BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(passengerCount));

            // Generate booking reference
            String bookingRef = "AIR" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            // Save Reservation
            Reservation reservation = Reservation.builder()
                    .bookingReference(bookingRef)
                    .user(userService.getCurrentUser())
                    .flight(flight)
                    .seatNumber(request.getSeatNumber())
                    .seatClass(seatClass)
                    .totalPrice(totalPrice)
                    .status(ReservationStatus.PENDING)
                    .build();

            Reservation savedReservation = reservationRepository.save(reservation);

            // Save Passengers
            if (request.getPassengers() != null && !request.getPassengers().isEmpty()) {
                List<Passenger> passengers = request.getPassengers().stream()
                        .map(pDto -> Passenger.builder()
                                .reservationId(savedReservation.getId())
                                .fullName(pDto.getFullName())
                                .dateOfBirth(pDto.getDateOfBirth())
                                .passportNumber(pDto.getPassportNumber())
                                .nationality(pDto.getNationality())
                                .build())
                        .collect(Collectors.toList());
                passengerRepository.saveAll(passengers);
            } else {
                // If empty list, create a passenger record for the main user
                User currentUser = savedReservation.getUser();
                Passenger passenger = Passenger.builder()
                        .reservationId(savedReservation.getId())
                        .fullName(currentUser.getFirstName() + " " + currentUser.getLastName())
                        .build();
                passengerRepository.save(passenger);
            }

            result[0] = convertToDTO(savedReservation);
        });

        return result[0];
    }

    public ReservationDTO getReservationByReference(String bookingRef) {
        Reservation reservation = reservationRepository.findByBookingReference(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with reference: " + bookingRef));
        return convertToDTO(reservation);
    }

    public List<ReservationDTO> getUserReservations() {
        String username = userService.getCurrentUser().getUsername();
        List<Reservation> reservations = reservationRepository.findByUserUsername(username);
        return reservations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public void cancelReservation(String bookingRef) {
        Reservation reservation = reservationRepository.findByBookingReference(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with reference: " + bookingRef));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalStateException("Reservation is already cancelled");
        }

        // Restore seats on the flight
        Flight flight = reservation.getFlight();
        List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());
        int seatsToRestore = passengers.isEmpty() ? 1 : passengers.size();

        if (reservation.getSeatClass() == SeatClass.BUSINESS) {
            flight.setAvailableBusinessSeats(flight.getAvailableBusinessSeats() + seatsToRestore);
        } else {
            flight.setAvailableEconomySeats(flight.getAvailableEconomySeats() + seatsToRestore);
        }

        flightRepository.save(flight);

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    public ReservationDTO convertToDTO(Reservation reservation) {
        List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());
        List<PassengerDTO> passengerDTOs = passengers.stream()
                .map(p -> PassengerDTO.builder()
                        .fullName(p.getFullName())
                        .dateOfBirth(p.getDateOfBirth())
                        .passportNumber(p.getPassportNumber())
                        .nationality(p.getNationality())
                        .build())
                .collect(Collectors.toList());

        return ReservationDTO.builder()
                .id(reservation.getId())
                .bookingReference(reservation.getBookingReference())
                .flight(flightService.convertToDTO(reservation.getFlight()))
                .seatNumber(reservation.getSeatNumber())
                .seatClass(reservation.getSeatClass())
                .totalPrice(reservation.getTotalPrice())
                .status(reservation.getStatus())
                .bookingDate(reservation.getBookingDate())
                .user(userService.convertToDTO(reservation.getUser()))
                .passengers(passengerDTOs)
                .build();
    }
}
