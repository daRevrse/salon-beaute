-- Migration 012: Announcement read tracking for in-app notifications
-- Tracks which announcements have been read by which tenant/user

CREATE TABLE IF NOT EXISTS announcement_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES admin_announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (announcement_id, tenant_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index for fast lookups by tenant
CREATE INDEX idx_announcement_reads_tenant ON announcement_reads(tenant_id);
