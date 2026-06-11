package com.airline.service;

import com.airline.dto.*;
import com.airline.exception.ResourceNotFoundException;
import com.airline.exception.SeatUnavailableException;
import com.airline.model.*;
import com.airline.repository.FlightRepository;
import com.airline.repository.PassengerRepository;
import com.airline.repository.ReservationRepository;
import com.airline.repository.BookingAuditLogRepository;
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
    private final BookingAuditLogRepository bookingAuditLogRepository;
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
                    .mealPreference(request.getMealPreference() != null ? request.getMealPreference() : "NONE")
                    .specialAssistance(request.getSpecialAssistance() != null ? request.getSpecialAssistance() : "NONE")
                    .contactEmail(request.getContactEmail())
                    .contactPhone(request.getContactPhone())
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
    public List<ReservationDTO> getAllReservations() {
        List<Reservation> reservations = reservationRepository.findAll();
        return reservations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public ReservationDTO updateReservationStatus(String bookingRef, ReservationStatus status) {
        Reservation reservation = reservationRepository.findByBookingReference(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with reference: " + bookingRef));

        ReservationStatus oldStatus = reservation.getStatus();
        if (oldStatus == status) {
            return convertToDTO(reservation);
        }

        // Handle seat changes when cancelling a booking
        if (status == ReservationStatus.CANCELLED && oldStatus != ReservationStatus.CANCELLED) {
            Flight flight = reservation.getFlight();
            List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());
            int seatsToRestore = passengers.isEmpty() ? 1 : passengers.size();

            if (reservation.getSeatClass() == SeatClass.BUSINESS) {
                flight.setAvailableBusinessSeats(flight.getAvailableBusinessSeats() + seatsToRestore);
            } else {
                flight.setAvailableEconomySeats(flight.getAvailableEconomySeats() + seatsToRestore);
            }
            flightRepository.save(flight);
        }
        // Handle seat changes when re-activating a CANCELLED booking
        else if (oldStatus == ReservationStatus.CANCELLED && status != ReservationStatus.CANCELLED) {
            Flight flight = reservation.getFlight();
            List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());
            int seatsToDeduct = passengers.isEmpty() ? 1 : passengers.size();

            if (reservation.getSeatClass() == SeatClass.BUSINESS) {
                if (flight.getAvailableBusinessSeats() < seatsToDeduct) {
                    throw new SeatUnavailableException("Not enough business seats available to re-activate reservation.");
                }
                flight.setAvailableBusinessSeats(flight.getAvailableBusinessSeats() - seatsToDeduct);
            } else {
                if (flight.getAvailableEconomySeats() < seatsToDeduct) {
                    throw new SeatUnavailableException("Not enough economy seats available to re-activate reservation.");
                }
                flight.setAvailableEconomySeats(flight.getAvailableEconomySeats() - seatsToDeduct);
            }
            flightRepository.save(flight);
        }

        reservation.setStatus(status);
        Reservation updated = reservationRepository.save(reservation);
        return convertToDTO(updated);
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
                .mealPreference(reservation.getMealPreference())
                .specialAssistance(reservation.getSpecialAssistance())
                .contactEmail(reservation.getContactEmail())
                .contactPhone(reservation.getContactPhone())
                .build();
    }

    private String serializeReservationState(Reservation reservation, List<Passenger> passengers) {
        StringBuilder sb = new StringBuilder();
        sb.append("Reference: ").append(reservation.getBookingReference()).append(" | ");
        sb.append("Seat: ").append(reservation.getSeatNumber()).append(" | ");
        sb.append("Meal: ").append(reservation.getMealPreference()).append(" | ");
        sb.append("Assistance: ").append(reservation.getSpecialAssistance()).append(" | ");
        sb.append("Contact Email: ").append(reservation.getContactEmail()).append(" | ");
        sb.append("Contact Phone: ").append(reservation.getContactPhone()).append(" | ");
        sb.append("Passengers: [");
        if (passengers != null) {
            for (Passenger p : passengers) {
                sb.append("{Name: ").append(p.getFullName())
                  .append(", Passport: ").append(p.getPassportNumber())
                  .append(", Nationality: ").append(p.getNationality())
                  .append(", DOB: ").append(p.getDateOfBirth()).append("}, ");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public ReservationDTO modifyReservation(String bookingRef, ReservationDTO modification) {
        Reservation reservation = reservationRepository.findByBookingReference(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with reference: " + bookingRef));

        User currentUser = userService.getCurrentUser();

        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            if (currentUser == null || (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.SUPPORT_AGENT)) {
                throw new IllegalStateException("This booking has been completed and can no longer be modified directly.");
            }
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalStateException("Cancelled bookings cannot be modified.");
        }

        List<Passenger> existingPassengers = passengerRepository.findByReservationId(reservation.getId());
        String oldValueStr = serializeReservationState(reservation, existingPassengers);

        StringBuilder changeDesc = new StringBuilder("Updated details:");

        // 1. Update basic reservation fields
        if (modification.getSeatNumber() != null && !modification.getSeatNumber().equals(reservation.getSeatNumber())) {
            changeDesc.append(String.format(" Seat changed from %s to %s.", reservation.getSeatNumber(), modification.getSeatNumber()));
            reservation.setSeatNumber(modification.getSeatNumber());
        }
        if (modification.getMealPreference() != null && !modification.getMealPreference().equals(reservation.getMealPreference())) {
            changeDesc.append(String.format(" Meal preference changed from %s to %s.", reservation.getMealPreference(), modification.getMealPreference()));
            reservation.setMealPreference(modification.getMealPreference());
        }
        if (modification.getSpecialAssistance() != null && !modification.getSpecialAssistance().equals(reservation.getSpecialAssistance())) {
            changeDesc.append(String.format(" Special assistance updated to %s.", modification.getSpecialAssistance()));
            reservation.setSpecialAssistance(modification.getSpecialAssistance());
        }
        if (modification.getContactEmail() != null && !modification.getContactEmail().equals(reservation.getContactEmail())) {
            changeDesc.append(String.format(" Contact email changed to %s.", modification.getContactEmail()));
            reservation.setContactEmail(modification.getContactEmail());
        }
        if (modification.getContactPhone() != null && !modification.getContactPhone().equals(reservation.getContactPhone())) {
            changeDesc.append(String.format(" Contact phone changed to %s.", modification.getContactPhone()));
            reservation.setContactPhone(modification.getContactPhone());
        }

        // 2. Update passenger details (if provided)
        if (modification.getPassengers() != null && !modification.getPassengers().isEmpty()) {
            for (int i = 0; i < Math.min(existingPassengers.size(), modification.getPassengers().size()); i++) {
                Passenger existing = existingPassengers.get(i);
                PassengerDTO mod = modification.getPassengers().get(i);
                
                if (!mod.getFullName().equals(existing.getFullName())) {
                    changeDesc.append(String.format(" Passenger name changed from %s to %s.", existing.getFullName(), mod.getFullName()));
                    existing.setFullName(mod.getFullName());
                }
                if (mod.getPassportNumber() != null && !mod.getPassportNumber().equals(existing.getPassportNumber())) {
                    changeDesc.append(String.format(" Passport number updated to %s.", mod.getPassportNumber()));
                    existing.setPassportNumber(mod.getPassportNumber());
                }
                if (mod.getNationality() != null && !mod.getNationality().equals(existing.getNationality())) {
                    changeDesc.append(String.format(" Nationality updated to %s.", mod.getNationality()));
                    existing.setNationality(mod.getNationality());
                }
                if (mod.getDateOfBirth() != null && !mod.getDateOfBirth().equals(existing.getDateOfBirth())) {
                    changeDesc.append(String.format(" Date of birth updated to %s.", mod.getDateOfBirth()));
                    existing.setDateOfBirth(mod.getDateOfBirth());
                }
                passengerRepository.save(existing);
            }
        }

        Reservation saved = reservationRepository.save(reservation);
        List<Passenger> updatedPassengers = passengerRepository.findByReservationId(reservation.getId());
        String newValueStr = serializeReservationState(saved, updatedPassengers);

        // 3. Save to Booking Audit Logs
        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingReference(bookingRef)
                .changedBy(currentUser != null ? currentUser.getUsername() : "system")
                .description(changeDesc.toString())
                .oldValue(oldValueStr)
                .newValue(newValueStr)
                .reason(modification.getModificationReason())
                .build();
        bookingAuditLogRepository.save(audit);

        return convertToDTO(saved);
    }

    public List<BookingAuditLog> getBookingAuditLogs(String bookingRef) {
        return bookingAuditLogRepository.findByBookingReferenceOrderByChangeTimestampDesc(bookingRef);
    }
}
