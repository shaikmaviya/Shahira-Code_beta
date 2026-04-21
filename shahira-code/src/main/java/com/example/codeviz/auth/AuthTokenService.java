package com.example.codeviz.auth;

import org.springframework.stereotype.Service;

@Service
public class AuthTokenService {

    private final SessionTokenRepository sessionTokenRepository;

    public AuthTokenService(SessionTokenRepository sessionTokenRepository) {
        this.sessionTokenRepository = sessionTokenRepository;
    }

    public UserEntity requireUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        return sessionTokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token."))
            .getUser();
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Missing Authorization header.");
        }

        if (!authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header must use Bearer token.");
        }

        String token = authorizationHeader.substring(7).trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Bearer token is empty.");
        }

        return token;
    }
}
