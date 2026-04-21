package com.example.codeviz.execute;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.codeviz.auth.ApiError;

@RestController
@RequestMapping("/api/execute")
public class ExecuteController {

    private final LocalExecutionService executionService;

    public ExecuteController(LocalExecutionService executionService) {
        this.executionService = executionService;
    }

    @GetMapping("/health")
    public ResponseEntity<ExecutionHealthResponse> health() {
        return ResponseEntity.ok(executionService.checkHealth());
    }

    @PostMapping
    public ResponseEntity<?> execute(@RequestBody ExecuteRequest request) {
        try {
            return ResponseEntity.ok(executionService.execute(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiError(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ApiError(ex.getMessage()));
        }
    }
}
