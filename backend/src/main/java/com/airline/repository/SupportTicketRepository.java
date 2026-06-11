package com.airline.repository;

import com.airline.model.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByCreatedBy(String username);
    List<SupportTicket> findByBookingReference(String bookingReference);
    List<SupportTicket> findByStatus(String status);
    List<SupportTicket> findByAssignedAgent(String agentUsername);
}
