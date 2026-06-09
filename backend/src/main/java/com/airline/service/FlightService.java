package com.airline.service;

import com.airline.dto.FlightDTO;
import com.airline.exception.ResourceNotFoundException;
import com.airline.model.Flight;
import com.airline.model.FlightStatus;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository flightRepository;
    private final MetricsService metricsService;

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public FlightDTO createFlight(FlightDTO dto) {
        Flight flight = Flight.builder()
                .flightNumber(dto.getFlightNumber())
                .airline(dto.getAirline())
                .origin(dto.getOrigin())
                .destination(dto.getDestination())
                .departureTime(dto.getDepartureTime())
                .arrivalTime(dto.getArrivalTime())
                .economyPrice(dto.getEconomyPrice())
                .businessPrice(dto.getBusinessPrice())
                .totalEconomySeats(dto.getTotalEconomySeats() != null ? dto.getTotalEconomySeats() : 150)
                .totalBusinessSeats(dto.getTotalBusinessSeats() != null ? dto.getTotalBusinessSeats() : 30)
                .availableEconomySeats(dto.getTotalEconomySeats() != null ? dto.getTotalEconomySeats() : 150)
                .availableBusinessSeats(dto.getTotalBusinessSeats() != null ? dto.getTotalBusinessSeats() : 30)
                .status(FlightStatus.SCHEDULED)
                .build();

        Flight savedFlight = flightRepository.save(flight);
        return convertToDTO(savedFlight);
    }

    @Cacheable(value = "flightSearch", key = "#origin + '-' + #destination + '-' + #date + '-' + #seatClass")
    public List<FlightDTO> searchFlights(String origin, String destination, LocalDate date, String seatClass) {
        metricsService.recordFlightSearch();

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Flight> flights = flightRepository.findByOriginAndDestinationAndDepartureTimeBetween(
                origin, destination, startOfDay, endOfDay);

        // Filter by seat availability depending on class selection
        if ("ECONOMY".equalsIgnoreCase(seatClass)) {
            flights = flights.stream()
                    .filter(f -> f.getAvailableEconomySeats() > 0)
                    .collect(Collectors.toList());
        } else if ("BUSINESS".equalsIgnoreCase(seatClass)) {
            flights = flights.stream()
                    .filter(f -> f.getAvailableBusinessSeats() > 0)
                    .collect(Collectors.toList());
        } else {
            flights = flights.stream()
                    .filter(f -> f.getAvailableEconomySeats() > 0 || f.getAvailableBusinessSeats() > 0)
                    .collect(Collectors.toList());
        }

        return flights.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Flight getFlightEntity(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with ID: " + id));
    }

    public FlightDTO getFlightById(Long id) {
        return convertToDTO(getFlightEntity(id));
    }

    @Transactional
    @CacheEvict(value = "flightSearch", allEntries = true)
    public FlightDTO updateFlightStatus(Long id, FlightStatus status) {
        Flight flight = getFlightEntity(id);
        flight.setStatus(status);
        Flight updatedFlight = flightRepository.save(flight);
        return convertToDTO(updatedFlight);
    }

    public FlightDTO convertToDTO(Flight flight) {
        return FlightDTO.builder()
                .id(flight.getId())
                .flightNumber(flight.getFlightNumber())
                .airline(flight.getAirline())
                .origin(flight.getOrigin())
                .destination(flight.getDestination())
                .departureTime(flight.getDepartureTime())
                .arrivalTime(flight.getArrivalTime())
                .economyPrice(flight.getEconomyPrice())
                .businessPrice(flight.getBusinessPrice())
                .totalEconomySeats(flight.getTotalEconomySeats())
                .totalBusinessSeats(flight.getTotalBusinessSeats())
                .availableEconomySeats(flight.getAvailableEconomySeats())
                .availableBusinessSeats(flight.getAvailableBusinessSeats())
                .status(flight.getStatus())
                .build();
    }
}
