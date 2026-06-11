package com.airline.service;

import com.airline.model.Reservation;
import com.airline.model.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    public void sendBookingConfirmation(Reservation reservation) {
        String recipient = reservation.getUser().getEmail();
        String subject = "Booking Confirmation - " + reservation.getBookingReference();
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(recipient);
            helper.setSubject(subject);
            
            String htmlContent = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <style>" +
                "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }" +
                "    .email-container { max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: 0 auto; }" +
                "    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }" +
                "    .logo-text { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: -0.02em; }" +
                "    .logo-sub { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }" +
                "    .welcome-text { font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 20px; }" +
                "    .details-card { background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; }" +
                "    .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }" +
                "    .details-row:last-child { margin-bottom: 0; }" +
                "    .label { color: #64748b; }" +
                "    .val { font-weight: 600; color: #0f172a; text-align: right; }" +
                "    .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header'>" +
                "      <span class='logo-text'>Volant Airlines</span><br>" +
                "      <span class='logo-sub'>Signature Carriage Service</span>" +
                "    </div>" +
                "    <p class='welcome-text'>Dear %s,</p>" +
                "    <p class='welcome-text'>Thank you for booking with <strong>Volant Airlines</strong>. Your reservation has been successfully completed and payment has been processed. Below is your official booking confirmation summary.</p>" +
                "    <div class='details-card'>" +
                "      <div class='details-row'><span class='label'>Booking Reference</span><span class='val' style='color:#2563eb;'>%s</span></div>" +
                "      <div class='details-row'><span class='label'>Flight Number</span><span class='val'>%s</span></div>" +
                "      <div class='details-row'><span class='label'>Route</span><span class='val'>%s ➔ %s</span></div>" +
                "      <div class='details-row'><span class='label'>Departure Time</span><span class='val'>%s</span></div>" +
                "      <div class='details-row'><span class='label'>Seat Assigned</span><span class='val'>%s (%s Class)</span></div>" +
                "      <div class='details-row' style='border-top:1px solid #e2e8f0; padding-top:10px; margin-top:10px;'><span class='label' style='font-weight:bold;'>Total Paid</span><span class='val' style='color:#10b981; font-weight:bold;'>$%s</span></div>" +
                "    </div>" +
                "    <p class='welcome-text'>You can manage your booking, select meals, and download your Electronic Ticket Receipt at any time by logging into the customer dashboard.</p>" +
                "    <div class='footer'>" +
                "      This is an automated transaction confirmation email. Please do not reply directly to this message.<br>" +
                "      &copy; 2026 Volant Airlines. All rights reserved." +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>",
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
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("Booking confirmation HTML email successfully sent to {}", recipient);
        } catch (Exception e) {
            log.error("Failed to send booking confirmation HTML email to {}. Error: {}", recipient, e.getMessage());
        }
    }

    public void sendWelcomeEmail(User user) {
        String recipient = user.getEmail();
        String subject = "Welcome to Volant Airlines!";
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(recipient);
            helper.setSubject(subject);
            
            String htmlContent = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <style>" +
                "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }" +
                "    .email-container { max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: 0 auto; }" +
                "    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }" +
                "    .logo-text { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: -0.02em; }" +
                "    .logo-sub { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }" +
                "    .welcome-text { font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 20px; }" +
                "    .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header'>" +
                "      <span class='logo-text'>Volant Airlines</span><br>" +
                "      <span class='logo-sub'>Signature Carriage Service</span>" +
                "    </div>" +
                "    <p class='welcome-text'>Dear %s,</p>" +
                "    <p class='welcome-text'>Welcome to <strong>Volant Airlines</strong>! Your account has been successfully created.</p>" +
                "    <p class='welcome-text'>We are delighted to have you as part of our premium travel community. As a registered member, you can now search flights, select premium seats, manage reservation requests, and collect loyalty rewards.</p>" +
                "    <p class='welcome-text'>If you have any questions, feel free to reach out to our Customer Service team at any time.</p>" +
                "    <div class='footer'>" +
                "      This is an automated welcome email. Please do not reply directly to this message.<br>" +
                "      &copy; 2026 Volant Airlines. All rights reserved." +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>",
                user.getFirstName() != null ? user.getFirstName() : user.getUsername()
            );
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("Welcome HTML email successfully sent to {}", recipient);
        } catch (Exception e) {
            log.error("Failed to send welcome HTML email to {}. Error: {}", recipient, e.getMessage());
        }
    }
}
