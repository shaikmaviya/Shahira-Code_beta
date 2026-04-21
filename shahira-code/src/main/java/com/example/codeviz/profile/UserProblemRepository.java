package com.example.codeviz.profile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProblemRepository extends JpaRepository<UserProblemEntity, Long> {
    List<UserProblemEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<UserProblemEntity> findByUserIdAndProblemId(Long userId, String problemId);

    void deleteByUserIdAndProblemId(Long userId, String problemId);
}
