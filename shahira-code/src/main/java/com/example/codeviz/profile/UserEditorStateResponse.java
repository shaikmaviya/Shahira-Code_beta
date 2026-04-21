package com.example.codeviz.profile;

import java.time.LocalDateTime;

public record UserEditorStateResponse(
    String code,
    String logs,
    LocalDateTime updatedAt
) {
}
