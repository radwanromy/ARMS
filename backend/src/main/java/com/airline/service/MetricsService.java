package com.airline.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class MetricsService {

    private final Counter searchCounter;
    private final Timer reservationTimer;

    public MetricsService(MeterRegistry meterRegistry) {
        this.searchCounter = Counter.builder("flight.searches")
                .description("Number of flight searches performed")
                .register(meterRegistry);
        this.reservationTimer = Timer.builder("reservation.processing.time")
                .description("Time taken to process reservations")
                .register(meterRegistry);
    }

    public void recordFlightSearch() {
        searchCounter.increment();
    }

    public void recordReservationProcessing(Runnable task) {
        reservationTimer.record(task);
    }
}
