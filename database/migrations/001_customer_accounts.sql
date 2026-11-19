-- Run once against databases created before customer accounts were added.
CREATE TABLE IF NOT EXISTS customer_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  company_name VARCHAR(180) NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  mobile VARCHAR(40) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_accounts_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE enquiries
  ADD COLUMN customer_account_id BIGINT UNSIGNED NULL AFTER id,
  ADD INDEX idx_enquiries_customer_created (customer_account_id, created_at),
  ADD CONSTRAINT fk_enquiries_customer FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE SET NULL;
