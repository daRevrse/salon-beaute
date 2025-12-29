-- Migration: Add System Health Monitoring Tables
-- Date: 2025-12-29
-- Description: Create tables for system health, error tracking, and performance monitoring

-- System error logs
CREATE TABLE IF NOT EXISTS system_error_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  endpoint VARCHAR(255),
  method VARCHAR(10),
  tenant_id INT NULL,
  user_id INT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body JSON,
  metadata JSON,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_error_type (error_type, created_at),
  INDEX idx_severity (severity, resolved, created_at),
  INDEX idx_tenant (tenant_id, created_at),
  INDEX idx_endpoint (endpoint, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API performance metrics
CREATE TABLE IF NOT EXISTS api_performance_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INT NOT NULL COMMENT 'Response time in milliseconds',
  status_code INT NOT NULL,
  tenant_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  INDEX idx_endpoint_time (endpoint, created_at),
  INDEX idx_slow_queries (response_time, created_at),
  INDEX idx_errors (status_code, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Database slow query logs
CREATE TABLE IF NOT EXISTS slow_query_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  query_hash VARCHAR(64) NOT NULL,
  query_text TEXT NOT NULL,
  execution_time DECIMAL(10,3) NOT NULL COMMENT 'Execution time in seconds',
  rows_examined INT,
  rows_sent INT,
  database_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hash (query_hash),
  INDEX idx_execution_time (execution_time, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Storage usage tracking
CREATE TABLE IF NOT EXISTS storage_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  total_bytes BIGINT NOT NULL,
  files_count INT DEFAULT 0,
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id, last_calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System health checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  check_type VARCHAR(100) NOT NULL COMMENT 'database, redis, email, storage, etc.',
  status ENUM('healthy', 'degraded', 'down') NOT NULL,
  response_time INT COMMENT 'Response time in milliseconds',
  error_message TEXT,
  metadata JSON,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_check_type (check_type, checked_at),
  INDEX idx_status (status, checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
