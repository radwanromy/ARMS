package com.airline.config;

import com.airline.model.ChatMessage;
import com.airline.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map to keep track of sessions grouped by booking reference
    private final Map<String, CopyOnWriteArrayList<WebSocketSession>> sessionsMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String bookingRef = getBookingReference(session);
        if (bookingRef != null) {
            sessionsMap.computeIfAbsent(bookingRef, k -> new CopyOnWriteArrayList<>()).add(session);
            log.info("WebSocket connection established for booking reference: {}. Session ID: {}", bookingRef, session.getId());
        } else {
            session.close(CloseStatus.BAD_DATA);
            log.warn("WebSocket connection rejected: No bookingReference query parameter provided.");
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received WebSocket message payload: {}", payload);

        try {
            // Parse payload into ChatMessage object
            ChatMessage chatMessage = objectMapper.readValue(payload, ChatMessage.class);
            chatMessage.setIsRead(false);
            
            // Save to database
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

            // Reserialize with database id and timestamps
            String jsonResponse = objectMapper.writeValueAsString(savedMessage);
            TextMessage textMessageResponse = new TextMessage(jsonResponse);

            // Broadcast message to all sessions linked to this booking reference
            String bookingRef = chatMessage.getBookingReference();
            CopyOnWriteArrayList<WebSocketSession> sessions = sessionsMap.get(bookingRef);
            if (sessions != null) {
                for (WebSocketSession s : sessions) {
                    if (s.isOpen()) {
                        s.sendMessage(textMessageResponse);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to process WebSocket text message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String bookingRef = getBookingReference(session);
        if (bookingRef != null) {
            CopyOnWriteArrayList<WebSocketSession> sessions = sessionsMap.get(bookingRef);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    sessionsMap.remove(bookingRef);
                }
            }
            log.info("WebSocket connection closed for booking reference: {}. Session ID: {}", bookingRef, session.getId());
        }
    }

    private String getBookingReference(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri != null && uri.getQuery() != null) {
                String[] params = uri.getQuery().split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && "bookingRef".equals(keyValue[0])) {
                        return keyValue[1];
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing bookingReference query parameter from URI", e);
        }
        return null;
    }
}
