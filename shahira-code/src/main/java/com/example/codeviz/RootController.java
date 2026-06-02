package com.example.codeviz;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping("/api/health")
    public Map<String, String> root() {
        return Map.of("status", "ok");
    }
}
