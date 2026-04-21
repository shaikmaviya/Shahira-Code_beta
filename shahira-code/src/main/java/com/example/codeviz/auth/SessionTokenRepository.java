package com.example.codeviz.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionTokenRepository extends JpaRepository<SessionTokenEntity, Long> {
    Optional<SessionTokenEntity> findByToken(String token);

    void deleteByToken(String token);
}
