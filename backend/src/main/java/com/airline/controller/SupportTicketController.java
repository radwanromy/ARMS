package com.airline.controller;

import com.airline.model.*;
import com.airline.repository.*;
import com.airline.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SupportTicketController {

    private final SupportTicketRepository supportTicketRepository;
    private final BookingAuditLogRepository bookingAuditLogRepository;
    private final ReservationRepository reservationRepository;
    private final UserService userService;

    // Create a new support ticket (User role)
    @PostMapping
    public ResponseEntity<SupportTicket> createTicket(@RequestBody SupportTicket ticket) {
        User user = userService.getCurrentUser();
        ticket.setCreatedBy(user.getUsername());
        ticket.setStatus("PENDING");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        
        SupportTicket saved = supportTicketRepository.save(ticket);
        log.info("Support ticket created successfully by user {} for booking {}", user.getUsername(), ticket.getBookingReference());
        
        // Log to Change History Audit Log
        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingReference(ticket.getBookingReference())
                .changedBy(user.getUsername())
                .description("Submitted support ticket request: " + ticket.getSubject())
                .build();
        bookingAuditLogRepository.save(audit);

        return ResponseEntity.ok(saved);
    }

    // Get tickets created by the logged-in customer (User role)
    @GetMapping("/my")
    public ResponseEntity<List<SupportTicket>> getMyTickets() {
        User user = userService.getCurrentUser();
        List<SupportTicket> tickets = supportTicketRepository.findByCreatedBy(user.getUsername());
        return ResponseEntity.ok(tickets);
    }

    // Get all support tickets (SUPPORT_AGENT or ADMIN roles)
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        List<SupportTicket> tickets = supportTicketRepository.findAll();
        return ResponseEntity.ok(tickets);
    }

    // Assign ticket to an agent (SUPPORT_AGENT or ADMIN roles)
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<SupportTicket> assignTicket(@PathVariable Long id, @RequestParam String agentUsername) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        
        ticket.setAssignedAgent(agentUsername);
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        
        log.info("Ticket ID {} assigned to agent {}", id, agentUsername);
        return ResponseEntity.ok(saved);
    }

    // Update ticket status (Support Agent can escalate; Admin can Approve/Reject)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<SupportTicket> updateTicketStatus(@PathVariable Long id, @RequestParam String status) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        
        User currentUser = userService.getCurrentUser();
        
        // SUPPORT_AGENT can only escalate or edit details, but cannot directly Approve/Reject
        if (currentUser.getRole() == Role.SUPPORT_AGENT && ("APPROVED".equals(status) || "REJECTED".equals(status))) {
            return ResponseEntity.status(403).build(); // Only admins can approve or reject
        }

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        
        log.info("Ticket ID {} status updated to {} by user {}", id, status, currentUser.getUsername());

        // Log transaction to booking change history
        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingReference(ticket.getBookingReference())
                .changedBy(currentUser.getUsername())
                .description("Support ticket status changed to: " + status + " (" + ticket.getSubject() + ")")
                .build();
        bookingAuditLogRepository.save(audit);

        // If approved by admin, we could perform the reservation update logic, e.g. marking it as confirmed
        if ("APPROVED".equals(status)) {
            reservationRepository.findByBookingReference(ticket.getBookingReference()).ifPresent(res -> {
                // If it was a refund request, we can set reservation status to CANCELLED
                if ("REFUND_REQUEST".equals(ticket.getRequestType())) {
                    res.setStatus(ReservationStatus.CANCELLED);
                    reservationRepository.save(res);
                    
                    BookingAuditLog resAudit = BookingAuditLog.builder()
                            .bookingReference(res.getBookingReference())
                            .changedBy(currentUser.getUsername())
                            .description("Reservation auto-cancelled as part of approved refund request.")
                            .build();
                    bookingAuditLogRepository.save(resAudit);
                }
            });
        }

        return ResponseEntity.ok(saved);
    }
}
