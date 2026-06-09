-- Database Initialization Schema for Airline Reservation System

CREATE DATABASE IF NOT EXISTS airline_reservation;
USE airline_reservation;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flights Table
CREATE TABLE IF NOT EXISTS flights (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    airline VARCHAR(50),
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    economy_price DECIMAL(10,2) NOT NULL,
    business_price DECIMAL(10,2),
    total_economy_seats INT DEFAULT 150,
    total_business_seats INT DEFAULT 30,
    available_economy_seats INT,
    available_business_seats INT,
    status ENUM('SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED') DEFAULT 'SCHEDULED'
);

-- 3. Reservations Table (with partitioning by range of booking year)
CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT,
    booking_reference VARCHAR(20) NOT NULL,
    user_id BIGINT,
    flight_id BIGINT,
    seat_number VARCHAR(5),
    seat_class ENUM('ECONOMY', 'BUSINESS'),
    total_price DECIMAL(10,2),
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, booking_date),
    UNIQUE KEY (booking_reference, booking_date)
)
PARTITION BY RANGE (YEAR(booking_date)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- 4. Passengers Table
CREATE TABLE IF NOT EXISTS passengers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    passport_number VARCHAR(20),
    nationality VARCHAR(50)
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT UNIQUE,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indexes for Optimization
CREATE INDEX idx_flight_search ON flights(origin, destination, departure_time);
CREATE INDEX idx_flight_departure ON flights(departure_time);
CREATE INDEX idx_reservation_user ON reservations(user_id, status);
CREATE INDEX idx_reservation_booking_ref ON reservations(booking_reference);
