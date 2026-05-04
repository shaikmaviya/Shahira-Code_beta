package com.example.codeviz.profile;

import java.time.LocalDateTime;

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
import com.example.codeviz.auth.UserRepository;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final AuthTokenService authTokenService;
    private final UserRepository userRepository;

    public UserProfileController(AuthTokenService authTokenService, UserRepository userRepository) {
        this.authTokenService = authTokenService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);
            return ResponseEntity.ok(toProfileDto(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestBody UpdateProfileRequest request
    ) {
        try {
            UserEntity user = authTokenService.requireUser(authorizationHeader);

            if (request.name() != null && !request.name().isBlank()) {
                user.setName(request.name().trim());
            }

            if (request.avatarUrl() != null) {
                user.setAvatarUrl(request.avatarUrl().trim());
            }

            if (request.bio() != null) {
                user.setBio(request.bio().trim());
            }

            user.setUpdatedAt(LocalDateTime.now());
            UserEntity savedUser = userRepository.save(user);
            return ResponseEntity.ok(toProfileDto(savedUser));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(ex.getMessage()));
        }
    }

    private UserProfileDto toProfileDto(UserEntity user) {
        String activePlan = user.getActivePlan() == null || user.getActivePlan().isBlank()
            ? "free"
            : user.getActivePlan().trim().toLowerCase();
        return new UserProfileDto(user.getName(), user.getEmail(), user.getAvatarUrl(), user.getBio(), activePlan);
    }
}
