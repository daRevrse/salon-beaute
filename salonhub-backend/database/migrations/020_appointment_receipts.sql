-- Migration 020: Create Receipts table for appointments
-- Date: 2026-03-27

CREATE TABLE IF NOT EXISTS appointment_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    appointment_id INT NOT NULL,
    client_id INT NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    
    -- Snapshot data (in case service or client changes later)
    client_name VARCHAR(255),
    service_name VARCHAR(255),
    staff_name VARCHAR(255),
    
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    
    items JSON, -- For more detailed breakdown if needed later
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_appointment_receipt (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for searching receipts
ALTER TABLE appointment_receipts ADD INDEX idx_receipt_number (receipt_number);
ALTER TABLE appointment_receipts ADD INDEX idx_tenant_receipt (tenant_id);
