package com.airline.repository;

import com.airline.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Optional<Reservation> findByBookingReference(String bookingReference);
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByUserUsername(String username);
}
