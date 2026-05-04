package com.example.codeviz.profile;

public record UserProfileDto(
    String name,
    String email,
    String avatarUrl,
    String bio,
    String activePlan
) {
}
