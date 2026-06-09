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
        if (flightRepository.count() == 0) {
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
        LocalDateTime now = LocalDateTime.now();

        // Seed flights for the next 7 days
        for (int i = 1; i <= 7; i++) {
            LocalDateTime departureTime1 = now.plusDays(i).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime arrivalTime1 = departureTime1.plusHours(12);

            Flight flight1 = Flight.builder()
                    .flightNumber("JL04" + i)
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

            LocalDateTime departureTime2 = now.plusDays(i).withHour(14).withMinute(30).withSecond(0).withNano(0);
            LocalDateTime arrivalTime2 = departureTime2.plusHours(14);

            Flight flight2 = Flight.builder()
                    .flightNumber("NH10" + i)
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

            LocalDateTime departureTime3 = now.plusDays(i).withHour(8).withMinute(15).withSecond(0).withNano(0);
            LocalDateTime arrivalTime3 = departureTime3.plusHours(2);

            Flight flight3 = Flight.builder()
                    .flightNumber("KE70" + i)
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

            flightRepository.saveAll(Arrays.asList(flight1, flight2, flight3));
        }
        System.out.println("Database seeded with mock flights for JAL, ANA, and Korean Air.");
    }
}
