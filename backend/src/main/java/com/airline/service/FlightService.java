package com.airline.service;

import com.airline.dto.FlightDTO;
import com.airline.exception.ResourceNotFoundException;
import com.airline.model.Flight;
import com.airline.model.FlightStatus;
import com.airline.model.Airport;
import com.airline.model.AirportType;
import com.airline.model.Airline;
import com.airline.repository.FlightRepository;
import com.airline.repository.AirportRepository;
import com.airline.repository.CountryRepository;
import com.airline.repository.AirlineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository flightRepository;
    private final MetricsService metricsService;
    private final AirportRepository airportRepository;
    private final CountryRepository countryRepository;
    private final AirlineRepository airlineRepository;

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

        List<String> origins = resolveAirportCodes(origin);
        List<String> destinations = resolveAirportCodes(destination);

        List<Flight> flights = flightRepository.findByOriginInAndDestinationInAndDepartureTimeBetween(
                origins, destinations, startOfDay, endOfDay);

        // If no flights exist for the resolved route/date, dynamically generate them!
        if (flights.isEmpty()) {
            Airport originAirport = findMainAirport(origin);
            Airport destAirport = findMainAirport(destination);
            if (originAirport != null && destAirport != null && !originAirport.getIataCode().equals(destAirport.getIataCode())) {
                generateMockFlights(originAirport, destAirport, date);
                // Re-fetch from DB
                flights = flightRepository.findByOriginInAndDestinationInAndDepartureTimeBetween(
                        origins, destinations, startOfDay, endOfDay);
            }
        }

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

    private List<String> resolveAirportCodes(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String cleanQuery = query.trim();
        List<com.airline.model.Airport> airports = airportRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCaseOrCityContainingIgnoreCase(
                cleanQuery, cleanQuery, cleanQuery);
        
        List<String> codes = new java.util.ArrayList<>();
        for (com.airline.model.Airport airport : airports) {
            if (airport.getIataCode() != null) {
                codes.add(airport.getIataCode().toUpperCase());
            }
        }
        
        // Also look up countries matching the query
        List<com.airline.model.Country> countries = countryRepository.findByNameContainingIgnoreCaseOrIsoCodeContainingIgnoreCase(cleanQuery, cleanQuery);
        if (!countries.isEmpty()) {
            List<String> isos = countries.stream().map(com.airline.model.Country::getIsoCode).collect(Collectors.toList());
            List<com.airline.model.Airport> countryAirports = airportRepository.findByCountryIsoInIgnoreCase(isos);
            for (com.airline.model.Airport airport : countryAirports) {
                if (airport.getIataCode() != null) {
                    codes.add(airport.getIataCode().toUpperCase());
                }
            }
        }
        
        codes.add(cleanQuery);
        codes.add(cleanQuery.toUpperCase());
        return codes.stream().distinct().collect(Collectors.toList());
    }

    private Airport findMainAirport(String query) {
        if (query == null || query.trim().isEmpty()) {
            return null;
        }
        String clean = query.trim();
        // 1. Try exact IATA match
        java.util.Optional<Airport> opt = airportRepository.findByIataCodeIgnoreCase(clean);
        if (opt.isPresent()) {
            return opt.get();
        }
        // 2. Try city/name match, order by type (INTERNATIONAL first)
        List<Airport> cityAirports = airportRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCaseOrCityContainingIgnoreCase(clean, clean, clean);
        
        // Try country match if no city/name match
        if (cityAirports.isEmpty()) {
            List<com.airline.model.Country> countries = countryRepository.findByNameContainingIgnoreCaseOrIsoCodeContainingIgnoreCase(clean, clean);
            if (!countries.isEmpty()) {
                List<String> isos = countries.stream().map(com.airline.model.Country::getIsoCode).collect(Collectors.toList());
                cityAirports = airportRepository.findByCountryIsoInIgnoreCase(isos);
            }
        }

        if (!cityAirports.isEmpty()) {
            List<Airport> mutableAirports = new java.util.ArrayList<>(cityAirports);
            mutableAirports.sort((a1, a2) -> {
                if (a1.getType() == a2.getType()) {
                    return a1.getName().compareTo(a2.getName());
                }
                return a1.getType() == AirportType.INTERNATIONAL ? -1 : 1;
            });
            return mutableAirports.get(0);
        }
        return null;
    }

    @Transactional
    public void generateMockFlights(Airport origin, Airport dest, LocalDate date) {
        double distance = calculateHaversineDistance(origin.getLatitude(), origin.getLongitude(), dest.getLatitude(), dest.getLongitude());
        // Speed 800 km/h + 30 mins
        double hours = (distance / 800.0) + 0.5;
        long durationMinutes = Math.max(30, Math.round(hours * 60));

        double econPriceVal = 50.0 + (distance * 0.08);
        BigDecimal economyPrice = BigDecimal.valueOf(Math.round(econPriceVal * 100.0) / 100.0);
        BigDecimal businessPrice = BigDecimal.valueOf(Math.round(econPriceVal * 2.5 * 100.0) / 100.0);

        // Find airlines from the origin country
        List<Airline> airlines = airlineRepository.findByCountryIsoIgnoreCase(origin.getCountryIso());
        if (airlines.isEmpty()) {
            // Try destination country
            airlines = airlineRepository.findByCountryIsoIgnoreCase(dest.getCountryIso());
        }
        if (airlines.isEmpty()) {
            // Try JAL as fallback
            airlines = airlineRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCase("JAL", "JL");
        }
        if (airlines.isEmpty()) {
            // Fallback to all
            airlines = airlineRepository.findAll();
        }

        Airline airline;
        if (!airlines.isEmpty()) {
            airline = airlines.get(0);
        } else {
            airline = Airline.builder().name("Volant Airways").iataCode("VA").countryIso("US").build();
        }

        // Generate 3 flights at 8:00, 14:00, 20:00
        int routeNum = Math.abs((origin.getIataCode() + dest.getIataCode()).hashCode()) % 900 + 100;
        
        for (int i = 0; i < 3; i++) {
            int hour = (i == 0) ? 8 : (i == 1) ? 14 : 20;
            LocalDateTime depTime = date.atTime(hour, 0);
            LocalDateTime arrTime = depTime.plusMinutes(durationMinutes);
            
            String slotChar = (i == 0) ? "A" : (i == 1) ? "B" : "C";
            String flightNumber = airline.getIataCode() + routeNum + slotChar;

            // Make sure flight number does not exist
            if (flightRepository.findByFlightNumber(flightNumber).isPresent()) {
                flightNumber = flightNumber + i;
            }

            Flight f = Flight.builder()
                    .flightNumber(flightNumber)
                    .airline(airline.getName())
                    .origin(origin.getIataCode())
                    .destination(dest.getIataCode())
                    .departureTime(depTime)
                    .arrivalTime(arrTime)
                    .economyPrice(economyPrice)
                    .businessPrice(businessPrice)
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();
            flightRepository.save(f);
        }
        System.out.println("Dynamically generated 3 flights for route " + origin.getIataCode() + " -> " + dest.getIataCode() + " on " + date);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
