-- Eenmalige upgrade: reserveringen kunnen geannuleerd worden. Dit bestand mag vaker worden uitgevoerd.
-- Voer eerst migrate-items-in-gebruik.sql uit als die nog niet is gedraaid.
USE magazijn_app;

ALTER TABLE reserveringen
  MODIFY COLUMN `status` ENUM('gereserveerd', 'in_gebruik', 'ingeleverd', 'geannuleerd') NOT NULL DEFAULT 'gereserveerd';

SET @add_geannuleerd_op = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE reserveringen ADD COLUMN geannuleerd_op TIMESTAMP NULL DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'reserveringen'
    AND column_name = 'geannuleerd_op'
);
PREPARE add_geannuleerd_op_statement FROM @add_geannuleerd_op;
EXECUTE add_geannuleerd_op_statement;
DEALLOCATE PREPARE add_geannuleerd_op_statement;
