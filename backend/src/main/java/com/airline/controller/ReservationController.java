package com.airline.controller;

import com.airline.dto.ReservationDTO;
import com.airline.dto.ReservationRequest;
import com.airline.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/reserve")
    public ResponseEntity<ReservationDTO> makeReservation(@Valid @RequestBody ReservationRequest request) {
        ReservationDTO reservation = reservationService.makeReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }

    @GetMapping("/user")
    public ResponseEntity<List<ReservationDTO>> getUserReservations() {
        List<ReservationDTO> reservations = reservationService.getUserReservations();
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/{bookingRef}")
    public ResponseEntity<ReservationDTO> getReservation(@PathVariable String bookingRef) {
        ReservationDTO reservation = reservationService.getReservationByReference(bookingRef);
        return ResponseEntity.ok(reservation);
    }

    @DeleteMapping("/{bookingRef}/cancel")
    public ResponseEntity<Void> cancelReservation(@PathVariable String bookingRef) {
        reservationService.cancelReservation(bookingRef);
        return ResponseEntity.noContent().build();
    }
}
