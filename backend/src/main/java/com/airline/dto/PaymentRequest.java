package com.airline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotBlank(message = "Booking reference is required")
    private String bookingReference;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private String cardNumber;
    private String cvv;
    private String expiryDate;
}
