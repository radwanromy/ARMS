package com.airline.dto;

import com.airline.model.FlightStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightDTO {
    private Long id;
    private String flightNumber;
    private String airline;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private BigDecimal economyPrice;
    private BigDecimal businessPrice;
    private Integer totalEconomySeats;
    private Integer totalBusinessSeats;
    private Integer availableEconomySeats;
    private Integer availableBusinessSeats;
    private FlightStatus status;
}
