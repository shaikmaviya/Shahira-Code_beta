package com.example.codeviz.pricing;

public record PricingSignupRequest(
    String planName,
    Integer price,
    String currency
) {
}
