package com.airline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "airports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Airport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "iata_code", nullable = false, unique = true, length = 10)
    private String iataCode;

    @Column(name = "icao_code", nullable = false, length = 10)
    private String icaoCode;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "country_iso", nullable = false, length = 10)
    private String countryIso;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timezone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AirportType type;
}
