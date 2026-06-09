package com.airline.service;

import com.airline.model.Reservation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    public void sendBookingConfirmation(Reservation reservation) {
        String recipient = reservation.getUser().getEmail();
        String subject = "Booking Confirmation - " + reservation.getBookingReference();
        String message = String.format(
                "Dear %s,\n\n" +
                "Thank you for booking with ARMS. Your reservation has been successfully confirmed!\n\n" +
                "Booking Details:\n" +
                "- Booking Reference: %s\n" +
                "- Flight Number: %s\n" +
                "- Route: %s -> %s\n" +
                "- Departure Time: %s\n" +
                "- Seat Number: %s (%s)\n" +
                "- Total Price Paid: $%s\n\n" +
                "You can manage your bookings at any time via the user portal.\n\n" +
                "Have a safe and pleasant journey!\n\n" +
                "Best Regards,\n" +
                "ARMS Customer Support Team",
                reservation.getUser().getFirstName(),
                reservation.getBookingReference(),
                reservation.getFlight().getFlightNumber(),
                reservation.getFlight().getOrigin(),
                reservation.getFlight().getDestination(),
                reservation.getFlight().getDepartureTime(),
                reservation.getSeatNumber(),
                reservation.getSeatClass(),
                reservation.getTotalPrice()
        );

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(recipient);
            email.setSubject(subject);
            email.setText(message);
            mailSender.send(email);
            log.info("Booking confirmation email successfully sent to {}", recipient);
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email to {}. Error: {}", recipient, e.getMessage());
            // Catch error silently to prevent transactional rollback of reservations
        }
    }
}
