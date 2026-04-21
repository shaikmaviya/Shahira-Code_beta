package com.example.codeviz.profile;

public record UserProblemRequest(
    String problemId,
    String title,
    String topic,
    String level,
    String statement,
    String input,
    String output,
    String status
) {
}
