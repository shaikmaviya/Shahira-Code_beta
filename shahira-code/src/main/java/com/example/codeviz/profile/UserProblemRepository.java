package com.example.codeviz.profile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserProblemRepository extends MongoRepository<UserProblemEntity, String> {
    List<UserProblemEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<UserProblemEntity> findByUserIdAndProblemId(String userId, String problemId);

    void deleteByUserIdAndProblemId(String userId, String problemId);
}
