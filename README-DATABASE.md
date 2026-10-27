# VistaFlow magazijn-app met MariaDB en phpMyAdmin

De frontend gebruikt de backend-API. Producten en accounts worden opgeslagen in MariaDB; phpMyAdmin is de webinterface waarmee je die database kunt bekijken en beheren.

## 1. MariaDB en phpMyAdmin installeren

Installeer XAMPP en open het XAMPP Control Panel. Start **MySQL** (MariaDB) en Apache. phpMyAdmin is beschikbaar op `http://localhost/phpmyadmin`.

## 2. Database en tabellen maken

1. Open phpMyAdmin en kies **Importeren**.
2. Selecteer `backend/database/schema.sql` en kies **Importeren**.
3. Controleer of de database `magazijn_app` met de tabellen `producten`, `accounts` en `reserveringen` is aangemaakt.

Het SQL-bestand maakt de database aan als die nog niet bestaat. Bij een bestaande installatie voer je `backend/database/migrate-roles-reservations.sql` eenmalig uit. Bestaande accounts krijgen de rol `student`; wijzig voor docentaccounts de kolom `rol` in phpMyAdmin naar `docent`.

## 3. Backend instellen en starten

1. Open een terminal in `backend`.
2. Kopieer `.env.example` naar `.env`. De standaardinstellingen zijn voor een lokale XAMPP-installatie. Als je een wachtwoord hebt ingesteld voor MariaDB-gebruiker `root`, vul dat dan in bij `DB_PASSWORD`.
3. Installeer en start de backend:

```bash
npm install
npm start
```

De API draait standaard op `http://localhost:3000`. Controleer de databaseverbinding via `http://localhost:3000/api/test-db`.

## 4. Frontend starten

Open een tweede terminal in `frontend` en voer uit:

```bash
npm install
npm run dev
```

Open de lokale URL van Vite (meestal `http://localhost:5173`).

## Wat is gekoppeld?

- Docenten beheren producten en voorraad via de API.
- Studenten reserveren beschikbare aantallen op `/reserveren`; reserveringen verlagen direct de voorraad.
- Accounts registreren en inloggen als student of docent.
- Wachtwoorden worden gehasht opgeslagen in de database.

**Let op:** de backend bewaart sessies tijdelijk in het geheugen. Een herstart van de backend meldt iedereen af. Gebruik deze basisinstallatie alleen lokaal; stel sterke databasewachtwoorden in en laat de database niet rechtstreeks vanaf internet bereikbaar zijn.
