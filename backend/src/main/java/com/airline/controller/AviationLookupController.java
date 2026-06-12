package com.airline.controller;

import com.airline.model.Airline;
import com.airline.model.Airport;
import com.airline.model.Country;
import com.airline.repository.AirlineRepository;
import com.airline.repository.AirportRepository;
import com.airline.repository.CountryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class AviationLookupController {

    private final AirportRepository airportRepository;
    private final CountryRepository countryRepository;
    private final AirlineRepository airlineRepository;

    // --- Country Endpoints ---
    @GetMapping("/countries/search")
    public ResponseEntity<List<Country>> searchCountries(@RequestParam String query) {
        return ResponseEntity.ok(countryRepository.findByNameContainingIgnoreCaseOrIsoCodeContainingIgnoreCase(query, query));
    }

    @GetMapping("/countries")
    public ResponseEntity<List<Country>> getAllCountries() {
        return ResponseEntity.ok(countryRepository.findAll());
    }

    @PostMapping("/countries")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Country> createCountry(@RequestBody Country country) {
        return ResponseEntity.status(HttpStatus.CREATED).body(countryRepository.save(country));
    }

    @PutMapping("/countries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Country> updateCountry(@PathVariable Long id, @RequestBody Country details) {
        Country country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found"));
        country.setName(details.getName());
        country.setIsoCode(details.getIsoCode());
        country.setCurrency(details.getCurrency());
        country.setTimezone(details.getTimezone());
        country.setFlagEmoji(details.getFlagEmoji());
        return ResponseEntity.ok(countryRepository.save(country));
    }

    @DeleteMapping("/countries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCountry(@PathVariable Long id) {
        countryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Airport Endpoints ---
    @GetMapping("/airports/search")
    public ResponseEntity<List<Airport>> searchAirports(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        String cleanQuery = query.trim();
        
        // 1. Search countries matching the query
        List<Country> matchingCountries = countryRepository.findByNameContainingIgnoreCaseOrIsoCodeContainingIgnoreCase(cleanQuery, cleanQuery);
        
        // 2. Fetch airports by name, IATA code, or city
        List<Airport> airports = airportRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCaseOrCityContainingIgnoreCase(cleanQuery, cleanQuery, cleanQuery);
        
        // Convert to mutable list so we can append
        List<Airport> result = new java.util.ArrayList<>(airports);
        
        if (!matchingCountries.isEmpty()) {
            List<String> countryIsos = matchingCountries.stream()
                    .map(Country::getIsoCode)
                    .collect(java.util.stream.Collectors.toList());
            
            // 3. Find all airports located in these countries
            List<Airport> countryAirports = airportRepository.findByCountryIsoInIgnoreCase(countryIsos);
            
            // Append and deduplicate (by IATA code)
            java.util.Set<String> existingIatas = result.stream()
                    .map(Airport::getIataCode)
                    .collect(java.util.stream.Collectors.toSet());
            
            for (Airport a : countryAirports) {
                if (!existingIatas.contains(a.getIataCode())) {
                    result.add(a);
                    existingIatas.add(a.getIataCode());
                }
            }
        }
        
        // Limit results to a reasonable number to avoid huge payloads (e.g. max 100 results)
        if (result.size() > 100) {
            result = result.subList(0, 100);
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/airports")
    public ResponseEntity<List<Airport>> getAllAirports() {
        return ResponseEntity.ok(airportRepository.findAll());
    }

    @PostMapping("/airports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Airport> createAirport(@RequestBody Airport airport) {
        return ResponseEntity.status(HttpStatus.CREATED).body(airportRepository.save(airport));
    }

    @PutMapping("/airports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Airport> updateAirport(@PathVariable Long id, @RequestBody Airport details) {
        Airport airport = airportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Airport not found"));
        airport.setName(details.getName());
        airport.setIataCode(details.getIataCode());
        airport.setIcaoCode(details.getIcaoCode());
        airport.setCity(details.getCity());
        airport.setCountryIso(details.getCountryIso());
        airport.setLatitude(details.getLatitude());
        airport.setLongitude(details.getLongitude());
        airport.setTimezone(details.getTimezone());
        airport.setType(details.getType());
        return ResponseEntity.ok(airportRepository.save(airport));
    }

    @DeleteMapping("/airports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAirport(@PathVariable Long id) {
        airportRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Airline Endpoints ---
    @GetMapping("/airlines/search")
    public ResponseEntity<List<Airline>> searchAirlines(@RequestParam String query) {
        return ResponseEntity.ok(airlineRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCase(query, query));
    }

    @GetMapping("/airlines")
    public ResponseEntity<List<Airline>> getAllAirlines() {
        return ResponseEntity.ok(airlineRepository.findAll());
    }

    @PostMapping("/airlines")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Airline> createAirline(@RequestBody Airline airline) {
        return ResponseEntity.status(HttpStatus.CREATED).body(airlineRepository.save(airline));
    }

    @PutMapping("/airlines/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Airline> updateAirline(@PathVariable Long id, @RequestBody Airline details) {
        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Airline not found"));
        airline.setName(details.getName());
        airline.setIataCode(details.getIataCode());
        airline.setCountryIso(details.getCountryIso());
        return ResponseEntity.ok(airlineRepository.save(airline));
    }

    @DeleteMapping("/airlines/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAirline(@PathVariable Long id) {
        airlineRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
