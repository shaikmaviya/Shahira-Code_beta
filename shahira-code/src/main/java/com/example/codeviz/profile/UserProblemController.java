package com.example.codeviz.profile;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeviz.auth.ApiError;
import com.example.codeviz.auth.AuthTokenService;
import com.example.codeviz.auth.UserEntity;

@RestController
@RequestMapping("/api/user-problems")
public class UserProblemController {

    private final AuthTokenService authTokenService;
    private final UserProblemService userProblemService;

    public UserProblemController(AuthTokenService authTokenService, UserProblemService userProblemService) {
        this.authTokenService = authTokenService;
        this.userProblemService = userProblemService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            List<UserProblemResponse> response = userProblemService.listSavedProblems(user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> save(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody UserProblemRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            return ResponseEntity.ok(userProblemService.saveProblem(user, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    @DeleteMapping("/{problemId}")
    public ResponseEntity<?> delete(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @PathVariable String problemId
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            userProblemService.deleteProblem(user, problemId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }
}
