package com.airline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_number", unique = true, nullable = false, length = 10)
    private String flightNumber;

    @Column(length = 50)
    private String airline;

    @Column(nullable = false, length = 100)
    private String origin;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "departure_time", nullable = false)
    private LocalDateTime departureTime;

    @Column(name = "arrival_time", nullable = false)
    private LocalDateTime arrivalTime;

    @Column(name = "economy_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal economyPrice;

    @Column(name = "business_price", precision = 10, scale = 2)
    private BigDecimal businessPrice;

    @Column(name = "total_economy_seats")
    private Integer totalEconomySeats;

    @Column(name = "total_business_seats")
    private Integer totalBusinessSeats;

    @Column(name = "available_economy_seats")
    private Integer availableEconomySeats;

    @Column(name = "available_business_seats")
    private Integer availableBusinessSeats;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status;
}
