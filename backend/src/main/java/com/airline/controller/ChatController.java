package com.airline.controller;

import com.airline.model.ChatMessage;
import com.airline.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // WebSocket Endpoint: Client sends message to /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message) {
        log.info("Received WebSocket chat message for booking: {}", message.getBookingReference());
        
        // Save to Database
        ChatMessage saved = chatMessageRepository.save(message);

        // Broadcast to all clients listening on /topic/chat/{bookingRef}
        String destination = "/topic/chat/" + message.getBookingReference();
        messagingTemplate.convertAndSend(destination, saved);
        log.info("Broadcasted message to {}", destination);
    }

    // REST Endpoint: Retrieve chat history for a booking
    @GetMapping("/history/{bookingRef}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String bookingRef) {
        log.info("Fetching chat history for booking: {}", bookingRef);
        List<ChatMessage> history = chatMessageRepository.findByBookingReferenceOrderByTimestampAsc(bookingRef);
        return ResponseEntity.ok(history);
    }
}
