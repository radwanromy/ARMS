package com.airline.repository;

import com.airline.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    
    List<Flight> findByOriginAndDestinationAndDepartureTimeBetween(
        String origin, String destination, 
        LocalDateTime startDate, LocalDateTime endDate
    );
    
    @Query("SELECT f FROM Flight f WHERE (f.availableEconomySeats > 0 OR f.availableBusinessSeats > 0) " +
           "AND f.departureTime > :currentTime")
    List<Flight> findAvailableFlights(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT f FROM Flight f WHERE f.origin IN :origins AND f.destination IN :destinations " +
           "AND f.departureTime BETWEEN :startDate AND :endDate")
    List<Flight> findByOriginInAndDestinationInAndDepartureTimeBetween(
        @Param("origins") List<String> origins,
        @Param("destinations") List<String> destinations,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
