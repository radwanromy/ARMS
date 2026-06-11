package com.airline.repository;

import com.airline.model.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AirportRepository extends JpaRepository<Airport, Long> {
    List<Airport> findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCaseOrCityContainingIgnoreCase(
        String name, String iataCode, String city
    );
    Optional<Airport> findByIataCodeIgnoreCase(String iataCode);
    List<Airport> findByCountryIsoIgnoreCase(String countryIso);
}
