package com.example.codeviz.auth;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GoogleTokenVerifier {

    private final String configuredClientId;
    private final ObjectMapper objectMapper;

    public GoogleTokenVerifier(
        @Value("${app.auth.google.client-id:${GOOGLE_CLIENT_ID:}}") String configuredClientId,
        ObjectMapper objectMapper
    ) {
        this.configuredClientId = configuredClientId == null ? "" : configuredClientId.trim();
        this.objectMapper = objectMapper;
    }

    public GoogleProfile verify(String idToken) {
        String token = idToken == null ? "" : idToken.trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Google ID token is required.");
        }

        try {
            String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
            URI uri = URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encoded);
            HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
            HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("Google ID token is invalid.");
            }

            Map<String, Object> payload = objectMapper.readValue(response.body(), new TypeReference<>() {
            });
            String email = asString(payload.get("email"));
            String name = asString(payload.get("name"));
            String aud = asString(payload.get("aud"));

            if (!configuredClientId.isBlank() && !configuredClientId.equals(aud)) {
                throw new IllegalArgumentException("Google client ID mismatch.");
            }

            return new GoogleProfile(name, email);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Unable to verify Google ID token.");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to verify Google ID token.");
        }
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    public record GoogleProfile(String name, String email) {
    }
}
