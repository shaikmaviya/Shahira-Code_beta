package com.example.codeviz.profile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProblemProgressRepository extends JpaRepository<UserProblemProgressEntity, Long> {
    List<UserProblemProgressEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<UserProblemProgressEntity> findByUserIdAndProblemId(Long userId, String problemId);
}
