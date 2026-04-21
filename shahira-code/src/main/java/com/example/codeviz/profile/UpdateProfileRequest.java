package com.example.codeviz.profile;

public record UpdateProfileRequest(
    String name,
    String avatarUrl,
    String bio
) {
}
