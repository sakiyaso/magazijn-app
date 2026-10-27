-- Eenmalige upgrade voor een database die al eerder met schema.sql is aangemaakt.
USE magazijn_app;

SET @add_rol = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE accounts ADD COLUMN `rol` ENUM(''student'', ''docent'') NOT NULL DEFAULT ''student''',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'accounts'
    AND column_name = 'rol'
);
PREPARE add_rol_statement FROM @add_rol;
EXECUTE add_rol_statement;
DEALLOCATE PREPARE add_rol_statement;

CREATE TABLE IF NOT EXISTS reserveringen (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_naam VARCHAR(80) NOT NULL,
  aantal INT UNSIGNED NOT NULL,
  eenheid VARCHAR(20) NOT NULL,
  aangemaakt_op TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserveringen_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_reserveringen_account (account_id)
) ENGINE=InnoDB;
