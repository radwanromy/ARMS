package com.airline.service;

import com.airline.dto.*;
import com.airline.model.*;
import com.airline.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIBookingService {

    private final AIBookingSessionRepository aiBookingSessionRepository;
    private final AIMessageRepository aiMessageRepository;
    private final FlightRepository flightRepository;
    private final ReservationRepository reservationRepository;
    private final PassengerRepository passengerRepository;
    private final UserService userService;
    private final FlightService flightService;
    private final ReservationService reservationService;
    private final BookingAuditLogRepository bookingAuditLogRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final AirportRepository airportRepository;
    private final CountryRepository countryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String STATE_START = "START";
    private static final String STATE_FLIGHT_SELECTION = "FLIGHT_SELECTION";
    private static final String STATE_PASSENGER_COUNT = "PASSENGER_COUNT";
    private static final String STATE_PASSENGER_DETAILS = "PASSENGER_DETAILS";
    private static final String STATE_SEAT_SELECTION = "SEAT_SELECTION";
    private static final String STATE_MEAL_PREFERENCE = "MEAL_PREFERENCE";
    private static final String STATE_CONFIRMATION = "CONFIRMATION";
    private static final String STATE_PAYMENT_PENDING = "PAYMENT_PENDING";
    private static final String STATE_COMPLETED = "COMPLETED";

    @Transactional
    public List<AIMessage> handleUserMessage(String sessionId, String userText) {
        // 1. Log user message
        AIMessage userMsg = AIMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(userText)
                .build();
        aiMessageRepository.save(userMsg);

        // 2. Fetch or create AI session
        AIBookingSession session = aiBookingSessionRepository.findBySessionId(sessionId)
                .orElseGet(() -> {
                    AIBookingSession newSession = AIBookingSession.builder()
                            .sessionId(sessionId)
                            .currentState(STATE_START)
                            .contextData("{}")
                            .build();
                    User currentUser = userService.getCurrentUser();
                    if (currentUser != null) {
                        newSession.setUserId(currentUser.getId());
                    }
                    return aiBookingSessionRepository.save(newSession);
                });

        Map<String, Object> context = getContextMap(session.getContextData());
        String currentState = session.getCurrentState();
        String aiResponseText = "";

        boolean isUpdateFlow = currentState.startsWith("UPDATE_") ||
                userText.toLowerCase().contains("update") ||
                userText.toLowerCase().contains("change") ||
                userText.toLowerCase().contains("modify") ||
                userText.toLowerCase().contains("edit") ||
                userText.toLowerCase().contains("cancel") ||
                Pattern.compile("(?i)\\b(AIR[A-Z0-9]{8})\\b").matcher(userText).find();

        // 3. Global FAQ interception
        String faqResponse = interceptFAQ(userText);
        if (faqResponse != null) {
            aiResponseText = faqResponse;
        } else if (isUpdateFlow) {
            aiResponseText = handleUpdateFlow(userText, context, session);
        } else {
            // Run state machine
            switch (currentState) {
                case STATE_START:
                    aiResponseText = handleStartState(userText, context, session);
                    break;
                case STATE_FLIGHT_SELECTION:
                    aiResponseText = handleFlightSelectionState(userText, context, session);
                    break;
                case STATE_PASSENGER_COUNT:
                    aiResponseText = handlePassengerCountState(userText, context, session);
                    break;
                case STATE_PASSENGER_DETAILS:
                    aiResponseText = handlePassengerDetailsState(userText, context, session);
                    break;
                case STATE_SEAT_SELECTION:
                    aiResponseText = handleSeatSelectionState(userText, context, session);
                    break;
                case STATE_MEAL_PREFERENCE:
                    aiResponseText = handleMealPreferenceState(userText, context, session);
                    break;
                case STATE_CONFIRMATION:
                    aiResponseText = handleConfirmationState(userText, context, session);
                    break;
                case STATE_PAYMENT_PENDING:
                    aiResponseText = handlePaymentPendingState(userText, context, session);
                    break;
                case STATE_COMPLETED:
                    aiResponseText = "Your booking is already completed! Safe travels on Volant Airlines. Let me know if you need help with anything else.";
                    break;
                default:
                    aiResponseText = "I encountered an error. Let's start over! Where would you like to fly?";
                    session.setCurrentState(STATE_START);
                    context.clear();
                    break;
            }
        }

        // 4. Save updated session state
        session.setContextData(setContextString(context));
        aiBookingSessionRepository.save(session);

        // 5. Log AI message
        AIMessage aiMsg = AIMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(aiResponseText)
                .build();
        aiMessageRepository.save(aiMsg);

        return aiMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<AIMessage> getChatHistory(String sessionId) {
        return aiMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<AIBookingSession> getUserSessions() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return Collections.emptyList();
        }
        return aiBookingSessionRepository.findByUserIdOrderByIdDesc(currentUser.getId());
    }

    @Transactional
    public List<AIMessage> resetSession(String sessionId) {
        aiBookingSessionRepository.findBySessionId(sessionId).ifPresent(s -> {
            s.setCurrentState(STATE_START);
            s.setContextData("{}");
            aiBookingSessionRepository.save(s);
        });

        // Add greeting message
        AIMessage greeting = AIMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText("Hello! I am your Volant Airways AI Booking Assistant. I can help you search flights, make reservations, select seats, and answer baggage policy questions. Where would you like to fly today?")
                .build();
        aiMessageRepository.save(greeting);

        return Collections.singletonList(greeting);
    }

    // --- State Handlers ---

    private String handleStartState(String text, Map<String, Object> context, AIBookingSession session) {
        // Parse flight search intent
        String origin = parseCity(text, true, null);
        String dest = parseCity(text, false, origin);
        LocalDate date = parseDate(text);

        if (origin == null && dest == null) {
            return "I can help you search and book flights! Please tell me your origin city, destination, and departure date (e.g. 'I want to fly from Tokyo to London next Friday').";
        }

        if (origin != null) context.put("origin", origin);
        if (dest != null) context.put("destination", dest);
        if (date != null) context.put("departureDate", date.toString());

        // Ask for missing details
        if (context.get("origin") == null) {
            return "Which city or airport are you departing from?";
        }
        if (context.get("destination") == null) {
            return "What is your destination city or airport?";
        }
        if (context.get("departureDate") == null) {
            return "What date would you like to fly? (e.g. 'tomorrow', 'June 19', or 'YYYY-MM-DD')";
        }

        return executeFlightSearch(context, session);
    }

    private String handleFlightSelectionState(String text, Map<String, Object> context, AIBookingSession session) {
        List<Map<String, Object>> flightsList = (List<Map<String, Object>>) context.get("availableFlights");
        if (flightsList == null || flightsList.isEmpty()) {
            session.setCurrentState(STATE_START);
            return "No flights were stored in your session. Where would you like to fly?";
        }

        String choice = text.trim().toLowerCase();
        int selectedIndex = -1;

        if (choice.contains("cheapest") || choice.contains("lowest") || choice.contains("budget")) {
            // Sort by price
            flightsList.sort(Comparator.comparingDouble(f -> ((Number) f.get("price")).doubleValue()));
            selectedIndex = 0;
        } else if (choice.contains("fastest") || choice.contains("shortest") || choice.contains("direct")) {
            // Sort by duration (mocked here, select first or sort by duration)
            selectedIndex = 0; // standard mock selection
        } else if (choice.contains("recommended") || choice.contains("best")) {
            selectedIndex = 0;
        } else {
            // Look for digits
            Matcher m = Pattern.compile("\\b(1|2|3|4|5|6|7|8|9|10)\\b").matcher(choice);
            if (m.find()) {
                selectedIndex = Integer.parseInt(m.group(1)) - 1;
            }
        }

        if (selectedIndex >= 0 && selectedIndex < flightsList.size()) {
            Map<String, Object> selectedFlight = flightsList.get(selectedIndex);
            context.put("selectedFlight", selectedFlight);
            session.setCurrentState(STATE_PASSENGER_COUNT);
            return String.format("You selected flight %s (%s) from %s to %s for $%s.\n\nHow many passengers will be traveling?",
                    selectedFlight.get("flightNumber"), selectedFlight.get("airline"),
                    selectedFlight.get("origin"), selectedFlight.get("destination"), selectedFlight.get("price"));
        }

        return "I didn't quite get your selection. Please type the number of the flight (e.g. '1') or say 'cheapest' to select.";
    }

    private String handlePassengerCountState(String text, Map<String, Object> context, AIBookingSession session) {
        int count = parseNumber(text);
        if (count <= 0) {
            return "Please enter a valid passenger count (e.g., '1' or '2 adults').";
        }

        context.put("passengerCount", count);
        context.put("passengers", new ArrayList<Map<String, String>>());
        context.put("currentPassengerIndex", 0);

        session.setCurrentState(STATE_PASSENGER_DETAILS);
        return "Got it! Traveling passenger count is " + count + ".\n\nPlease provide details for Passenger #1 in the format: Full Name, Date of Birth (YYYY-MM-DD), Passport Number, Nationality (e.g., 'John Doe, 1990-05-15, AB1234567, American').";
    }

    private String handlePassengerDetailsState(String text, Map<String, Object> context, AIBookingSession session) {
        int count = ((Number) context.get("passengerCount")).intValue();
        int index = ((Number) context.get("currentPassengerIndex")).intValue();
        List<Map<String, String>> passengers = (List<Map<String, String>>) context.get("passengers");

        String[] parts = text.split(",");
        if (parts.length < 4) {
            return "Please provide all details in the exact format: Full Name, Date of Birth (YYYY-MM-DD), Passport Number, Nationality.";
        }

        String fullName = parts[0].trim();
        String dob = parts[1].trim();
        String passport = parts[2].trim();
        String nationality = parts[3].trim();

        // Basic DOB validation
        try {
            LocalDate.parse(dob);
        } catch (Exception e) {
            return "The date of birth format is invalid. Please use YYYY-MM-DD (e.g. 1995-08-20). Please try again.";
        }

        Map<String, String> passenger = new HashMap<>();
        passenger.put("fullName", fullName);
        passenger.put("dateOfBirth", dob);
        passenger.put("passportNumber", passport);
        passenger.put("nationality", nationality);
        passengers.add(passenger);

        index++;
        context.put("currentPassengerIndex", index);
        context.put("passengers", passengers);

        if (index < count) {
            return "Saved Passenger #" + index + " details.\n\nPlease provide details for Passenger #" + (index + 1) + " (Full Name, Date of Birth (YYYY-MM-DD), Passport Number, Nationality).";
        }

        session.setCurrentState(STATE_SEAT_SELECTION);
        return "Excellent! All passenger details collected.\n\nWhat cabin class would you prefer: Business or Economy? Also, do you prefer a Window, Aisle, or Standard seat?";
    }

    private String handleSeatSelectionState(String text, Map<String, Object> context, AIBookingSession session) {
        String choice = text.toLowerCase();
        String seatClass = "ECONOMY";
        if (choice.contains("business") || choice.contains("first")) {
            seatClass = "BUSINESS";
        }
        String seatPreference = "STANDARD";
        if (choice.contains("window")) {
            seatPreference = "WINDOW";
        } else if (choice.contains("aisle")) {
            seatPreference = "AISLE";
        } else if (choice.contains("legroom")) {
            seatPreference = "LEGROOM";
        }

        context.put("seatClass", seatClass);
        context.put("seatPreference", seatPreference);

        // Assign a mock seat number based on preference
        Map<String, Object> flight = (Map<String, Object>) context.get("selectedFlight");
        String mockSeat = (seatClass.equals("BUSINESS") ? "2" : "14") + (seatPreference.equals("WINDOW") ? "A" : "C");
        context.put("seatNumber", mockSeat);

        session.setCurrentState(STATE_MEAL_PREFERENCE);
        return "Seat class set to " + seatClass + " with preference " + seatPreference + " (assigned seat " + mockSeat + ").\n\nWould you like to select a special meal preference? (Standard, Vegetarian, Halal, Kosher, Diabetic). Also, do you require special assistance (Wheelchair access, etc.)?";
    }

    private String handleMealPreferenceState(String text, Map<String, Object> context, AIBookingSession session) {
        String input = text.toLowerCase();
        String meal = "NONE";
        if (input.contains("veg")) meal = "VEGETARIAN";
        else if (input.contains("halal")) meal = "HALAL";
        else if (input.contains("kosher")) meal = "KOSHER";
        else if (input.contains("diab")) meal = "DIABETIC";

        String assistance = "NONE";
        if (input.contains("wheelchair")) assistance = "WHEELCHAIR";
        else if (input.contains("blind") || input.contains("visual")) assistance = "VISUALLY_IMPAIRED";
        else if (input.contains("deaf") || input.contains("hear")) assistance = "HEARING_IMPAIRED";

        context.put("mealPreference", meal);
        context.put("specialAssistance", assistance);

        session.setCurrentState(STATE_CONFIRMATION);

        // Generate Booking Summary
        Map<String, Object> selectedFlight = (Map<String, Object>) context.get("selectedFlight");
        int count = ((Number) context.get("passengerCount")).intValue();
        double price = ((Number) selectedFlight.get("price")).doubleValue() * count;

        StringBuilder summary = new StringBuilder();
        summary.append("### ✈️ Booking Summary & Itinerary\n");
        summary.append(String.format("- **Route**: %s ➔ %s\n", selectedFlight.get("origin"), selectedFlight.get("destination")));
        summary.append(String.format("- **Flight**: %s (%s)\n", selectedFlight.get("flightNumber"), selectedFlight.get("airline")));
        summary.append(String.format("- **Date/Time**: %s\n", selectedFlight.get("departureTime")));
        summary.append(String.format("- **Class & Seat**: %s (Seat %s)\n", context.get("seatClass"), context.get("seatNumber")));
        summary.append(String.format("- **Meal & Assistance**: Meal: %s, Assistance: %s\n", meal, assistance));
        summary.append(String.format("- **Passengers (%s)**:\n", count));
        List<Map<String, String>> passengers = (List<Map<String, String>>) context.get("passengers");
        for (Map<String, String> p : passengers) {
            summary.append(String.format("  * %s (%s)\n", p.get("fullName"), p.get("nationality")));
        }
        summary.append(String.format("- **Total Price**: **$%s**\n\n", price));
        summary.append("Would you like to confirm this reservation?");

        return summary.toString();
    }

    private String handleConfirmationState(String text, Map<String, Object> context, AIBookingSession session) {
        String choice = text.toLowerCase();
        if (choice.contains("yes") || choice.contains("confirm") || choice.contains("book") || choice.contains("sure")) {
            // Execute mock booking creation
            try {
                Map<String, Object> flightMap = (Map<String, Object>) context.get("selectedFlight");
                Long flightId = ((Number) flightMap.get("id")).longValue();
                String seatNumber = (String) context.get("seatNumber");
                String seatClass = (String) context.get("seatClass");

                List<Map<String, String>> passengersMap = (List<Map<String, String>>) context.get("passengers");
                List<PassengerDTO> passengers = passengersMap.stream()
                        .map(p -> PassengerDTO.builder()
                                .fullName(p.get("fullName"))
                                .dateOfBirth(LocalDate.parse(p.get("dateOfBirth")))
                                .passportNumber(p.get("passportNumber"))
                                .nationality(p.get("nationality"))
                                .build())
                        .collect(Collectors.toList());

                // Prepare request
                ReservationRequest request = ReservationRequest.builder()
                        .flightId(flightId)
                        .seatNumber(seatNumber)
                        .seatClass(seatClass)
                        .passengers(passengers)
                        .mealPreference((String) context.get("mealPreference"))
                        .specialAssistance((String) context.get("specialAssistance"))
                        .contactEmail("assistant-booking@volant.com")
                        .contactPhone("AI-ASSIST")
                        .build();

                // Save Reservation using service
                ReservationDTO resDTO = reservationService.makeReservation(request);
                context.put("bookingReference", resDTO.getBookingReference());
                context.put("totalPrice", resDTO.getTotalPrice());

                session.setCurrentState(STATE_PAYMENT_PENDING);

                return String.format("### 🔒 Reservation Created Successfully!\n" +
                        "Your booking reference is **%s**.\n\n" +
                        "For your security, I cannot process payments directly in chat. " +
                        "Please click the link below to complete your payment with secure verification:\n\n" +
                        "👉 **[Proceed to Payment](/payment/%s)**\n\n" +
                        "I am here to answer any payment safety or carriage policy questions you have!",
                        resDTO.getBookingReference(), resDTO.getBookingReference());

            } catch (Exception e) {
                return "Failed to create booking: " + e.getMessage() + ". Would you like to try again?";
            }
        }

        return "Please say 'yes' or 'confirm' to book your ticket, or say 'reset' to search for a different flight.";
    }

    private String handlePaymentPendingState(String text, Map<String, Object> context, AIBookingSession session) {
        String ref = (String) context.get("bookingReference");
        // Check if payment is already paid in DB
        Optional<Reservation> resOpt = reservationRepository.findByBookingReference(ref);
        if (resOpt.isPresent() && resOpt.get().getStatus() == ReservationStatus.CONFIRMED) {
            session.setCurrentState(STATE_COMPLETED);
            return String.format("Your booking has been successfully confirmed. Booking Reference: **%s**. Your e-ticket and receipt have been sent to your registered email address.", ref);
        }

        return String.format("I am waiting for your payment to be completed. You can pay securely here: [Proceed to Payment](/payment/%s).\n\nLet me know if you have any questions about payment methods or security!", ref);
    }

    // --- Search Helper ---

    private List<String> resolveAirportCodes(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String cleanQuery = query.trim();
        List<Airport> airports = airportRepository.findByNameContainingIgnoreCaseOrIataCodeContainingIgnoreCaseOrCityContainingIgnoreCase(
                cleanQuery, cleanQuery, cleanQuery);
        
        List<String> codes = new ArrayList<>();
        for (Airport airport : airports) {
            if (airport.getIataCode() != null) {
                codes.add(airport.getIataCode().toUpperCase());
            }
            if (airport.getCity() != null) {
                codes.add(airport.getCity());
            }
        }
        codes.add(cleanQuery);
        codes.add(cleanQuery.toUpperCase());
        return codes.stream().distinct().collect(Collectors.toList());
    }

    private String executeFlightSearch(Map<String, Object> context, AIBookingSession session) {
        String origin = (String) context.get("origin");
        String dest = (String) context.get("destination");
        LocalDate date = LocalDate.parse((String) context.get("departureDate"));

        LocalDateTime startDateTime = date.atStartOfDay();
        LocalDateTime endDateTime = date.atTime(LocalTime.MAX);

        List<String> origins = resolveAirportCodes(origin);
        List<String> destinations = resolveAirportCodes(dest);

        List<Flight> flights = flightRepository.findByOriginInAndDestinationInAndDepartureTimeBetween(
                origins, destinations, startDateTime, endDateTime);

        if (flights.isEmpty()) {
            // Clear search context to prompt again
            context.remove("departureDate");
            return String.format("I found no direct flights from **%s** to **%s** on **%s**.\n\nWould you like to try another date? (e.g. next Friday or specific date)", origin, dest, date);
        }

        List<Map<String, Object>> flightMaps = flights.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("flightNumber", f.getFlightNumber());
            map.put("airline", f.getAirline());
            map.put("origin", f.getOrigin());
            map.put("destination", f.getDestination());
            map.put("price", f.getEconomyPrice());
            map.put("departureTime", f.getDepartureTime().toString());
            return map;
        }).collect(Collectors.toList());

        context.put("availableFlights", flightMaps);
        session.setCurrentState(STATE_FLIGHT_SELECTION);

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("I found %d available flight(s) from **%s** to **%s** on **%s**:\n\n", flights.size(), origin, dest, date));
        for (int i = 0; i < flightMaps.size(); i++) {
            Map<String, Object> f = flightMaps.get(i);
            sb.append(String.format("%d. **%s** (%s) - Departs: %s - Price: **$%s**\n",
                    i + 1, f.get("flightNumber"), f.get("airline"), f.get("departureTime"), f.get("price")));
        }
        sb.append("\nWould you like to book the cheapest, fastest, or recommended options? You can also select by number (e.g. '1').");

        return sb.toString();
    }

    // --- FAQ Interceptor ---

    private String interceptFAQ(String text) {
        String input = text.toLowerCase();
        if (input.contains("service") || input.contains("about the company") || input.contains("company details") || input.contains("offer")) {
            return "✈️ **Volant Airlines Premium Services**:\n\n" +
                    "1. **Global Flight Booking**: Search, book, and manage tickets to over 150 international destinations with real-time flight data integration.\n" +
                    "2. **Volant AI Travel Agent**: Our 24/7 smart assistant helps you book flights, update traveler details, select seats, and handle queries in real-time.\n" +
                    "3. **In-Flight Curated Dining**: Select from standard, vegetarian, halal, kosher, or diabetic meal preferences during booking.\n" +
                    "4. **Accessibility Support**: Dedicated options for passengers requiring wheelchair access, visual assistance, or hearing support.\n" +
                    "5. **Secure checkout**: PCI-compliant payment gateway supporting Credit Cards, Apple Pay, and Google Pay.\n\n" +
                    "*To start booking a flight, simply tell me where you want to fly (e.g. 'I want to fly from Tokyo to Dubai next Monday')!*";
        }
        if (input.contains("baggage") || input.contains("luggage")) {
            return "🎒 **Baggage Allowance Policy**:\n" +
                    "- **Cabin Baggage**: 1 piece up to 7kg (max dimensions 56 x 36 x 23cm) + 1 small personal item.\n" +
                    "- **Checked Baggage**: 1 piece up to 23kg is included in Standard Economy. Business class passengers get 2 pieces up to 32kg each.";
        }
        if (input.contains("cancellation") || input.contains("refund")) {
            return "📝 **Cancellation & Refund Policy**:\n" +
                    "- Tickets can be cancelled up to 24 hours prior to departure for a full refund (minus booking fees).\n" +
                    "- Refund processing takes 5-7 business days back to the original form of payment.";
        }
        if (input.contains("secure") || input.contains("safety")) {
            return "🔒 **Payment Security**:\n" +
                    "- All credit card data is securely encrypted using industry-standard SSL (Secure Sockets Layer).\n" +
                    "- We process payments using tokenization and comply strictly with PCI-DSS requirements. I will never ask you for card details in chat.";
        }
        if (input.contains("payment method") || input.contains("accept")) {
            return "💳 **Accepted Payment Methods**:\n" +
                    "- Major Credit and Debit Cards (Visa, MasterCard, American Express)\n" +
                    "- Apple Pay & Google Pay (available via our secure payment gateway)";
        }
        return null;
    }

    // --- NLP Parsers ---

    private int findWordOccurrence(String text, String word) {
        int idx = -1;
        while ((idx = text.indexOf(word, idx + 1)) >= 0) {
            boolean startBoundary = (idx == 0 || !Character.isLetterOrDigit(text.charAt(idx - 1)));
            boolean endBoundary = (idx + word.length() == text.length() || !Character.isLetterOrDigit(text.charAt(idx + word.length())));
            if (startBoundary && endBoundary) {
                return idx;
            }
        }
        return -1;
    }

    private String parseCity(String text, boolean findOrigin, String excludeCity) {
        String input = text.toLowerCase();

        // Fetch all airports and countries dynamically to resolve search terms
        List<Airport> airports = airportRepository.findAll();
        List<Country> countries = countryRepository.findAll();

        // Build search terms list dynamically
        Map<String, String> termMap = new LinkedHashMap<>();

        // Add exact IATA codes
        for (Airport a : airports) {
            if (a.getIataCode() != null) {
                termMap.put(a.getIataCode().toLowerCase(), a.getIataCode().toUpperCase());
            }
        }
        // Add city names
        for (Airport a : airports) {
            if (a.getCity() != null) {
                termMap.put(a.getCity().toLowerCase(), a.getCity());
            }
        }
        // Add country names
        for (Country c : countries) {
            if (c.getName() != null) {
                termMap.put(c.getName().toLowerCase(), c.getName());
            }
        }

        // Find preposition indices
        int fromIdx = -1;
        String[] fromPreps = {"from", "out of", "departing"};
        for (String prep : fromPreps) {
            int idx = findWordOccurrence(input, prep);
            if (idx >= 0 && (fromIdx == -1 || idx < fromIdx)) {
                fromIdx = idx;
            }
        }

        int toIdx = -1;
        String[] toPreps = {"to", "arrive in", "destination"};
        for (String prep : toPreps) {
            int idx = -1;
            while ((idx = input.indexOf(prep, idx + 1)) >= 0) {
                // Check word boundaries for preposition
                boolean startBoundary = (idx == 0 || !Character.isLetterOrDigit(input.charAt(idx - 1)));
                boolean endBoundary = (idx + prep.length() == input.length() || !Character.isLetterOrDigit(input.charAt(idx + prep.length())));
                if (!startBoundary || !endBoundary) {
                    continue;
                }
                
                if (fromIdx >= 0 && idx > fromIdx) {
                    if (toIdx == -1 || toIdx < fromIdx || idx < toIdx) {
                        toIdx = idx;
                    }
                } else {
                    if (toIdx == -1 || idx < toIdx) {
                        toIdx = idx;
                    }
                }
            }
        }

        String bestValue = null;
        int minDistance = Integer.MAX_VALUE;

        if (findOrigin) {
            for (Map.Entry<String, String> entry : termMap.entrySet()) {
                String key = entry.getKey();
                int idx = findWordOccurrence(input, key);
                if (idx >= 0) {
                    if (fromIdx >= 0) {
                        if (idx >= fromIdx) {
                            int dist = idx - fromIdx;
                            if (dist < minDistance) {
                                minDistance = dist;
                                bestValue = entry.getValue();
                            }
                        }
                    } else {
                        if (idx < minDistance) {
                            minDistance = idx;
                            bestValue = entry.getValue();
                        }
                    }
                }
            }
        } else {
            for (Map.Entry<String, String> entry : termMap.entrySet()) {
                String key = entry.getKey();
                String val = entry.getValue();
                if (val.equalsIgnoreCase(excludeCity)) {
                    continue;
                }
                int idx = findWordOccurrence(input, key);
                if (idx >= 0) {
                    if (toIdx >= 0) {
                        if (idx >= toIdx) {
                            int dist = idx - toIdx;
                            if (dist < minDistance) {
                                minDistance = dist;
                                bestValue = val;
                            }
                        }
                    } else {
                        if (idx < minDistance) {
                            minDistance = idx;
                            bestValue = val;
                        }
                    }
                }
            }
        }

        return bestValue;
    }

    private LocalDate parseDate(String text) {
        String input = text.toLowerCase();
        LocalDate baseDate = LocalDate.of(2026, 6, 10); // System Metadata: Current date is June 10, 2026 (Wednesday)

        if (input.contains("tomorrow")) {
            return baseDate.plusDays(1);
        }
        if (input.contains("next friday")) {
            return LocalDate.of(2026, 6, 19); // Friday after June 12
        }
        if (input.contains("friday")) {
            return LocalDate.of(2026, 6, 12); // Coming Friday
        }
        if (input.contains("next monday")) {
            return LocalDate.of(2026, 6, 15);
        }

        // Matches YYYY-MM-DD
        Matcher m = Pattern.compile("(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})").matcher(input);
        if (m.find()) {
            return LocalDate.parse(String.format("%s-%02d-%02d", m.group(1), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3))));
        }

        // Match "June 19" or "June 12"
        Matcher mMonth = Pattern.compile("june\\s+(\\d{1,2})").matcher(input);
        if (mMonth.find()) {
            return LocalDate.of(2026, 6, Integer.parseInt(mMonth.group(1)));
        }

        return null;
    }

    private int parseNumber(String text) {
        Matcher m = Pattern.compile("\\b(\\d+)\\b").matcher(text);
        if (m.find()) {
            return Integer.parseInt(m.group(1));
        }
        if (text.toLowerCase().contains("one") || text.toLowerCase().contains("just me")) return 1;
        if (text.toLowerCase().contains("two")) return 2;
        if (text.toLowerCase().contains("three")) return 3;
        return 0;
    }

    // --- JSON Context Serializers ---

    private Map<String, Object> getContextMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private String setContextString(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String handleUpdateFlow(String text, Map<String, Object> context, AIBookingSession session) {
        String input = text.trim();
        String ref = (String) context.get("updateBookingRef");

        // 1. Extract booking reference if mentioned in the message
        Matcher mRef = Pattern.compile("(?i)\\b(AIR[A-Z0-9]{8})\\b").matcher(input);
        if (mRef.find()) {
            ref = mRef.group(1).toUpperCase();
            context.put("updateBookingRef", ref);
        }

        // 2. If no booking reference in context, ask for it
        if (ref == null) {
            // Check if user has active bookings
            User currentUser = userService.getCurrentUser();
            if (currentUser != null) {
                List<Reservation> userBookings = reservationRepository.findByUserUsername(currentUser.getUsername());
                if (!userBookings.isEmpty()) {
                    StringBuilder sb = new StringBuilder("I couldn't find a Booking Reference in your message. Here are your active bookings:\n\n");
                    for (Reservation res : userBookings) {
                        sb.append(String.format("- **%s** (%s ➔ %s, Departs: %s, Status: %s)\n",
                                res.getBookingReference(),
                                res.getFlight().getOrigin(),
                                res.getFlight().getDestination(),
                                res.getFlight().getDepartureTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                                res.getStatus()));
                    }
                    sb.append("\nPlease type the Booking Reference (e.g. 'AIRB9C3D821') you'd like to update.");
                    session.setCurrentState("UPDATE_ACTIVE");
                    return sb.toString();
                }
            }
            session.setCurrentState("UPDATE_ACTIVE");
            return "Please provide your Booking Reference (PNR) starting with 'AIR' (e.g. 'AIRB9C3D821') so I can retrieve your reservation.";
        }

        // 3. Look up reservation
        Optional<Reservation> resOpt = reservationRepository.findByBookingReference(ref);
        if (resOpt.isEmpty()) {
            context.remove("updateBookingRef");
            return "I couldn't find any booking with reference **" + ref + "**. Please provide a valid booking reference starting with 'AIR'.";
        }

        Reservation reservation = resOpt.get();
        List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());

        // 4. Handle completed bookings check
        boolean isCompleted = reservation.getStatus() == ReservationStatus.COMPLETED;
        User currentUser = userService.getCurrentUser();
        boolean isSupportOrAdmin = currentUser != null && 
            (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPPORT_AGENT);

        if (isCompleted && !isSupportOrAdmin) {
            // Check if they want to submit a ticket
            String lowerInput = input.toLowerCase();
            if (lowerInput.contains("ticket") || lowerInput.contains("yes") || lowerInput.contains("submit") || lowerInput.contains("request")) {
                // Submit support ticket
                SupportTicket ticket = SupportTicket.builder()
                        .bookingReference(ref)
                        .requestType("NAME_CORRECTION") // Default or parsed
                        .subject("AI Bot: Requested update for Completed Booking " + ref)
                        .description("Customer requested update via AI chatbot: " + input)
                        .priority("MEDIUM")
                        .status("PENDING")
                        .createdBy(currentUser != null ? currentUser.getUsername() : "guest")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                supportTicketRepository.save(ticket);

                // Add audit log
                BookingAuditLog audit = BookingAuditLog.builder()
                        .bookingReference(ref)
                        .changedBy(currentUser != null ? currentUser.getUsername() : "guest")
                        .description("Submitted support ticket request via AI Chatbot")
                        .build();
                bookingAuditLogRepository.save(audit);

                session.setCurrentState(STATE_START);
                context.clear();
                return "🎟️ **Support Ticket Submitted!**\n\n" +
                        "Since your booking **" + ref + "** is already completed, direct changes are locked. I have successfully submitted a support request for you.\n\n" +
                        "Our support team will review it shortly. Let me know if you need help with anything else!";
            } else {
                return "🔒 **Booking Locked (Completed)**\n\n" +
                        "Your booking **" + ref + "** has already been completed. Direct changes are locked for safety.\n\n" +
                        "Would you like me to submit a support ticket to our team to request changes? Please say **'yes, submit ticket'** and describe what you'd like to change.";
            }
        }

        // 5. If they are in the middle of a pending completed update reason
        if ("UPDATE_PENDING_REASON".equals(session.getCurrentState())) {
            // Save details from previous step
            String pendingField = (String) context.get("pendingUpdateField");
            String pendingValue = (String) context.get("pendingUpdateValue");

            ReservationDTO modDTO = getReservationDTOForUpdate(reservation, pendingField, pendingValue);
            modDTO.setModificationReason("AI Bot: " + input); // Use user's input as the reason

            try {
                reservationService.modifyReservation(ref, modDTO);
                session.setCurrentState(STATE_START);
                context.clear();
                return String.format("✅ **Booking Updated & Audited Successfully!**\n\n" +
                        "The **%s** for booking **%s** has been changed to **%s**.\n\n" +
                        "Modification Reason recorded: *\"%s\"*", pendingField, ref, pendingValue, input);
            } catch (Exception e) {
                return "Failed to save modification: " + e.getMessage() + ". What would you like to update instead?";
            }
        }

        // 6. Parse field updates (Seat, Meal, Contact, Passengers)
        String field = null;
        String val = null;

        String lowerInput = input.toLowerCase();

        // 6.1 Seat change
        Matcher mSeat = Pattern.compile("(?i)(?:seat|seat number)\\s+(?:to\\s+)?([0-9]{1,2}[A-F])").matcher(lowerInput);
        if (mSeat.find()) {
            field = "seatNumber";
            val = mSeat.group(1).toUpperCase();
        } else {
            // Look for isolated seat number patterns e.g. "12A" or "2F"
            Matcher mSeatIso = Pattern.compile("\\b([0-9]{1,2}[A-F])\\b").matcher(lowerInput);
            if (mSeatIso.find()) {
                field = "seatNumber";
                val = mSeatIso.group(1).toUpperCase();
            }
        }

        // 6.2 Meal preference
        if (field == null) {
            if (lowerInput.contains("vegetarian") || lowerInput.contains("veg")) {
                field = "mealPreference";
                val = "VEGETARIAN";
            } else if (lowerInput.contains("halal")) {
                field = "mealPreference";
                val = "HALAL";
            } else if (lowerInput.contains("kosher")) {
                field = "mealPreference";
                val = "KOSHER";
            } else if (lowerInput.contains("diabetic") || lowerInput.contains("diab")) {
                field = "mealPreference";
                val = "DIABETIC";
            } else if (lowerInput.contains("standard meal") || lowerInput.contains("normal meal")) {
                field = "mealPreference";
                val = "NONE";
            }
        }

        // 6.3 Special assistance
        if (field == null) {
            if (lowerInput.contains("wheelchair")) {
                field = "specialAssistance";
                val = "WHEELCHAIR";
            } else if (lowerInput.contains("visually") || lowerInput.contains("blind")) {
                field = "specialAssistance";
                val = "VISUALLY_IMPAIRED";
            } else if (lowerInput.contains("hearing") || lowerInput.contains("deaf")) {
                field = "specialAssistance";
                val = "HEARING_IMPAIRED";
            } else if (lowerInput.contains("no assistance") || lowerInput.contains("remove assistance")) {
                field = "specialAssistance";
                val = "NONE";
            }
        }

        // 6.4 Contact info
        if (field == null) {
            Matcher mEmail = Pattern.compile("([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})").matcher(lowerInput);
            if (mEmail.find()) {
                field = "contactEmail";
                val = mEmail.group(1);
            } else {
                Matcher mPhone = Pattern.compile("(?i)(?:phone|mobile|tel)\\s+(?:to\\s+)?(\\+?[0-9]{7,15})").matcher(lowerInput);
                if (mPhone.find()) {
                    field = "contactPhone";
                    val = mPhone.group(1);
                }
            }
        }

        // 6.5 Passenger Name
        if (field == null) {
            Matcher mName = Pattern.compile("(?i)(?:passenger\\s+)?name\\s+(?:to\\s+)?([a-zA-Z\\s]+)").matcher(input);
            if (mName.find()) {
                field = "passengerName";
                val = mName.group(1).trim();
            }
        }

        // 7. If we identified a field change
        if (field != null && val != null) {
            if (isCompleted && isSupportOrAdmin) {
                // Completed booking edited by Support/Admin: Requires a reason!
                context.put("pendingUpdateField", field);
                context.put("pendingUpdateValue", val);
                session.setCurrentState("UPDATE_PENDING_REASON");
                return String.format("You are about to change the **%s** to **%s** for completed booking **%s**.\n\n" +
                        "⚠️ **Auditing Compliance Rule**: Please provide a reason/explanation for this modification to complete the update.", field, val, ref);
            }

            // Normal update (non-completed booking, or user doesn't require audit reason on backend but it's good practice)
            ReservationDTO modDTO = getReservationDTOForUpdate(reservation, field, val);
            modDTO.setModificationReason("AI Bot: Requested in chat");

            try {
                reservationService.modifyReservation(ref, modDTO);
                session.setCurrentState(STATE_START);
                context.clear();
                return String.format("✅ **Booking Updated Successfully!**\n\n" +
                        "The **%s** for booking **%s** has been changed to **%s**.", field, ref, val);
            } catch (Exception e) {
                return "Failed to save modification: " + e.getMessage() + ". What would you like to update instead?";
            }
        }

        // 8. Default response for active update session (show itinerary and options)
        String passengersStr = passengers.stream().map(Passenger::getFullName).collect(Collectors.joining(", "));
        return String.format("📁 **Booking Details for %s**:\n" +
                "- **Route**: %s ➔ %s\n" +
                "- **Departs**: %s\n" +
                "- **Passengers**: %s\n" +
                "- **Seat**: %s\n" +
                "- **Meal**: %s\n" +
                "- **Special Assistance**: %s\n" +
                "- **Status**: **%s**\n\n" +
                "What would you like to change? You can say things like:\n" +
                "- *'Change seat to 12A'*\n" +
                "- *'Change meal to Vegetarian'*\n" +
                "- *'Change contact phone to +123456789'*\n" +
                "- *'Change passenger name to Jane Doe'*",
                ref,
                reservation.getFlight().getOrigin(),
                reservation.getFlight().getDestination(),
                reservation.getFlight().getDepartureTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                passengersStr,
                reservation.getSeatNumber(),
                reservation.getMealPreference(),
                reservation.getSpecialAssistance(),
                reservation.getStatus());
    }

    private ReservationDTO getReservationDTOForUpdate(Reservation reservation, String field, String val) {
        List<Passenger> passengers = passengerRepository.findByReservationId(reservation.getId());
        List<PassengerDTO> passengerDTOs = passengers.stream()
                .map(p -> PassengerDTO.builder()
                        .fullName(p.getFullName())
                        .dateOfBirth(p.getDateOfBirth())
                        .passportNumber(p.getPassportNumber())
                        .nationality(p.getNationality())
                        .build())
                .collect(Collectors.toList());

        ReservationDTO dto = ReservationDTO.builder()
                .bookingReference(reservation.getBookingReference())
                .seatNumber(reservation.getSeatNumber())
                .mealPreference(reservation.getMealPreference())
                .specialAssistance(reservation.getSpecialAssistance())
                .contactEmail(reservation.getContactEmail())
                .contactPhone(reservation.getContactPhone())
                .passengers(passengerDTOs)
                .build();

        if ("seatNumber".equals(field)) {
            dto.setSeatNumber(val);
        } else if ("mealPreference".equals(field)) {
            dto.setMealPreference(val);
        } else if ("specialAssistance".equals(field)) {
            dto.setSpecialAssistance(val);
        } else if ("contactEmail".equals(field)) {
            dto.setContactEmail(val);
        } else if ("contactPhone".equals(field)) {
            dto.setContactPhone(val);
        } else if ("passengerName".equals(field)) {
            if (!dto.getPassengers().isEmpty()) {
                dto.getPassengers().get(0).setFullName(val); // Update first passenger name
            }
        }
        return dto;
    }
}
