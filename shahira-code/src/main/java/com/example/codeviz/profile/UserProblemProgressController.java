package com.example.codeviz.profile;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeviz.auth.ApiError;
import com.example.codeviz.auth.AuthTokenService;
import com.example.codeviz.auth.UserEntity;

@RestController
@RequestMapping("/api/user-progress")
public class UserProblemProgressController {

    private final AuthTokenService authTokenService;
    private final UserProblemProgressService progressService;

    public UserProblemProgressController(AuthTokenService authTokenService, UserProblemProgressService progressService) {
        this.authTokenService = authTokenService;
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            List<UserProblemProgressResponse> response = progressService.listProgress(user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> upsert(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody UserProblemProgressRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            return ResponseEntity.ok(progressService.upsertProgress(user, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }
}
