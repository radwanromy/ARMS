package com.airline.repository;

import com.airline.model.AIBookingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AIBookingSessionRepository extends JpaRepository<AIBookingSession, Long> {
    Optional<AIBookingSession> findBySessionId(String sessionId);
    List<AIBookingSession> findByUserIdOrderByIdDesc(Long userId);
}
