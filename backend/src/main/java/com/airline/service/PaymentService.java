package com.airline.service;

import com.airline.dto.PaymentRequest;
import com.airline.dto.PaymentResponse;
import com.airline.exception.ResourceNotFoundException;
import com.airline.model.*;
import com.airline.repository.PaymentRepository;
import com.airline.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        Reservation reservation = reservationRepository.findByBookingReference(request.getBookingReference())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with reference: " + request.getBookingReference()));

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            return PaymentResponse.builder()
                    .transactionId("ALREADY_PAID")
                    .status(PaymentStatus.COMPLETED)
                    .build();
        }

        String txnId = "TXN" + System.currentTimeMillis();
        boolean paymentSuccess = mockPaymentGateway(request);

        PaymentResponse response = new PaymentResponse();
        response.setTransactionId(txnId);

        if (paymentSuccess) {
            response.setStatus(PaymentStatus.COMPLETED);

            // Update Reservation Status
            reservation.setStatus(ReservationStatus.CONFIRMED);
            reservationRepository.save(reservation);

            // Save Payment Entity
            Payment payment = Payment.builder()
                    .reservationId(reservation.getId())
                    .amount(request.getAmount())
                    .paymentMethod(request.getPaymentMethod())
                    .paymentStatus(PaymentStatus.COMPLETED)
                    .transactionId(txnId)
                    .build();
            paymentRepository.save(payment);

            // Send Booking Confirmation Email
            notificationService.sendBookingConfirmation(reservation);
        } else {
            response.setStatus(PaymentStatus.FAILED);

            // Save Failed Payment Entity
            Payment payment = Payment.builder()
                    .reservationId(reservation.getId())
                    .amount(request.getAmount())
                    .paymentMethod(request.getPaymentMethod())
                    .paymentStatus(PaymentStatus.FAILED)
                    .transactionId(txnId)
                    .build();
            paymentRepository.save(payment);
        }

        return response;
    }

    private boolean mockPaymentGateway(PaymentRequest request) {
        // Custom testing behavior: if card number is "0000000000000000", fail payment
        if ("0000000000000000".equals(request.getCardNumber())) {
            return false;
        }
        // General: 95% success rate
        return Math.random() < 0.95;
    }
}
