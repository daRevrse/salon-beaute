-- Migration 022: Disponibilités par employé
-- Permet de calculer les créneaux de réservation en ligne par employé
-- (et non plus au niveau du salon entier) et de laisser le client choisir
-- son professionnel.
--
--  - users.is_bookable    : l'employé prend des rendez-vous (défaut : oui)
--  - users.working_hours  : horaires propres à l'employé (NULL = horaires du salon)
--  - staff_services       : prestations réalisées par l'employé
--                           (aucune ligne = toutes les prestations)
--  - staff_time_off       : congés / absences (journées entières)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS working_hours LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
COMMENT 'Horaires de travail par jour (NULL = horaires du salon)';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_bookable TINYINT(1) NOT NULL DEFAULT 1
COMMENT 'Prend des rendez-vous (apparaît dans les disponibilités)'
AFTER is_active;

CREATE TABLE IF NOT EXISTS staff_services (
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  tenant_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, service_id),
  INDEX idx_staff_services_tenant (tenant_id),
  INDEX idx_staff_services_service (service_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_time_off (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_time_off_tenant_dates (tenant_id, start_date, end_date),
  INDEX idx_time_off_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
