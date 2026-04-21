package com.example.codeviz.execute;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

@Service
public class LocalExecutionService {

    private static final Duration EXECUTION_TIMEOUT = Duration.ofSeconds(10);

    public ExecuteResponse execute(ExecuteRequest request) {
        String language = normalize(request.language());
        String code = request.code() == null ? "" : request.code();

        if (language.isEmpty() || code.isBlank()) {
            throw new IllegalArgumentException("Language and code are required.");
        }

        switch (language.toLowerCase()) {
            case "python", "python3" -> {
                return executePython(code);
            }
            case "java" -> {
                return executeJava(code);
            }
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }

    public ExecutionHealthResponse checkHealth() {
        ToolCheck python = checkTool(
            List.of("python", "--version"),
            List.of("py", "-3", "--version")
        );
        ToolCheck javac = checkTool(List.of("javac", "-version"), null);
        ToolCheck java = checkTool(List.of("java", "-version"), null);

        boolean javaAvailable = javac.available() && java.available();
        String javaDetail = String.format("javac: %s | java: %s", javac.message(), java.message());

        return new ExecutionHealthResponse(
            python.available(),
            javaAvailable,
            python.message(),
            javaDetail
        );
    }

    private ExecuteResponse executePython(String code) {
        try {
            Path workspace = Files.createTempDirectory("codeviz-python-");
            Path sourceFile = workspace.resolve("main.py");
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);

            List<List<String>> commands = List.of(
                List.of("python", sourceFile.toString()),
                List.of("py", "-3", sourceFile.toString())
            );

            CommandResult result = runFirstAvailable(commands, workspace);
            return new ExecuteResponse(result.stdout(), result.stderr(), "");
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to run Python code.");
        }
    }

    private ExecuteResponse executeJava(String code) {
        try {
            Path workspace = Files.createTempDirectory("codeviz-java-");
            Path sourceFile = workspace.resolve("Main.java");
            Files.writeString(sourceFile, ensureMainClass(code), StandardCharsets.UTF_8);

            CommandResult compile = runCommand(List.of("javac", sourceFile.toString()), workspace);
            if (compile.exitCode() != 0) {
                return new ExecuteResponse("", compile.stderr(), "");
            }

            CommandResult run = runCommand(List.of("java", "-cp", workspace.toString(), "Main"), workspace);
            return new ExecuteResponse(run.stdout(), run.stderr(), "");
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to run Java code.");
        }
    }

    private String ensureMainClass(String code) {
        String trimmed = code.trim();
        if (trimmed.contains("class ")) {
            return code;
        }

        return "public class Main {\n" +
            "    public static void main(String[] args) {\n" +
            indentCode(code) +
            "    }\n" +
            "}\n";
    }

    private String indentCode(String code) {
        String[] lines = code.split("\\R", -1);
        StringBuilder builder = new StringBuilder();
        for (String line : lines) {
            builder.append("        ").append(line).append("\n");
        }
        return builder.toString();
    }

    private CommandResult runFirstAvailable(List<List<String>> commands, Path workingDir) throws IOException {
        IOException lastError = null;
        for (List<String> command : commands) {
            try {
                return runCommand(command, workingDir);
            } catch (IOException ex) {
                lastError = ex;
            }
        }

        if (lastError != null) {
            throw lastError;
        }

        throw new IOException("No valid command found.");
    }

    private CommandResult runCommand(List<String> command, Path workingDir) throws IOException {
        ProcessBuilder builder = new ProcessBuilder(new ArrayList<>(command));
        builder.directory(workingDir.toFile());
        Process process = builder.start();

        boolean finished;
        try {
            finished = process.waitFor(EXECUTION_TIMEOUT.toSeconds(), TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IOException("Execution interrupted.");
        }

        if (!finished) {
            process.destroyForcibly();
            throw new IOException("Execution timed out.");
        }

        String stdout = readStream(process.getInputStream());
        String stderr = readStream(process.getErrorStream());

        return new CommandResult(process.exitValue(), stdout, stderr);
    }

    private ToolCheck checkTool(List<String> command, List<String> fallback) {
        Path workingDir = Path.of(System.getProperty("java.io.tmpdir"));
        List<List<String>> commands = new ArrayList<>();
        commands.add(command);
        if (fallback != null && !fallback.isEmpty()) {
            commands.add(fallback);
        }

        IOException lastError = null;
        for (List<String> candidate : commands) {
            try {
                CommandResult result = runCommand(candidate, workingDir);
                String output = !result.stdout().isBlank() ? result.stdout() : result.stderr();
                String message = output.isBlank() ? String.join(" ", candidate) + " ok" : output;
                return new ToolCheck(result.exitCode() == 0, message);
            } catch (IOException ex) {
                lastError = ex;
            }
        }

        String message = lastError == null ? "not available" : lastError.getMessage();
        return new ToolCheck(false, message);
    }

    private String readStream(InputStream stream) throws IOException {
        byte[] bytes = stream.readAllBytes();
        return new String(bytes, StandardCharsets.UTF_8).trim();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private record CommandResult(int exitCode, String stdout, String stderr) {
    }

    private record ToolCheck(boolean available, String message) {
    }
}
