package com.airline.dto;

import com.airline.model.ReservationStatus;
import com.airline.model.SeatClass;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDTO {
    private Long id;
    private String bookingReference;
    private FlightDTO flight;
    private String seatNumber;
    private SeatClass seatClass;
    private BigDecimal totalPrice;
    private ReservationStatus status;
    private LocalDateTime bookingDate;
    private UserDTO user;
    private List<PassengerDTO> passengers;
    private String mealPreference;
    private String specialAssistance;
    private String contactEmail;
    private String contactPhone;
    private String modificationReason;
}
