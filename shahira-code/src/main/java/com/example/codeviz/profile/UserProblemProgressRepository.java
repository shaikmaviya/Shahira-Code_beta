package com.example.codeviz.profile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserProblemProgressRepository extends MongoRepository<UserProblemProgressEntity, String> {
    List<UserProblemProgressEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<UserProblemProgressEntity> findByUserIdAndProblemId(String userId, String problemId);
}
