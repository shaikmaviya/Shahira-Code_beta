-- MySQL schema for Shahira Code
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  provider VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  avatar_url VARCHAR(500) NULL,
  bio VARCHAR(400) NULL
);

CREATE TABLE IF NOT EXISTS session_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(100) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_session_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_problems (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  problem_id VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  topic VARCHAR(80) NOT NULL,
  level VARCHAR(20) NOT NULL,
  statement TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  saved_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_user_problems_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_user_problem UNIQUE (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS user_problem_progress (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  problem_id VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL,
  attempts INT NOT NULL,
  last_attempt_at DATETIME NULL,
  completed_at DATETIME NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_user_problem_progress_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_user_progress UNIQUE (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS user_editor_state (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  code TEXT NULL,
  logs TEXT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_user_editor_state_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_user_editor_state UNIQUE (user_id)
);
