package com.example.codeviz.pricing;

import java.time.LocalDateTime;

public record PricingSignupResponse(
    String id,
    String planName,
    Integer price,
    String currency,
    String status,
    LocalDateTime createdAt
) {
}
