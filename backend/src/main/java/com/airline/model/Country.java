package com.airline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "countries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "iso_code", nullable = false, unique = true, length = 10)
    private String isoCode;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timezone;

    @Column(name = "flag_emoji", length = 10)
    private String flagEmoji;
}
