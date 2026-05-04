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
import com.example.codeviz.auth.UserRepository;

@RestController
@RequestMapping("/api/pricing-signups")
public class PricingSignupController {

    private final AuthTokenService authTokenService;
    private final PricingSignupRepository pricingSignupRepository;
    private final UserRepository userRepository;

    public PricingSignupController(
        AuthTokenService authTokenService,
        PricingSignupRepository pricingSignupRepository,
        UserRepository userRepository
    ) {
        this.authTokenService = authTokenService;
        this.pricingSignupRepository = pricingSignupRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody PricingSignupRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            String activePlan = normalizePlan(request.planName());

            PricingSignupEntity entity = new PricingSignupEntity();
            entity.setUser(user);
            entity.setPlanName(activePlan);
            entity.setPrice(request.price() == null ? 0 : request.price());
            entity.setCurrency(normalize(request.currency(), "INR"));
            entity.setStatus("active");
            entity.setCreatedAt(LocalDateTime.now());

            user.setActivePlan(activePlan);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

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

    private String normalizePlan(String value) {
        String normalized = normalize(value, "free").toLowerCase();
        if (normalized.equals("simple")) {
            return "pro";
        }

        if (normalized.equals("advance")) {
            return "advanced";
        }

        if (!normalized.equals("free") && !normalized.equals("pro") && !normalized.equals("advanced")) {
            throw new IllegalArgumentException("Unknown plan selected.");
        }

        return normalized;
    }
}
