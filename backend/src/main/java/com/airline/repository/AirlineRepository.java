package com.airline.repository;

import com.airline.model.Airline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AirlineRepository extends JpaRepository<Airline, Long> {
    List<Airline> findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCase(String name, String iataCode);
    Optional<Airline> findByIataCodeIgnoreCase(String iataCode);
}
