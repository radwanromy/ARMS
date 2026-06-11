package com.airline.repository;

import com.airline.model.AIMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AIMessageRepository extends JpaRepository<AIMessage, Long> {
    List<AIMessage> findBySessionIdOrderByTimestampAsc(String sessionId);
}
