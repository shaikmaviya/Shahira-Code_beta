package com.example.codeviz.auth;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String PROVIDER_PASSWORD = "password";
    private static final String PROVIDER_GOOGLE = "google";

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final SessionTokenRepository sessionTokenRepository;
    private final GoogleTokenVerifier googleTokenVerifier;

    public AuthService(
        PasswordEncoder passwordEncoder,
        UserRepository userRepository,
        SessionTokenRepository sessionTokenRepository,
        GoogleTokenVerifier googleTokenVerifier
    ) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.sessionTokenRepository = sessionTokenRepository;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String name = normalize(request.name());
        String email = normalize(request.email()).toLowerCase();
        String password = request.password() == null ? "" : request.password().trim();

        if (name.isEmpty()) {
            throw new IllegalArgumentException("Name is required.");
        }

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }

        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Account already exists with this email.");
        }

        UserEntity user = new UserEntity();
        user.setName(name);
        user.setEmail(email);
        user.setProvider(PROVIDER_PASSWORD);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        UserEntity savedUser = userRepository.save(user);

        var sessionToken = buildToken(savedUser);
        SessionTokenEntity savedToken = saveToken(sessionToken);

        return new AuthResponse(savedToken.getToken(), toAuthUser(savedUser));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalize(request.email()).toLowerCase();
        String password = request.password() == null ? "" : request.password();

        if (email.isEmpty() || password.isBlank()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        UserEntity user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        var sessionToken = buildToken(user);
        SessionTokenEntity savedToken = saveToken(sessionToken);

        return new AuthResponse(savedToken.getToken(), toAuthUser(user));
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        String idToken = normalize(request.idToken());
        if (idToken.isEmpty()) {
            throw new IllegalArgumentException("Google ID token is required.");
        }

        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(idToken);
        if (profile.email().isBlank()) {
            throw new IllegalArgumentException("Google account email is required.");
        }

        String normalizedEmail = profile.email().trim().toLowerCase();
        String resolvedName = normalize(profile.name()).isEmpty() ? normalizedEmail : profile.name().trim();

        UserEntity user = userRepository.findByEmail(normalizedEmail)
            .orElseGet(() -> {
                UserEntity created = new UserEntity();
                created.setName(resolvedName);
                created.setEmail(normalizedEmail);
                created.setProvider(PROVIDER_GOOGLE);
                // Keep a non-empty hash to satisfy schema constraints for social-login users.
                created.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                created.setCreatedAt(LocalDateTime.now());
                created.setUpdatedAt(LocalDateTime.now());
                return userRepository.save(created);
            });

        if (!Objects.equals(user.getProvider(), PROVIDER_GOOGLE)) {
            user.setProvider(PROVIDER_GOOGLE);
            user.setName(resolvedName);
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        }

        var sessionToken = buildToken(user);
        SessionTokenEntity savedToken = saveToken(sessionToken);

        return new AuthResponse(savedToken.getToken(), toAuthUser(user));
    }

    public AuthUser me(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);

        SessionTokenEntity sessionToken = sessionTokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token."));

        return toAuthUser(sessionToken.getUser());
    }

    @Transactional
    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        sessionTokenRepository.deleteByToken(token);
    }

    private SessionTokenEntity buildToken(UserEntity user) {
        SessionTokenEntity sessionToken = new SessionTokenEntity();
        sessionToken.setToken(UUID.randomUUID().toString());
        sessionToken.setUser(user);
        sessionToken.setCreatedAt(LocalDateTime.now());
        return sessionToken;
    }

    @SuppressWarnings("null")
    private SessionTokenEntity saveToken(SessionTokenEntity sessionToken) {
        return Optional.ofNullable(sessionTokenRepository.save(sessionToken))
            .orElseThrow(() -> new IllegalStateException("Failed to create session token."));
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

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private AuthUser toAuthUser(UserEntity user) {
        return new AuthUser(user.getName(), user.getEmail(), normalizePlan(user.getActivePlan()));
    }

    private String normalizePlan(String value) {
        String normalized = normalize(value).toLowerCase();
        return normalized.isEmpty() ? "free" : normalized;
    }
}
