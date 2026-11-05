-- Eenmalige upgrade: docenten kunnen meldingen verwijderen zonder dat de reservering verdwijnt.
-- Dit bestand mag vaker worden uitgevoerd.
USE magazijn_app;

CREATE TABLE IF NOT EXISTS verwijderde_meldingen (
  account_id INT UNSIGNED NOT NULL,
  reservering_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (account_id, reservering_id),
  CONSTRAINT fk_verwijderde_meldingen_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_verwijderde_meldingen_reservering FOREIGN KEY (reservering_id) REFERENCES reserveringen(id) ON DELETE CASCADE
) ENGINE=InnoDB;
