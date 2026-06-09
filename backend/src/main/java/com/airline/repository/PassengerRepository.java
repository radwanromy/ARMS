package com.airline.repository;

import com.airline.model.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {
    List<Passenger> findByReservationId(Long reservationId);
}
