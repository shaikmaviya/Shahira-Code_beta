package com.example.codeviz.pricing;

import java.time.LocalDateTime;

public record PricingSignupResponse(
    Long id,
    String planName,
    int price,
    String currency,
    String status,
    LocalDateTime createdAt
) {
}
