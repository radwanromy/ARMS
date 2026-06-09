package com.airline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotBlank(message = "Seat number is required")
    private String seatNumber;

    @NotBlank(message = "Seat class is required")
    private String seatClass;

    private List<PassengerDTO> passengers;
}
