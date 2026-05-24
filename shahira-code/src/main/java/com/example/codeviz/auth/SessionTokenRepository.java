package com.example.codeviz.auth;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SessionTokenRepository extends MongoRepository<SessionTokenEntity, String> {
    Optional<SessionTokenEntity> findByToken(String token);

    void deleteByToken(String token);
}
