package com.example.codeviz.profile;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.codeviz.auth.UserEntity;

@Service
public class UserEditorStateService {

    private final UserEditorStateRepository editorStateRepository;

    public UserEditorStateService(UserEditorStateRepository editorStateRepository) {
        this.editorStateRepository = editorStateRepository;
    }

    public UserEditorStateResponse getState(UserEntity user) {
        return editorStateRepository.findByUserId(user.getId())
            .map(this::toResponse)
            .orElseGet(() -> new UserEditorStateResponse("", "", null));
    }

    @Transactional
    public UserEditorStateResponse upsertState(UserEntity user, UserEditorStateRequest request) {
        UserEditorStateEntity entity = editorStateRepository.findByUserId(user.getId())
            .orElseGet(UserEditorStateEntity::new);

        if (entity.getId() == null) {
            entity.setUser(user);
        }

        if (request.code() != null) {
            entity.setCode(request.code());
        }

        if (request.logs() != null) {
            entity.setLogs(request.logs());
        }

        entity.setUpdatedAt(LocalDateTime.now());

        return toResponse(editorStateRepository.save(entity));
    }

    private UserEditorStateResponse toResponse(UserEditorStateEntity entity) {
        return new UserEditorStateResponse(entity.getCode(), entity.getLogs(), entity.getUpdatedAt());
    }
}
