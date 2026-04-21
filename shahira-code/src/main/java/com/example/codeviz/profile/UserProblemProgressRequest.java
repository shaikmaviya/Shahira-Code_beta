package com.example.codeviz.profile;

public record UserProblemProgressRequest(
    String problemId,
    String status,
    Integer attempts
) {
}
