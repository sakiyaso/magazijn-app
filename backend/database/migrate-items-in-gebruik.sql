-- Eenmalige upgrade: houdt per reservering bij of een artikel in gebruik of ingeleverd is.
-- Bestaande reserveringen krijgen de status 'gereserveerd'. Dit bestand mag vaker worden uitgevoerd.
USE magazijn_app;

SET @add_status = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE reserveringen
      ADD COLUMN `status` ENUM(''gereserveerd'', ''in_gebruik'', ''ingeleverd'') NOT NULL DEFAULT ''gereserveerd'',
      ADD COLUMN uitgegeven_op TIMESTAMP NULL DEFAULT NULL,
      ADD COLUMN ingeleverd_op TIMESTAMP NULL DEFAULT NULL,
      ADD INDEX idx_reserveringen_status (`status`)',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'reserveringen'
    AND column_name = 'status'
);
PREPARE add_status_statement FROM @add_status;
EXECUTE add_status_statement;
DEALLOCATE PREPARE add_status_statement;
