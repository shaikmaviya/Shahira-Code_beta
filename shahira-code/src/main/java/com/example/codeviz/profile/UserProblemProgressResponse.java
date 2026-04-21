package com.example.codeviz.profile;

import java.time.LocalDateTime;

public record UserProblemProgressResponse(
    String problemId,
    String status,
    int attempts,
    LocalDateTime lastAttemptAt,
    LocalDateTime completedAt
) {
}
