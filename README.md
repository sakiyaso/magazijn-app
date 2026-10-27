# Magazijn-app

Een voorraadapp met een React-frontend, Node.js-API en MySQL-database. Studenten kunnen artikelen reserveren; docenten beheren de voorraad en bekijken reserveringen.

## Benodigd

- Node.js en npm
- MAMP met MySQL en phpMyAdmin

## Lokaal starten

1. Start MySQL in MAMP.
2. Importeer `backend/database/schema.sql` in phpMyAdmin. Voor een bestaande database gebruik je eenmalig `backend/database/migrate-roles-reservations.sql`.
3. Kopieer `backend/.env.example` naar `backend/.env` en vul je lokale database-instellingen in. Deel `.env` nooit.
4. Open een terminal in `backend` en voer `npm install` en daarna `npm start` uit.
5. Open een tweede terminal in `frontend` en voer `npm install` en daarna `npm run dev` uit.
6. Open de Vite-URL, meestal `http://localhost:5173`.

De API draait op `http://localhost:3000`; de databaseverbinding kun je controleren via `/api/test-db`.

## Teamwerk

Iedere ontwikkelaar maakt een eigen `backend/.env` en gebruikt lokaal MAMP. De databasegegevens blijven lokaal; deel geen wachtwoorden of `.env`-bestanden. Maak accounts aan via de website. Docentaccounts kunnen lokaal de rol `docent` krijgen in de tabel `accounts`.
