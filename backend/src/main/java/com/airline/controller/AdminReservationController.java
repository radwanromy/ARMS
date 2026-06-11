package com.airline.controller;

import com.airline.dto.ReservationDTO;
import com.airline.model.ReservationStatus;
import com.airline.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reservations")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        List<ReservationDTO> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    @PatchMapping("/{bookingRef}/status")
    public ResponseEntity<ReservationDTO> updateReservationStatus(
            @PathVariable String bookingRef,
            @RequestParam ReservationStatus status) {
        ReservationDTO updated = reservationService.updateReservationStatus(bookingRef, status);
        return ResponseEntity.ok(updated);
    }
}
