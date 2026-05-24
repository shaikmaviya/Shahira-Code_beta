package com.example.codeviz.auth;

import org.springframework.stereotype.Service;

@Service
public class AuthTokenService {

    private final SessionTokenRepository sessionTokenRepository;
    private final UserRepository userRepository;

    public AuthTokenService(SessionTokenRepository sessionTokenRepository, UserRepository userRepository) {
        this.sessionTokenRepository = sessionTokenRepository;
        this.userRepository = userRepository;
    }

    public UserEntity requireUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);

        SessionTokenEntity sessionToken = sessionTokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token."));

        String userId = sessionToken.getUserId();
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired token.");
        }

        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token."));
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
