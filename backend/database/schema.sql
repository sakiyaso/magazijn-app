-- Import dit bestand via phpMyAdmin om de database en tabellen aan te maken.
CREATE DATABASE IF NOT EXISTS magazijn_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE magazijn_app;

CREATE TABLE IF NOT EXISTS producten (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  naam VARCHAR(80) NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  aantal INT NOT NULL DEFAULT 0 CHECK (aantal >= 0),
  eenheid VARCHAR(20) NOT NULL DEFAULT 'stuks',
  code VARCHAR(20) UNIQUE NOT NULL,
  aangemaakt_op TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bijgewerkt_op TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_producten_naam (naam),
  INDEX idx_producten_categorie (categorie)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  naam VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  wachtwoord_hash TEXT NOT NULL,
  `rol` ENUM('student', 'docent') NOT NULL DEFAULT 'student',
  aangemaakt_op TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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
