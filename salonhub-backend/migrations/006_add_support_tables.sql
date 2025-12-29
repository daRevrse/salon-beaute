-- Migration: Add Support Ticket System Tables
-- Date: 2025-12-29
-- Description: Create tables for support tickets and messages

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  tenant_id INT NOT NULL,
  user_id INT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') DEFAULT 'open',
  category VARCHAR(100),
  assigned_to INT NULL,
  first_response_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  satisfaction_rating TINYINT NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_ticket_number (ticket_number),
  INDEX idx_tenant (tenant_id, status),
  INDEX idx_assigned (assigned_to, status),
  INDEX idx_status (status, priority),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket messages/comments
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  author_type ENUM('customer', 'admin', 'system') NOT NULL,
  author_id INT NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  INDEX idx_ticket (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-increment for ticket numbers
CREATE TABLE IF NOT EXISTS ticket_counter (
  id INT PRIMARY KEY DEFAULT 1,
  current_number INT NOT NULL DEFAULT 1000,
  CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial value if table is empty
INSERT IGNORE INTO ticket_counter (id, current_number) VALUES (1, 1000);
