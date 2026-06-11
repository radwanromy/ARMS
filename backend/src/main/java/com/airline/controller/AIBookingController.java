package com.airline.controller;

import com.airline.model.AIMessage;
import com.airline.model.AIBookingSession;
import com.airline.service.AIBookingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ai/chat")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class AIBookingController {

    private final AIBookingService aiBookingService;

    @GetMapping("/sessions")
    public ResponseEntity<List<AIBookingSession>> getUserSessions() {
        List<AIBookingSession> sessions = aiBookingService.getUserSessions();
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/message")
    public ResponseEntity<List<AIMessage>> handleChatMessage(@RequestBody ChatRequest request) {
        List<AIMessage> response = aiBookingService.handleUserMessage(request.getSessionId(), request.getMessageText());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<AIMessage>> getChatHistory(@PathVariable String sessionId) {
        List<AIMessage> history = aiBookingService.getChatHistory(sessionId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/reset")
    public ResponseEntity<List<AIMessage>> resetSession(@RequestParam String sessionId) {
        List<AIMessage> response = aiBookingService.resetSession(sessionId);
        return ResponseEntity.ok(response);
    }

    @Data
    public static class ChatRequest {
        private String sessionId;
        private String messageText;
    }
}
