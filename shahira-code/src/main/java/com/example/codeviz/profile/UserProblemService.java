package com.example.codeviz.profile;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.codeviz.auth.UserEntity;

@Service
public class UserProblemService {

    private final UserProblemRepository userProblemRepository;

    public UserProblemService(UserProblemRepository userProblemRepository) {
        this.userProblemRepository = userProblemRepository;
    }

    public List<UserProblemResponse> listSavedProblems(UserEntity user) {
        return userProblemRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public UserProblemResponse saveProblem(UserEntity user, UserProblemRequest request) {
        UserProblemEntity entity = userProblemRepository
            .findByUserIdAndProblemId(user.getId(), request.problemId())
            .orElseGet(UserProblemEntity::new);

        if (entity.getId() == null) {
            entity.setUser(user);
            entity.setProblemId(normalize(request.problemId()));
            entity.setSavedAt(LocalDateTime.now());
        }

        entity.setTitle(normalize(request.title()));
        entity.setTopic(normalize(request.topic()));
        entity.setLevel(normalize(request.level()));
        entity.setStatement(normalize(request.statement()));
        entity.setInput(normalize(request.input()));
        entity.setOutput(normalize(request.output()));
        entity.setStatus(normalize(request.status(), "saved"));
        entity.setUpdatedAt(LocalDateTime.now());

        return toResponse(userProblemRepository.save(entity));
    }

    @Transactional
    public void deleteProblem(UserEntity user, String problemId) {
        userProblemRepository.deleteByUserIdAndProblemId(user.getId(), problemId);
    }

    private UserProblemResponse toResponse(UserProblemEntity entity) {
        return new UserProblemResponse(
            entity.getProblemId(),
            entity.getTitle(),
            entity.getTopic(),
            entity.getLevel(),
            entity.getStatement(),
            entity.getInput(),
            entity.getOutput(),
            entity.getStatus()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalize(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? fallback : normalized;
    }
}
