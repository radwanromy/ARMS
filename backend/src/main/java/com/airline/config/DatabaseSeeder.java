package com.airline.config;

import com.airline.model.Flight;
import com.airline.model.FlightStatus;
import com.airline.model.Role;
import com.airline.model.User;
import com.airline.repository.FlightRepository;
import com.airline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (flightRepository.count() < 100) {
            flightRepository.deleteAll();
            seedFlights();
        }
    }

    private void seedUsers() {
        User admin = User.builder()
                .username("admin")
                .email("admin@airline.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .firstName("System")
                .lastName("Administrator")
                .phoneNumber("1234567890")
                .role(Role.ADMIN)
                .build();

        User user = User.builder()
                .username("user")
                .email("user@airline.com")
                .passwordHash(passwordEncoder.encode("user123"))
                .firstName("John")
                .lastName("Doe")
                .phoneNumber("0987654321")
                .role(Role.USER)
                .build();

        userRepository.saveAll(Arrays.asList(admin, user));
        System.out.println("Database seeded with Admin (admin/admin123) and User (user/user123) accounts.");
    }

    private void seedFlights() {
        // Seed flights for all dates in June 2026 (from June 1st to June 30th)
        for (int day = 1; day <= 30; day++) {
            LocalDateTime departureTime1 = LocalDateTime.of(2026, 6, day, 10, 0, 0);
            LocalDateTime arrivalTime1 = departureTime1.plusHours(12);

            Flight flight1 = Flight.builder()
                    .flightNumber("JL04" + String.format("%02d", day))
                    .airline("Japan Airlines")
                    .origin("Tokyo")
                    .destination("Paris")
                    .departureTime(departureTime1)
                    .arrivalTime(arrivalTime1)
                    .economyPrice(BigDecimal.valueOf(850.00))
                    .businessPrice(BigDecimal.valueOf(2100.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime departureTime2 = LocalDateTime.of(2026, 6, day, 14, 30, 0);
            LocalDateTime arrivalTime2 = departureTime2.plusHours(14);

            Flight flight2 = Flight.builder()
                    .flightNumber("NH10" + String.format("%02d", day))
                    .airline("All Nippon Airways")
                    .origin("Tokyo")
                    .destination("New York")
                    .departureTime(departureTime2)
                    .arrivalTime(arrivalTime2)
                    .economyPrice(BigDecimal.valueOf(980.00))
                    .businessPrice(BigDecimal.valueOf(2450.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime departureTime3 = LocalDateTime.of(2026, 6, day, 8, 15, 0);
            LocalDateTime arrivalTime3 = departureTime3.plusHours(2);

            Flight flight3 = Flight.builder()
                    .flightNumber("KE70" + String.format("%02d", day))
                    .airline("Korean Air")
                    .origin("Tokyo")
                    .destination("Seoul")
                    .departureTime(departureTime3)
                    .arrivalTime(arrivalTime3)
                    .economyPrice(BigDecimal.valueOf(220.00))
                    .businessPrice(BigDecimal.valueOf(550.00))
                    .totalEconomySeats(120)
                    .totalBusinessSeats(20)
                    .availableEconomySeats(120)
                    .availableBusinessSeats(20)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime departureTime4 = LocalDateTime.of(2026, 6, day, 11, 45, 0);
            LocalDateTime arrivalTime4 = departureTime4.plusHours(7);

            Flight flight4 = Flight.builder()
                    .flightNumber("SQ63" + String.format("%02d", day))
                    .airline("Singapore Airlines")
                    .origin("Tokyo")
                    .destination("Singapore")
                    .departureTime(departureTime4)
                    .arrivalTime(arrivalTime4)
                    .economyPrice(BigDecimal.valueOf(450.00))
                    .businessPrice(BigDecimal.valueOf(1150.00))
                    .totalEconomySeats(160)
                    .totalBusinessSeats(28)
                    .availableEconomySeats(160)
                    .availableBusinessSeats(28)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime departureTime5 = LocalDateTime.of(2026, 6, day, 9, 30, 0);
            LocalDateTime arrivalTime5 = departureTime5.plusHours(12);

            Flight flight5 = Flight.builder()
                    .flightNumber("BA00" + String.format("%02d", day))
                    .airline("British Airways")
                    .origin("Tokyo")
                    .destination("London")
                    .departureTime(departureTime5)
                    .arrivalTime(arrivalTime5)
                    .economyPrice(BigDecimal.valueOf(890.00))
                    .businessPrice(BigDecimal.valueOf(2300.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime departureTime6 = LocalDateTime.of(2026, 6, day, 20, 15, 0);
            LocalDateTime arrivalTime6 = departureTime6.plusHours(9);

            Flight flight6 = Flight.builder()
                    .flightNumber("QF02" + String.format("%02d", day))
                    .airline("Qantas")
                    .origin("Tokyo")
                    .destination("Sydney")
                    .departureTime(departureTime6)
                    .arrivalTime(arrivalTime6)
                    .economyPrice(BigDecimal.valueOf(680.00))
                    .businessPrice(BigDecimal.valueOf(1750.00))
                    .totalEconomySeats(140)
                    .totalBusinessSeats(25)
                    .availableEconomySeats(140)
                    .availableBusinessSeats(25)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            flightRepository.saveAll(Arrays.asList(flight1, flight2, flight3, flight4, flight5, flight6));
        }
        System.out.println("Database seeded with mock flights for June 2026 across 6 routes.");
    }
}
