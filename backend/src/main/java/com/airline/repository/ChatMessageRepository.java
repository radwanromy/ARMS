package com.airline.repository;

import com.airline.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByBookingReferenceOrderByTimestampAsc(String bookingReference);
    List<ChatMessage> findBySupportTicketIdOrderByTimestampAsc(Long supportTicketId);
}
