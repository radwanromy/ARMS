package com.airline.config;

import com.airline.model.*;
import com.airline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final PasswordEncoder passwordEncoder;
    private final CountryRepository countryRepository;
    private final AirportRepository airportRepository;
    private final AirlineRepository airlineRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (countryRepository.count() == 0 || countryRepository.findByIsoCodeIgnoreCase("BD").isEmpty()) {
            countryRepository.deleteAll();
            seedCountries();
        }
        if (airportRepository.count() == 0 || airportRepository.findByIataCodeIgnoreCase("DAC").isEmpty()) {
            airportRepository.deleteAll();
            seedAirports();
        }
        if (airlineRepository.count() == 0 || airlineRepository.findByIataCodeIgnoreCase("BG").isEmpty()) {
            airlineRepository.deleteAll();
            seedAirlines();
        }
        if (flightRepository.count() < 100) {
            seedFlights();
        }
        if (flightRepository.findAll().stream().noneMatch(f -> "DAC".equals(f.getOrigin()) || "DAC".equals(f.getDestination()))) {
            seedDhakaFlights();
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
        System.out.println("Database seeded with Admin and User accounts.");
    }

    private void seedCountries() {
        List<Country> countries = Arrays.asList(
                Country.builder().name("United States").isoCode("US").currency("USD").timezone("GMT-5").flagEmoji("🇺🇸").build(),
                Country.builder().name("Japan").isoCode("JP").currency("JPY").timezone("GMT+9").flagEmoji("🇯🇵").build(),
                Country.builder().name("United Kingdom").isoCode("GB").currency("GBP").timezone("GMT+0").flagEmoji("🇬🇧").build(),
                Country.builder().name("France").isoCode("FR").currency("EUR").timezone("GMT+1").flagEmoji("🇫🇷").build(),
                Country.builder().name("United Arab Emirates").isoCode("AE").currency("AED").timezone("GMT+4").flagEmoji("🇦🇪").build(),
                Country.builder().name("Singapore").isoCode("SG").currency("SGD").timezone("GMT+8").flagEmoji("🇸🇬").build(),
                Country.builder().name("Australia").isoCode("AU").currency("AUD").timezone("GMT+10").flagEmoji("🇦🇺").build(),
                Country.builder().name("Germany").isoCode("DE").currency("EUR").timezone("GMT+1").flagEmoji("🇩🇪").build(),
                Country.builder().name("China").isoCode("CN").currency("CNY").timezone("GMT+8").flagEmoji("🇨🇳").build(),
                Country.builder().name("India").isoCode("IN").currency("INR").timezone("GMT+5.5").flagEmoji("🇮🇳").build(),
                Country.builder().name("South Korea").isoCode("KR").currency("KRW").timezone("GMT+9").flagEmoji("🇰🇷").build(),
                Country.builder().name("Saudi Arabia").isoCode("SA").currency("SAR").timezone("GMT+3").flagEmoji("🇸🇦").build(),
                Country.builder().name("Canada").isoCode("CA").currency("CAD").timezone("GMT-5").flagEmoji("🇨🇦").build(),
                Country.builder().name("Brazil").isoCode("BR").currency("BRL").timezone("GMT-3").flagEmoji("🇧🇷").build(),
                Country.builder().name("Mexico").isoCode("MX").currency("MXN").timezone("GMT-6").flagEmoji("🇲🇽").build(),
                Country.builder().name("Thailand").isoCode("TH").currency("THB").timezone("GMT+7").flagEmoji("🇹🇭").build(),
                Country.builder().name("Malaysia").isoCode("MY").currency("MYR").timezone("GMT+8").flagEmoji("🇲🇾").build(),
                Country.builder().name("Indonesia").isoCode("ID").currency("IDR").timezone("GMT+7").flagEmoji("🇮🇩").build(),
                Country.builder().name("Spain").isoCode("ES").currency("EUR").timezone("GMT+1").flagEmoji("🇪🇸").build(),
                Country.builder().name("Italy").isoCode("IT").currency("EUR").timezone("GMT+1").flagEmoji("🇮🇹").build(),
                Country.builder().name("Bangladesh").isoCode("BD").currency("BDT").timezone("GMT+6").flagEmoji("🇧🇩").build()
        );
        countryRepository.saveAll(countries);
        System.out.println("Countries database seeded.");
    }

    private void seedAirports() {
        List<Airport> airports = Arrays.asList(
                // Japan
                Airport.builder().name("Tokyo Haneda Airport").iataCode("HND").icaoCode("RJTT").city("Tokyo").countryIso("JP").latitude(35.5494).longitude(139.7798).timezone("GMT+9").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Tokyo Narita Airport").iataCode("NRT").icaoCode("RJAA").city("Tokyo").countryIso("JP").latitude(35.7720).longitude(140.3929).timezone("GMT+9").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Osaka Itami Airport").iataCode("ITM").icaoCode("RJOO").city("Osaka").countryIso("JP").latitude(34.7855).longitude(135.4382).timezone("GMT+9").type(AirportType.DOMESTIC).build(),
                Airport.builder().name("New Chitose Airport").iataCode("CTS").icaoCode("RJCC").city("Sapporo").countryIso("JP").latitude(42.7752).longitude(141.6923).timezone("GMT+9").type(AirportType.DOMESTIC).build(),
                Airport.builder().name("Fukuoka Airport").iataCode("FUK").icaoCode("RJFF").city("Fukuoka").countryIso("JP").latitude(33.5859).longitude(130.4507).timezone("GMT+9").type(AirportType.DOMESTIC).build(),
                
                // US
                Airport.builder().name("John F. Kennedy International Airport").iataCode("JFK").icaoCode("KJFK").city("New York").countryIso("US").latitude(40.6398).longitude(-73.7789).timezone("GMT-5").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Los Angeles International Airport").iataCode("LAX").icaoCode("KLAX").city("Los Angeles").countryIso("US").latitude(33.9416).longitude(-118.4085).timezone("GMT-8").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("San Francisco International Airport").iataCode("SFO").icaoCode("KSFO").city("San Francisco").countryIso("US").latitude(37.6190).longitude(-122.3749).timezone("GMT-8").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Chicago O'Hare International Airport").iataCode("ORD").icaoCode("KORD").city("Chicago").countryIso("US").latitude(41.9742).longitude(-87.9073).timezone("GMT-6").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Daniel K. Inouye International Airport").iataCode("HNL").icaoCode("PHNL").city("Honolulu").countryIso("US").latitude(21.3187).longitude(-157.9225).timezone("GMT-10").type(AirportType.DOMESTIC).build(),
                Airport.builder().name("Seattle-Tacoma International Airport").iataCode("SEA").icaoCode("KSEA").city("Seattle").countryIso("US").latitude(47.4489).longitude(-122.3093).timezone("GMT-8").type(AirportType.DOMESTIC).build(),
                
                // GB
                Airport.builder().name("London Heathrow Airport").iataCode("LHR").icaoCode("EGLL").city("London").countryIso("GB").latitude(51.4700).longitude(-0.4543).timezone("GMT+0").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("London Gatwick Airport").iataCode("LGW").icaoCode("EGKK").city("London").countryIso("GB").latitude(51.1481).longitude(-0.1903).timezone("GMT+0").type(AirportType.INTERNATIONAL).build(),
                
                // FR
                Airport.builder().name("Paris Charles de Gaulle Airport").iataCode("CDG").icaoCode("LFPG").city("Paris").countryIso("FR").latitude(49.0097).longitude(2.5479).timezone("GMT+1").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Paris Orly Airport").iataCode("ORY").icaoCode("LFPO").city("Paris").countryIso("FR").latitude(48.7262).longitude(2.3652).timezone("GMT+1").type(AirportType.INTERNATIONAL).build(),
                
                // AE
                Airport.builder().name("Dubai International Airport").iataCode("DXB").icaoCode("OMDB").city("Dubai").countryIso("AE").latitude(25.2532).longitude(55.3657).timezone("GMT+4").type(AirportType.INTERNATIONAL).build(),
                
                // SG
                Airport.builder().name("Singapore Changi Airport").iataCode("SIN").icaoCode("WSSS").city("Singapore").countryIso("SG").latitude(1.3644).longitude(103.9915).timezone("GMT+8").type(AirportType.INTERNATIONAL).build(),
                
                // AU
                Airport.builder().name("Sydney Kingsford Smith Airport").iataCode("SYD").icaoCode("YSSY").city("Sydney").countryIso("AU").latitude(-33.9461).longitude(151.1772).timezone("GMT+10").type(AirportType.INTERNATIONAL).build(),
                
                // DE
                Airport.builder().name("Frankfurt Airport").iataCode("FRA").icaoCode("EDDF").city("Frankfurt").countryIso("DE").latitude(50.0379).longitude(8.5622).timezone("GMT+1").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Munich Airport").iataCode("MUC").icaoCode("EDDM").city("Munich").countryIso("DE").latitude(48.3538).longitude(11.7861).timezone("GMT+1").type(AirportType.INTERNATIONAL).build(),
                
                // CN
                Airport.builder().name("Beijing Capital International Airport").iataCode("PEK").icaoCode("ZBAA").city("Beijing").countryIso("CN").latitude(40.0801).longitude(116.5846).timezone("GMT+8").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Shanghai Pudong International Airport").iataCode("PVG").icaoCode("ZSPD").city("Shanghai").countryIso("CN").latitude(31.1443).longitude(121.8083).timezone("GMT+8").type(AirportType.INTERNATIONAL).build(),
                
                // IN
                Airport.builder().name("Indira Gandhi International Airport").iataCode("DEL").icaoCode("VIDP").city("Delhi").countryIso("IN").latitude(28.5687).longitude(77.1060).timezone("GMT+5.5").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Chhatrapati Shivaji Maharaj International Airport").iataCode("BOM").icaoCode("VABB").city("Mumbai").countryIso("IN").latitude(19.0896).longitude(72.8656).timezone("GMT+5.5").type(AirportType.INTERNATIONAL).build(),
                
                // KR
                Airport.builder().name("Seoul Incheon International Airport").iataCode("ICN").icaoCode("RKSI").city("Seoul").countryIso("KR").latitude(37.4602).longitude(126.4407).timezone("GMT+9").type(AirportType.INTERNATIONAL).build(),
                
                // SA
                Airport.builder().name("King Abdulaziz International Airport").iataCode("JED").icaoCode("OEJN").city("Jeddah").countryIso("SA").latitude(21.6796).longitude(39.1565).timezone("GMT+3").type(AirportType.INTERNATIONAL).build(),
                
                // CA
                Airport.builder().name("Toronto Pearson International Airport").iataCode("YYZ").icaoCode("CYYZ").city("Toronto").countryIso("CA").latitude(43.6777).longitude(-79.6248).timezone("GMT-5").type(AirportType.INTERNATIONAL).build(),
                Airport.builder().name("Vancouver International Airport").iataCode("YVR").icaoCode("CYVR").city("Vancouver").countryIso("CA").latitude(49.1967).longitude(-123.1815).timezone("GMT-8").type(AirportType.INTERNATIONAL).build(),
                
                // BR
                Airport.builder().name("São Paulo/Guarulhos International Airport").iataCode("GRU").icaoCode("SBGR").city("São Paulo").countryIso("BR").latitude(-23.4356).longitude(-46.4731).timezone("GMT-3").type(AirportType.INTERNATIONAL).build(),
                
                // BD
                Airport.builder().name("Hazrat Shahjalal International Airport").iataCode("DAC").icaoCode("VGHS").city("Dhaka").countryIso("BD").latitude(23.8433).longitude(90.3978).timezone("GMT+6").type(AirportType.INTERNATIONAL).build()
        );
        airportRepository.saveAll(airports);
        System.out.println("Airports database seeded with " + airports.size() + " international and domestic hubs.");
    }

    private void seedAirlines() {
        List<Airline> airlines = Arrays.asList(
                Airline.builder().name("Japan Airlines").iataCode("JL").countryIso("JP").build(),
                Airline.builder().name("All Nippon Airways").iataCode("NH").countryIso("JP").build(),
                Airline.builder().name("United Airlines").iataCode("UA").countryIso("US").build(),
                Airline.builder().name("Delta Air Lines").iataCode("DL").countryIso("US").build(),
                Airline.builder().name("British Airways").iataCode("BA").countryIso("GB").build(),
                Airline.builder().name("Air France").iataCode("AF").countryIso("FR").build(),
                Airline.builder().name("Emirates").iataCode("EK").countryIso("AE").build(),
                Airline.builder().name("Singapore Airlines").iataCode("SQ").countryIso("SG").build(),
                Airline.builder().name("Qantas").iataCode("QF").countryIso("AU").build(),
                Airline.builder().name("Lufthansa").iataCode("LH").countryIso("DE").build(),
                Airline.builder().name("Air China").iataCode("CA").countryIso("CN").build(),
                Airline.builder().name("Air India").iataCode("AI").countryIso("IN").build(),
                Airline.builder().name("Korean Air").iataCode("KE").countryIso("KR").build(),
                Airline.builder().name("Biman Bangladesh Airlines").iataCode("BG").countryIso("BD").build()
        );
        airlineRepository.saveAll(airlines);
        System.out.println("Airlines database seeded.");
    }

    private void seedFlights() {
        // Seed flights for all dates in June 2026 (from June 1st to June 30th)
        for (int day = 1; day <= 30; day++) {
            // Flight 1: HND -> CDG (Tokyo to Paris)
            LocalDateTime dep1 = LocalDateTime.of(2026, 6, day, 10, 0, 0);
            Flight flight1 = Flight.builder()
                    .flightNumber("JL04" + String.format("%02d", day))
                    .airline("Japan Airlines")
                    .origin("HND")
                    .destination("CDG")
                    .departureTime(dep1)
                    .arrivalTime(dep1.plusHours(12))
                    .economyPrice(BigDecimal.valueOf(850.00))
                    .businessPrice(BigDecimal.valueOf(2100.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 2: NRT -> JFK (Tokyo to New York)
            LocalDateTime dep2 = LocalDateTime.of(2026, 6, day, 14, 30, 0);
            Flight flight2 = Flight.builder()
                    .flightNumber("NH10" + String.format("%02d", day))
                    .airline("All Nippon Airways")
                    .origin("NRT")
                    .destination("JFK")
                    .departureTime(dep2)
                    .arrivalTime(dep2.plusHours(14))
                    .economyPrice(BigDecimal.valueOf(980.00))
                    .businessPrice(BigDecimal.valueOf(2450.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 3: HND -> ICN (Tokyo to Seoul)
            LocalDateTime dep3 = LocalDateTime.of(2026, 6, day, 8, 15, 0);
            Flight flight3 = Flight.builder()
                    .flightNumber("KE70" + String.format("%02d", day))
                    .airline("Korean Air")
                    .origin("HND")
                    .destination("ICN")
                    .departureTime(dep3)
                    .arrivalTime(dep3.plusHours(2))
                    .economyPrice(BigDecimal.valueOf(220.00))
                    .businessPrice(BigDecimal.valueOf(550.00))
                    .totalEconomySeats(120)
                    .totalBusinessSeats(20)
                    .availableEconomySeats(120)
                    .availableBusinessSeats(20)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 4: HND -> SIN (Tokyo to Singapore)
            LocalDateTime dep4 = LocalDateTime.of(2026, 6, day, 11, 45, 0);
            Flight flight4 = Flight.builder()
                    .flightNumber("SQ63" + String.format("%02d", day))
                    .airline("Singapore Airlines")
                    .origin("HND")
                    .destination("SIN")
                    .departureTime(dep4)
                    .arrivalTime(dep4.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(450.00))
                    .businessPrice(BigDecimal.valueOf(1150.00))
                    .totalEconomySeats(160)
                    .totalBusinessSeats(28)
                    .availableEconomySeats(160)
                    .availableBusinessSeats(28)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 5: HND -> LHR (Tokyo to London)
            LocalDateTime dep5 = LocalDateTime.of(2026, 6, day, 9, 30, 0);
            Flight flight5 = Flight.builder()
                    .flightNumber("BA00" + String.format("%02d", day))
                    .airline("British Airways")
                    .origin("HND")
                    .destination("LHR")
                    .departureTime(dep5)
                    .arrivalTime(dep5.plusHours(12))
                    .economyPrice(BigDecimal.valueOf(890.00))
                    .businessPrice(BigDecimal.valueOf(2300.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 6: HND -> SYD (Tokyo to Sydney)
            LocalDateTime dep6 = LocalDateTime.of(2026, 6, day, 20, 15, 0);
            Flight flight6 = Flight.builder()
                    .flightNumber("QF02" + String.format("%02d", day))
                    .airline("Qantas")
                    .origin("HND")
                    .destination("SYD")
                    .departureTime(dep6)
                    .arrivalTime(dep6.plusHours(9))
                    .economyPrice(BigDecimal.valueOf(680.00))
                    .businessPrice(BigDecimal.valueOf(1750.00))
                    .totalEconomySeats(140)
                    .totalBusinessSeats(25)
                    .availableEconomySeats(140)
                    .availableBusinessSeats(25)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 7: SFO -> HND (San Francisco to Tokyo)
            LocalDateTime dep7 = LocalDateTime.of(2026, 6, day, 18, 0, 0);
            Flight flight7 = Flight.builder()
                    .flightNumber("UA83" + String.format("%02d", day))
                    .airline("United Airlines")
                    .origin("SFO")
                    .destination("HND")
                    .departureTime(dep7)
                    .arrivalTime(dep7.plusHours(11))
                    .economyPrice(BigDecimal.valueOf(790.00))
                    .businessPrice(BigDecimal.valueOf(1950.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 8: DXB -> HND (Dubai to Tokyo)
            LocalDateTime dep8 = LocalDateTime.of(2026, 6, day, 2, 55, 0);
            Flight flight8 = Flight.builder()
                    .flightNumber("EK31" + String.format("%02d", day))
                    .airline("Emirates")
                    .origin("DXB")
                    .destination("HND")
                    .departureTime(dep8)
                    .arrivalTime(dep8.plusHours(10))
                    .economyPrice(BigDecimal.valueOf(900.00))
                    .businessPrice(BigDecimal.valueOf(2200.00))
                    .totalEconomySeats(200)
                    .totalBusinessSeats(40)
                    .availableEconomySeats(200)
                    .availableBusinessSeats(40)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 9: HND -> ITM (Tokyo Haneda to Osaka Itami - Domestic!)
            LocalDateTime dep9 = LocalDateTime.of(2026, 6, day, 7, 0, 0);
            Flight flight9 = Flight.builder()
                    .flightNumber("JL10" + String.format("%02d", day))
                    .airline("Japan Airlines")
                    .origin("HND")
                    .destination("ITM")
                    .departureTime(dep9)
                    .arrivalTime(dep9.plusMinutes(70))
                    .economyPrice(BigDecimal.valueOf(110.00))
                    .businessPrice(BigDecimal.valueOf(220.00))
                    .totalEconomySeats(150)
                    .totalBusinessSeats(20)
                    .availableEconomySeats(150)
                    .availableBusinessSeats(20)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 10: HND -> CTS (Tokyo Haneda to Sapporo New Chitose - Domestic!)
            LocalDateTime dep10 = LocalDateTime.of(2026, 6, day, 13, 0, 0);
            Flight flight10 = Flight.builder()
                    .flightNumber("NH05" + String.format("%02d", day))
                    .airline("All Nippon Airways")
                    .origin("HND")
                    .destination("CTS")
                    .departureTime(dep10)
                    .arrivalTime(dep10.plusMinutes(90))
                    .economyPrice(BigDecimal.valueOf(130.00))
                    .businessPrice(BigDecimal.valueOf(260.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 11: HND -> DAC (Tokyo to Dhaka)
            LocalDateTime dep11 = LocalDateTime.of(2026, 6, day, 16, 30, 0);
            Flight flight11 = Flight.builder()
                    .flightNumber("BG363" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("HND")
                    .destination("DAC")
                    .departureTime(dep11)
                    .arrivalTime(dep11.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(520.00))
                    .businessPrice(BigDecimal.valueOf(1300.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 12: DAC -> HND (Dhaka to Tokyo)
            LocalDateTime dep12 = LocalDateTime.of(2026, 6, day, 23, 45, 0);
            Flight flight12 = Flight.builder()
                    .flightNumber("BG362" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("HND")
                    .departureTime(dep12)
                    .arrivalTime(dep12.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(540.00))
                    .businessPrice(BigDecimal.valueOf(1350.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 13: NRT -> DAC (Tokyo to Dhaka)
            LocalDateTime dep13 = LocalDateTime.of(2026, 6, day, 11, 0, 0);
            Flight flight13 = Flight.builder()
                    .flightNumber("BG361" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("NRT")
                    .destination("DAC")
                    .departureTime(dep13)
                    .arrivalTime(dep13.plusHours(7).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(510.00))
                    .businessPrice(BigDecimal.valueOf(1280.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            // Flight 14: DAC -> NRT (Dhaka to Tokyo)
            LocalDateTime dep14 = LocalDateTime.of(2026, 6, day, 20, 30, 0);
            Flight flight14 = Flight.builder()
                    .flightNumber("BG360" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("NRT")
                    .departureTime(dep14)
                    .arrivalTime(dep14.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(530.00))
                    .businessPrice(BigDecimal.valueOf(1320.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            flightRepository.saveAll(Arrays.asList(
                    flight1, flight2, flight3, flight4, flight5,
                    flight6, flight7, flight8, flight9, flight10,
                    flight11, flight12, flight13, flight14
            ));
        }
        System.out.println("Database seeded with mock flights for June 2026 across 14 dynamic routes (international and domestic).");
    }

    private void seedDhakaFlights() {
        for (int day = 1; day <= 30; day++) {
            LocalDateTime dep11 = LocalDateTime.of(2026, 6, day, 16, 30, 0);
            Flight flight11 = Flight.builder()
                    .flightNumber("BG363" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("HND")
                    .destination("DAC")
                    .departureTime(dep11)
                    .arrivalTime(dep11.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(520.00))
                    .businessPrice(BigDecimal.valueOf(1300.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime dep12 = LocalDateTime.of(2026, 6, day, 23, 45, 0);
            Flight flight12 = Flight.builder()
                    .flightNumber("BG362" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("HND")
                    .departureTime(dep12)
                    .arrivalTime(dep12.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(540.00))
                    .businessPrice(BigDecimal.valueOf(1350.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime dep13 = LocalDateTime.of(2026, 6, day, 11, 0, 0);
            Flight flight13 = Flight.builder()
                    .flightNumber("BG361" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("NRT")
                    .destination("DAC")
                    .departureTime(dep13)
                    .arrivalTime(dep13.plusHours(7).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(510.00))
                    .businessPrice(BigDecimal.valueOf(1280.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            LocalDateTime dep14 = LocalDateTime.of(2026, 6, day, 20, 30, 0);
            Flight flight14 = Flight.builder()
                    .flightNumber("BG360" + String.format("%02d", day))
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("NRT")
                    .departureTime(dep14)
                    .arrivalTime(dep14.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(530.00))
                    .businessPrice(BigDecimal.valueOf(1320.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build();

            flightRepository.saveAll(Arrays.asList(flight11, flight12, flight13, flight14));
        }
        System.out.println("Seeded Dhaka flights successfully.");
    }
}
