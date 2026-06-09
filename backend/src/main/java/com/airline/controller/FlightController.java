package com.airline.controller;

import com.airline.dto.FlightDTO;
import com.airline.model.FlightStatus;
import com.airline.service.FlightService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightDTO> createFlight(@Valid @RequestBody FlightDTO flightDTO) {
        FlightDTO created = flightService.createFlight(flightDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/search")
    public ResponseEntity<List<FlightDTO>> searchFlights(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String seatClass) {
        List<FlightDTO> flights = flightService.searchFlights(origin, destination, date, seatClass);
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightDTO> getFlightById(@PathVariable Long id) {
        FlightDTO flight = flightService.getFlightById(id);
        return ResponseEntity.ok(flight);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightDTO> updateFlightStatus(@PathVariable Long id, @RequestParam FlightStatus status) {
        FlightDTO updated = flightService.updateFlightStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
