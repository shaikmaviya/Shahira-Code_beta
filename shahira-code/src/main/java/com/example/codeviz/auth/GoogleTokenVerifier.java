package com.example.codeviz.auth;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class GoogleTokenVerifier {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final String configuredClientId;

    public GoogleTokenVerifier(
        ObjectMapper objectMapper,
        @Value("${app.auth.google.client-id:${GOOGLE_CLIENT_ID:}}") String configuredClientId
    ) {
        this.objectMapper = objectMapper;
        this.configuredClientId = configuredClientId == null ? "" : configuredClientId.trim();
    }

    public GoogleProfile verify(String idToken) {
        String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken;

        HttpRequest request = HttpRequest.newBuilder(URI.create(url)).GET().build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Could not verify Google token.");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Could not verify Google token.");
        }

        if (response.statusCode() != 200) {
            throw new IllegalArgumentException("Invalid Google token.");
        }

        try {
            JsonNode payload = objectMapper.readTree(response.body());
            String email = readText(payload, "email");
            String name = readText(payload, "name");
            String audience = readText(payload, "aud");
            String emailVerified = readText(payload, "email_verified");

            if (!"true".equalsIgnoreCase(emailVerified)) {
                throw new IllegalArgumentException("Google email is not verified.");
            }

            if (!configuredClientId.isEmpty() && !configuredClientId.equals(audience)) {
                throw new IllegalArgumentException("Google token audience does not match application client ID.");
            }

            return new GoogleProfile(name, email);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid response from Google token verification.");
        }
    }

    private String readText(JsonNode node, String fieldName) {
        JsonNode valueNode = node.get(fieldName);
        if (valueNode == null || valueNode.isNull()) {
            return "";
        }
        return valueNode.asText("");
    }

    public record GoogleProfile(String name, String email) {
    }
}
