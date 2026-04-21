package com.example.codeviz.profile;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.codeviz.auth.UserEntity;

@Service
public class UserProblemProgressService {

    private final UserProblemProgressRepository progressRepository;

    public UserProblemProgressService(UserProblemProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    public List<UserProblemProgressResponse> listProgress(UserEntity user) {
        return progressRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public UserProblemProgressResponse upsertProgress(UserEntity user, UserProblemProgressRequest request) {
        UserProblemProgressEntity entity = progressRepository
            .findByUserIdAndProblemId(user.getId(), request.problemId())
            .orElseGet(UserProblemProgressEntity::new);

        LocalDateTime now = LocalDateTime.now();

        if (entity.getId() == null) {
            entity.setUser(user);
            entity.setProblemId(normalize(request.problemId()));
            entity.setAttempts(0);
        }

        if (request.status() != null && !request.status().isBlank()) {
            String status = request.status().trim().toLowerCase();
            entity.setStatus(status);
            if ("completed".equals(status)) {
                entity.setCompletedAt(now);
            }
        } else if (entity.getStatus() == null || entity.getStatus().isBlank()) {
            entity.setStatus("in_progress");
        }

        if (request.attempts() != null && request.attempts() >= 0) {
            entity.setAttempts(request.attempts());
        } else {
            entity.setAttempts(entity.getAttempts() + 1);
        }

        entity.setLastAttemptAt(now);
        entity.setUpdatedAt(now);

        return toResponse(progressRepository.save(entity));
    }

    private UserProblemProgressResponse toResponse(UserProblemProgressEntity entity) {
        return new UserProblemProgressResponse(
            entity.getProblemId(),
            entity.getStatus(),
            entity.getAttempts(),
            entity.getLastAttemptAt(),
            entity.getCompletedAt()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
