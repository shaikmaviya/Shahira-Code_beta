package com.example.codeviz.profile;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeviz.auth.ApiError;
import com.example.codeviz.auth.AuthTokenService;
import com.example.codeviz.auth.UserEntity;

@RestController
@RequestMapping("/api/editor-state")
public class UserEditorStateController {

    private final AuthTokenService authTokenService;
    private final UserEditorStateService editorStateService;

    public UserEditorStateController(AuthTokenService authTokenService, UserEditorStateService editorStateService) {
        this.authTokenService = authTokenService;
        this.editorStateService = editorStateService;
    }

    @GetMapping
    public ResponseEntity<?> getState(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            return ResponseEntity.ok(editorStateService.getState(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> upsertState(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody UserEditorStateRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            return ResponseEntity.ok(editorStateService.upsertState(user, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }
}
