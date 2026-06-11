package com.airline.repository;

import com.airline.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
    List<Country> findByNameContainingIgnoreCaseOrIsoCodeContainingIgnoreCase(String name, String isoCode);
    Optional<Country> findByIsoCodeIgnoreCase(String isoCode);
}
