package com.example.codeviz.profile;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserEditorStateRepository extends MongoRepository<UserEditorStateEntity, String> {
    Optional<UserEditorStateEntity> findByUserId(String userId);
}
