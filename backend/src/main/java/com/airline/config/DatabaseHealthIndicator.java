package com.airline.config;

import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseHealthIndicator implements HealthIndicator {

    private final FlightRepository flightRepository;

    @Override
    public Health health() {
        try {
            long count = flightRepository.count();
            return Health.up()
                    .withDetail("database", "available")
                    .withDetail("total_flights", count)
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
