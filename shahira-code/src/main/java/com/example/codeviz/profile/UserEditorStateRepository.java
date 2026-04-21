package com.example.codeviz.profile;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEditorStateRepository extends JpaRepository<UserEditorStateEntity, Long> {
    Optional<UserEditorStateEntity> findByUserId(Long userId);
}
