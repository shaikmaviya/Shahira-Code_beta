package com.example.codeviz.pricing;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeviz.auth.ApiError;
import com.example.codeviz.auth.AuthTokenService;
import com.example.codeviz.auth.UserEntity;

@RestController
@RequestMapping("/api/pricing-signups")
public class PricingSignupController {

    private final AuthTokenService authTokenService;
    private final PricingSignupRepository pricingSignupRepository;

    public PricingSignupController(
        AuthTokenService authTokenService,
        PricingSignupRepository pricingSignupRepository
    ) {
        this.authTokenService = authTokenService;
        this.pricingSignupRepository = pricingSignupRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PricingSignupRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);

            PricingSignupEntity entity = new PricingSignupEntity();
            entity.setUser(user);
            entity.setPlanName(normalize(request.planName(), "free"));
            entity.setPrice(request.price() == null ? 0 : request.price());
            entity.setCurrency(normalize(request.currency(), "INR"));
            entity.setStatus("requested");
            entity.setCreatedAt(LocalDateTime.now());

            PricingSignupEntity saved = pricingSignupRepository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    private PricingSignupResponse toResponse(PricingSignupEntity entity) {
        return new PricingSignupResponse(
            entity.getId(),
            entity.getPlanName(),
            entity.getPrice(),
            entity.getCurrency(),
            entity.getStatus(),
            entity.getCreatedAt()
        );
    }

    private String normalize(String value, String fallback) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isEmpty() ? fallback : normalized;
    }
}
