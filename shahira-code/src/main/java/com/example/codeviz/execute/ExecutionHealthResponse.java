package com.example.codeviz.execute;

public record ExecutionHealthResponse(
    boolean pythonAvailable,
    boolean javaAvailable,
    String pythonDetail,
    String javaDetail
) {
}
