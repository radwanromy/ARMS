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
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Locale;
import java.util.Currency;
import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;

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
        if (countryRepository.count() < 100 || countryRepository.findByIsoCodeIgnoreCase("BD").isEmpty()) {
            countryRepository.deleteAll();
            seedCountries();
        }
        if (airportRepository.count() < 1000 || airportRepository.findByIataCodeIgnoreCase("DAC").isEmpty()) {
            airportRepository.deleteAll();
            seedAirports();
        }
        if (airlineRepository.count() < 500 || airlineRepository.findByIataCodeIgnoreCase("BG").isEmpty()) {
            airlineRepository.deleteAll();
            seedAirlines();
        }
        if (flightRepository.count() < 100) {
            seedFlights();
        }
        long dacFlightCount = flightRepository.findAll().stream()
                .filter(f -> "DAC".equals(f.getOrigin()) || "DAC".equals(f.getDestination()))
                .count();
        if (dacFlightCount < 1000) {
            List<Flight> allFlights = flightRepository.findAll();
            List<Flight> dacFlights = new ArrayList<>();
            for (Flight f : allFlights) {
                if ("DAC".equals(f.getOrigin()) || "DAC".equals(f.getDestination())) {
                    dacFlights.add(f);
                }
            }
            flightRepository.deleteAll(dacFlights);
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
        System.out.println("Seeding countries from dataset...");
        List<Country> countriesToSave = new ArrayList<>();
        Set<String> addedIsos = new HashSet<>();
        Set<String> addedNames = new HashSet<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new org.springframework.core.io.ClassPathResource("data/countries.dat").getInputStream(),
                java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                List<String> fields = parseCsvLine(line);
                if (fields.size() < 2) continue;
                String name = fields.get(0);
                String iso = fields.get(1);

                if (iso == null || iso.isEmpty() || "N".equalsIgnoreCase(iso) || "\\N".equalsIgnoreCase(iso)) {
                    continue;
                }

                String normalizedName = normalizeCountryName(name);
                String normalizedIso = iso.trim().toUpperCase();

                if (addedIsos.contains(normalizedIso) || addedNames.contains(normalizedName)) {
                    continue;
                }

                String currency = getCurrencyForCountry(normalizedIso);
                String timezone = getTimezoneForCountry(normalizedIso);
                String flagEmoji = getFlagEmoji(normalizedIso);

                Country country = Country.builder()
                        .name(name.trim())
                        .isoCode(normalizedIso)
                        .currency(currency)
                        .timezone(timezone)
                        .flagEmoji(flagEmoji)
                        .build();

                countriesToSave.add(country);
                addedIsos.add(normalizedIso);
                addedNames.add(normalizedName);
            }
            countryRepository.saveAll(countriesToSave);
            System.out.println("Seeded " + countriesToSave.size() + " countries.");
        } catch (Exception e) {
            System.err.println("Error seeding countries: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void seedAirports() {
        System.out.println("Seeding airports from dataset...");
        List<Country> countries = countryRepository.findAll();
        Map<String, String> countryNameToIso = new HashMap<>();
        for (Country c : countries) {
            countryNameToIso.put(normalizeCountryName(c.getName()), c.getIsoCode());
        }

        List<Airport> airportsToSave = new ArrayList<>();
        Set<String> addedIatas = new HashSet<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new org.springframework.core.io.ClassPathResource("data/airports.dat").getInputStream(),
                java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                List<String> fields = parseCsvLine(line);
                if (fields.size() < 12) continue;

                String name = fields.get(1);
                String city = fields.get(2);
                String countryName = fields.get(3);
                String iata = fields.get(4);
                String icao = fields.get(5);
                String latStr = fields.get(6);
                String lonStr = fields.get(7);
                String tzOffset = fields.get(9);

                if (iata == null || iata.isEmpty() || "\\N".equalsIgnoreCase(iata) || iata.trim().length() != 3) {
                    continue;
                }

                String cleanIata = iata.trim().toUpperCase();
                if (addedIatas.contains(cleanIata)) {
                    continue;
                }

                double latitude;
                double longitude;
                try {
                    latitude = Double.parseDouble(latStr);
                    longitude = Double.parseDouble(lonStr);
                } catch (NumberFormatException e) {
                    continue;
                }

                String countryIso = resolveCountryIso(countryName, countryNameToIso);
                String flagEmoji = getFlagEmoji(countryIso);
                String timezone = formatTimezoneOffset(tzOffset);

                AirportType type = (name.toLowerCase().contains("intl") || name.toLowerCase().contains("international") || name.toLowerCase().contains("intercontinental"))
                        ? AirportType.INTERNATIONAL : AirportType.DOMESTIC;

                Airport airport = Airport.builder()
                        .name(name.trim())
                        .iataCode(cleanIata)
                        .icaoCode(icao == null ? "" : icao.trim())
                        .city(city == null ? "" : city.trim())
                        .countryIso(countryIso)
                        .countryName(countryName.trim())
                        .flagEmoji(flagEmoji)
                        .latitude(latitude)
                        .longitude(longitude)
                        .timezone(timezone)
                        .type(type)
                        .build();

                airportsToSave.add(airport);
                addedIatas.add(cleanIata);
            }
            airportRepository.saveAll(airportsToSave);
            System.out.println("Seeded " + airportsToSave.size() + " airports.");
        } catch (Exception e) {
            System.err.println("Error seeding airports: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void seedAirlines() {
        System.out.println("Seeding airlines from dataset...");
        List<Country> countries = countryRepository.findAll();
        Map<String, String> countryNameToIso = new HashMap<>();
        for (Country c : countries) {
            countryNameToIso.put(normalizeCountryName(c.getName()), c.getIsoCode());
        }

        List<Airline> airlinesToSave = new ArrayList<>();
        Set<String> addedIatas = new HashSet<>();
        Set<String> addedNames = new HashSet<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new org.springframework.core.io.ClassPathResource("data/airlines.dat").getInputStream(),
                java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                List<String> fields = parseCsvLine(line);
                if (fields.size() < 8) continue;

                String name = fields.get(1);
                String iata = fields.get(3);
                String countryName = fields.get(6);
                String active = fields.get(7);

                if (!"Y".equalsIgnoreCase(active)) {
                    continue;
                }

                if (iata == null || iata.isEmpty() || "\\N".equalsIgnoreCase(iata) || iata.trim().length() < 2) {
                    continue;
                }

                String cleanIata = iata.trim().toUpperCase();
                String cleanName = name.trim();
                String normalizedName = normalizeCountryName(cleanName);

                if (addedIatas.contains(cleanIata) || addedNames.contains(normalizedName)) {
                    continue;
                }

                String countryIso = resolveCountryIso(countryName, countryNameToIso);

                Airline airline = Airline.builder()
                        .name(cleanName)
                        .iataCode(cleanIata)
                        .countryIso(countryIso)
                        .build();

                airlinesToSave.add(airline);
                addedIatas.add(cleanIata);
                addedNames.add(normalizedName);
            }
            airlineRepository.saveAll(airlinesToSave);
            System.out.println("Seeded " + airlinesToSave.size() + " airlines.");
        } catch (Exception e) {
            System.err.println("Error seeding airlines: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        if (line == null || line.isEmpty()) {
            return result;
        }
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        result.add(sb.toString().trim());
        return result;
    }

    private String normalizeCountryName(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }

    private String resolveCountryIso(String countryName, Map<String, String> nameToIsoMap) {
        String normalized = normalizeCountryName(countryName);
        if (nameToIsoMap.containsKey(normalized)) {
            return nameToIsoMap.get(normalized);
        }
        if (normalized.contains("unitedstates") || normalized.equals("us")) return "US";
        if (normalized.contains("unitedkingdom") || normalized.equals("uk")) return "GB";
        if (normalized.contains("koreasouth") || normalized.contains("southkorea")) return "KR";
        if (normalized.contains("koreanorth") || normalized.contains("northkorea")) return "KP";
        if (normalized.contains("vietnam")) return "VN";
        if (normalized.contains("russia")) return "RU";
        if (normalized.contains("iran")) return "IR";
        if (normalized.contains("syria")) return "SY";
        if (normalized.contains("laos") || normalized.contains("laopeople")) return "LA";
        if (normalized.contains("moldova")) return "MD";
        if (normalized.contains("tanzania")) return "TZ";
        if (normalized.contains("venezuela")) return "VE";
        if (normalized.contains("taiwan")) return "TW";
        if (normalized.contains("macau") || normalized.contains("macao")) return "MO";
        if (normalized.contains("hongkong")) return "HK";
        if (normalized.contains("palestine")) return "PS";
        if (normalized.contains("bolivia")) return "BO";
        if (normalized.contains("brunei")) return "BN";
        if (normalized.contains("capeverde")) return "CV";
        if (normalized.contains("congodemocratic") || normalized.contains("demrepcongo") || normalized.equals("drc")) return "CD";
        if (normalized.contains("congo")) return "CG";
        if (normalized.contains("ivorycoast") || normalized.contains("cotedivoire")) return "CI";
        if (normalized.contains("falkland")) return "FK";
        if (normalized.contains("micronesia")) return "FM";
        if (normalized.contains("macedonia")) return "MK";
        if (normalized.contains("reunion")) return "RE";

        if (countryName != null && countryName.length() == 2) {
            return countryName.toUpperCase();
        }
        return "US";
    }

    private String getFlagEmoji(String countryCode) {
        if (countryCode == null || countryCode.length() != 2) {
            return "🏳️";
        }
        try {
            int firstLetter = Character.codePointAt(countryCode.toUpperCase(), 0) - 0x41 + 0x1F1E6;
            int secondLetter = Character.codePointAt(countryCode.toUpperCase(), 1) - 0x41 + 0x1F1E6;
            return new String(Character.toChars(firstLetter)) + new String(Character.toChars(secondLetter));
        } catch (Exception e) {
            return "🏳️";
        }
    }

    private String getTimezoneForCountry(String iso) {
        if (iso == null) return "GMT";
        switch (iso.toUpperCase()) {
            case "US": return "GMT-5";
            case "JP": return "GMT+9";
            case "GB": return "GMT+0";
            case "FR": return "GMT+1";
            case "DE": return "GMT+1";
            case "CN": return "GMT+8";
            case "IN": return "GMT+5.5";
            case "KR": return "GMT+9";
            case "SA": return "GMT+3";
            case "CA": return "GMT-5";
            case "BR": return "GMT-3";
            case "MX": return "GMT-6";
            case "TH": return "GMT+7";
            case "MY": return "GMT+8";
            case "ID": return "GMT+7";
            case "ES": return "GMT+1";
            case "IT": return "GMT+1";
            case "BD": return "GMT+6";
            case "AE": return "GMT+4";
            case "SG": return "GMT+8";
            case "AU": return "GMT+10";
            case "RU": return "GMT+3";
            case "CH": return "GMT+1";
            case "NL": return "GMT+1";
            case "NZ": return "GMT+12";
            case "ZA": return "GMT+2";
            case "TR": return "GMT+3";
            case "QA": return "GMT+3";
            case "HK": return "GMT+8";
            default: return "GMT";
        }
    }

    private String getCurrencyForCountry(String iso) {
        if (iso == null) return "USD";
        switch (iso.toUpperCase()) {
            case "US": return "USD";
            case "JP": return "JPY";
            case "GB": return "GBP";
            case "FR": case "DE": case "ES": case "IT": case "NL": case "BE": case "IE": case "FI": case "GR": case "PT": return "EUR";
            case "CN": return "CNY";
            case "IN": return "INR";
            case "KR": return "KRW";
            case "SA": return "SAR";
            case "CA": return "CAD";
            case "BR": return "BRL";
            case "MX": return "MXN";
            case "TH": return "THB";
            case "MY": return "MYR";
            case "ID": return "IDR";
            case "BD": return "BDT";
            case "AE": return "AED";
            case "SG": return "SGD";
            case "AU": return "AUD";
            case "NZ": return "NZD";
            case "RU": return "RUB";
            case "CH": return "CHF";
            case "ZA": return "ZAR";
            case "TR": return "TRY";
            case "QA": return "QAR";
            case "HK": return "HKD";
            default:
                try {
                    Locale locale = new Locale("", iso);
                    Currency currency = Currency.getInstance(locale);
                    return currency.getCurrencyCode();
                } catch (Exception e) {
                    return "USD";
                }
        }
    }

    private String formatTimezoneOffset(String offsetStr) {
        try {
            double offset = Double.parseDouble(offsetStr);
            if (offset == 0) {
                return "GMT+0";
            }
            String sign = offset > 0 ? "+" : "-";
            double absOffset = Math.abs(offset);
            int hours = (int) absOffset;
            int minutes = (int) ((absOffset - hours) * 60);
            if (minutes == 0) {
                return "GMT" + sign + hours;
            } else {
                return "GMT" + sign + hours + "." + (minutes == 30 ? "5" : String.format("%02d", minutes));
            }
        } catch (Exception e) {
            return "GMT+0";
        }
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
        System.out.println("Seeding 1000+ flights involving Dhaka (DAC)...");
        java.time.LocalDate startDate = java.time.LocalDate.of(2026, 6, 1);
        List<Flight> batch = new ArrayList<>();
        
        for (int i = 0; i < 180; i++) {
            java.time.LocalDate date = startDate.plusDays(i);
            int dateSuffix = (date.getMonthValue() * 100) + date.getDayOfMonth();
            
            // 1. HND <-> DAC (Biman Bangladesh: BG363/BG362)
            LocalDateTime depBG_HND_DAC = date.atTime(16, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG363" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("HND")
                    .destination("DAC")
                    .departureTime(depBG_HND_DAC)
                    .arrivalTime(depBG_HND_DAC.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(520.00))
                    .businessPrice(BigDecimal.valueOf(1300.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depBG_DAC_HND = date.atTime(23, 45, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG362" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("HND")
                    .departureTime(depBG_DAC_HND)
                    .arrivalTime(depBG_DAC_HND.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(540.00))
                    .businessPrice(BigDecimal.valueOf(1350.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 2. HND <-> DAC (Japan Airlines: JL707/JL708)
            LocalDateTime depJL_HND_DAC = date.atTime(9, 15, 0);
            batch.add(Flight.builder()
                    .flightNumber("JL707" + dateSuffix)
                    .airline("Japan Airlines")
                    .origin("HND")
                    .destination("DAC")
                    .departureTime(depJL_HND_DAC)
                    .arrivalTime(depJL_HND_DAC.plusHours(6).plusMinutes(45))
                    .economyPrice(BigDecimal.valueOf(680.00))
                    .businessPrice(BigDecimal.valueOf(1700.00))
                    .totalEconomySeats(200)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(200)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depJL_DAC_HND = date.atTime(18, 0, 0);
            batch.add(Flight.builder()
                    .flightNumber("JL708" + dateSuffix)
                    .airline("Japan Airlines")
                    .origin("DAC")
                    .destination("HND")
                    .departureTime(depJL_DAC_HND)
                    .arrivalTime(depJL_DAC_HND.plusHours(6).plusMinutes(45))
                    .economyPrice(BigDecimal.valueOf(710.00))
                    .businessPrice(BigDecimal.valueOf(1750.00))
                    .totalEconomySeats(200)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(200)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 3. NRT <-> DAC (Biman Bangladesh: BG361/BG360)
            LocalDateTime depBG_NRT_DAC = date.atTime(11, 0, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG361" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("NRT")
                    .destination("DAC")
                    .departureTime(depBG_NRT_DAC)
                    .arrivalTime(depBG_NRT_DAC.plusHours(7).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(510.00))
                    .businessPrice(BigDecimal.valueOf(1280.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depBG_DAC_NRT = date.atTime(20, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG360" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("NRT")
                    .departureTime(depBG_DAC_NRT)
                    .arrivalTime(depBG_DAC_NRT.plusHours(7))
                    .economyPrice(BigDecimal.valueOf(530.00))
                    .businessPrice(BigDecimal.valueOf(1320.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 4. DXB <-> DAC (Emirates: EK582/EK583)
            LocalDateTime depEK_DXB_DAC = date.atTime(8, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("EK582" + dateSuffix)
                    .airline("Emirates")
                    .origin("DXB")
                    .destination("DAC")
                    .departureTime(depEK_DXB_DAC)
                    .arrivalTime(depEK_DXB_DAC.plusHours(4).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(450.00))
                    .businessPrice(BigDecimal.valueOf(1150.00))
                    .totalEconomySeats(250)
                    .totalBusinessSeats(40)
                    .availableEconomySeats(250)
                    .availableBusinessSeats(40)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depEK_DAC_DXB = date.atTime(14, 0, 0);
            batch.add(Flight.builder()
                    .flightNumber("EK583" + dateSuffix)
                    .airline("Emirates")
                    .origin("DAC")
                    .destination("DXB")
                    .departureTime(depEK_DAC_DXB)
                    .arrivalTime(depEK_DAC_DXB.plusHours(4).plusMinutes(45))
                    .economyPrice(BigDecimal.valueOf(480.00))
                    .businessPrice(BigDecimal.valueOf(1200.00))
                    .totalEconomySeats(250)
                    .totalBusinessSeats(40)
                    .availableEconomySeats(250)
                    .availableBusinessSeats(40)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 5. LHR <-> DAC (Biman Bangladesh: BG202/BG201)
            LocalDateTime depBG_LHR_DAC = date.atTime(18, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG202" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("LHR")
                    .destination("DAC")
                    .departureTime(depBG_LHR_DAC)
                    .arrivalTime(depBG_LHR_DAC.plusHours(10))
                    .economyPrice(BigDecimal.valueOf(780.00))
                    .businessPrice(BigDecimal.valueOf(1950.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depBG_DAC_LHR = date.atTime(10, 15, 0);
            batch.add(Flight.builder()
                    .flightNumber("BG201" + dateSuffix)
                    .airline("Biman Bangladesh Airlines")
                    .origin("DAC")
                    .destination("LHR")
                    .departureTime(depBG_DAC_LHR)
                    .arrivalTime(depBG_DAC_LHR.plusHours(10).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(820.00))
                    .businessPrice(BigDecimal.valueOf(2000.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 6. SIN <-> DAC (Singapore Airlines: SQ446/SQ447)
            LocalDateTime depSQ_SIN_DAC = date.atTime(20, 35, 0);
            batch.add(Flight.builder()
                    .flightNumber("SQ446" + dateSuffix)
                    .airline("Singapore Airlines")
                    .origin("SIN")
                    .destination("DAC")
                    .departureTime(depSQ_SIN_DAC)
                    .arrivalTime(depSQ_SIN_DAC.plusHours(4).plusMinutes(10))
                    .economyPrice(BigDecimal.valueOf(390.00))
                    .businessPrice(BigDecimal.valueOf(980.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depSQ_DAC_SIN = date.atTime(23, 55, 0);
            batch.add(Flight.builder()
                    .flightNumber("SQ447" + dateSuffix)
                    .airline("Singapore Airlines")
                    .origin("DAC")
                    .destination("SIN")
                    .departureTime(depSQ_DAC_SIN)
                    .arrivalTime(depSQ_DAC_SIN.plusHours(4).plusMinutes(15))
                    .economyPrice(BigDecimal.valueOf(410.00))
                    .businessPrice(BigDecimal.valueOf(1020.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(24)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(24)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 7. KUL <-> DAC (Malaysia Airlines: MH196/MH197)
            LocalDateTime depMH_KUL_DAC = date.atTime(22, 10, 0);
            batch.add(Flight.builder()
                    .flightNumber("MH196" + dateSuffix)
                    .airline("Malaysia Airlines")
                    .origin("KUL")
                    .destination("DAC")
                    .departureTime(depMH_KUL_DAC)
                    .arrivalTime(depMH_KUL_DAC.plusHours(3).plusMinutes(50))
                    .economyPrice(BigDecimal.valueOf(280.00))
                    .businessPrice(BigDecimal.valueOf(700.00))
                    .totalEconomySeats(160)
                    .totalBusinessSeats(16)
                    .availableEconomySeats(160)
                    .availableBusinessSeats(16)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depMH_DAC_KUL = date.atTime(0, 40, 0);
            batch.add(Flight.builder()
                    .flightNumber("MH197" + dateSuffix)
                    .airline("Malaysia Airlines")
                    .origin("DAC")
                    .destination("KUL")
                    .departureTime(depMH_DAC_KUL)
                    .arrivalTime(depMH_DAC_KUL.plusHours(4))
                    .economyPrice(BigDecimal.valueOf(300.00))
                    .businessPrice(BigDecimal.valueOf(750.00))
                    .totalEconomySeats(160)
                    .totalBusinessSeats(16)
                    .availableEconomySeats(160)
                    .availableBusinessSeats(16)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 8. BKK <-> DAC (Thai Airways: TG321/TG322)
            LocalDateTime depTG_BKK_DAC = date.atTime(10, 35, 0);
            batch.add(Flight.builder()
                    .flightNumber("TG321" + dateSuffix)
                    .airline("Thai Airways")
                    .origin("BKK")
                    .destination("DAC")
                    .departureTime(depTG_BKK_DAC)
                    .arrivalTime(depTG_BKK_DAC.plusHours(2).plusMinutes(30))
                    .economyPrice(BigDecimal.valueOf(240.00))
                    .businessPrice(BigDecimal.valueOf(600.00))
                    .totalEconomySeats(200)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(200)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime depTG_DAC_BKK = date.atTime(13, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("TG322" + dateSuffix)
                    .airline("Thai Airways")
                    .origin("DAC")
                    .destination("BKK")
                    .departureTime(depTG_DAC_BKK)
                    .arrivalTime(depTG_DAC_BKK.plusHours(2).plusMinutes(25))
                    .economyPrice(BigDecimal.valueOf(260.00))
                    .businessPrice(BigDecimal.valueOf(650.00))
                    .totalEconomySeats(200)
                    .totalBusinessSeats(30)
                    .availableEconomySeats(200)
                    .availableBusinessSeats(30)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            // 9. CCU <-> DAC (IndiGo: 6E859/6E860)
            LocalDateTime dep6E_CCU_DAC = date.atTime(7, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("6E859" + dateSuffix)
                    .airline("IndiGo")
                    .origin("CCU")
                    .destination("DAC")
                    .departureTime(dep6E_CCU_DAC)
                    .arrivalTime(dep6E_CCU_DAC.plusHours(1))
                    .economyPrice(BigDecimal.valueOf(90.00))
                    .businessPrice(BigDecimal.valueOf(225.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(0)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(0)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            LocalDateTime dep6E_DAC_CCU = date.atTime(9, 30, 0);
            batch.add(Flight.builder()
                    .flightNumber("6E860" + dateSuffix)
                    .airline("IndiGo")
                    .origin("DAC")
                    .destination("CCU")
                    .departureTime(dep6E_DAC_CCU)
                    .arrivalTime(dep6E_DAC_CCU.plusHours(1))
                    .economyPrice(BigDecimal.valueOf(95.00))
                    .businessPrice(BigDecimal.valueOf(235.00))
                    .totalEconomySeats(180)
                    .totalBusinessSeats(0)
                    .availableEconomySeats(180)
                    .availableBusinessSeats(0)
                    .status(FlightStatus.SCHEDULED)
                    .build());

            if (batch.size() >= 500) {
                flightRepository.saveAll(batch);
                batch.clear();
            }
        }
        
        if (!batch.isEmpty()) {
            flightRepository.saveAll(batch);
        }
        System.out.println("Seeded Dhaka flights successfully.");
    }
}
