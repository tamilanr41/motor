-- Run once on the Hostinger database before deploying the asset-store code.
-- Product/category/banner/logo images are stored as BLOBs so uploads survive
-- Render redeploys (the container filesystem is reset on every deploy).
CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mime_type VARCHAR(120) NOT NULL,
  file_name VARCHAR(255) NULL,
  data LONGBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
