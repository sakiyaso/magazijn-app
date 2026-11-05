const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { promisify } = require('util');
const qrLogins = new Map();
const QR_TTL = 2 * 60 * 1000;

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'magazijn_app',
  waitForConnections: true,
  connectionLimit: 10,
});
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();

function requireSession(role) {
  return (req, res, next) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const session = token && sessions.get(token);
    if (!session) return res.status(401).json({ error: 'Log opnieuw in om verder te gaan.' });
    if (role && session.rol !== role) return res.status(403).json({ error: 'Je hebt geen toegang tot deze actie.' });
    req.account = session;
    next();
  };
}

app.get('/', (_req, res) => res.send('Magazijn API draait!'));
app.get('/api/test-db', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS time');
    res.json({ status: 'connected', time: rows[0].time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Databaseverbinding mislukt. Controleer de database-instellingen.' });
  }
});

app.get('/api/producten', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, naam, categorie, aantal, eenheid, code FROM producten ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Producten konden niet worden opgehaald.' });
  }
});

app.post('/api/producten', requireSession('docent'), async (req, res) => {
  const { naam, categorie, aantal = 0, eenheid = 'stuks' } = req.body;
  if (!naam?.trim() || !categorie?.trim() || !eenheid?.trim() || !Number.isInteger(Number(aantal)) || Number(aantal) < 0) {
    return res.status(400).json({ error: 'Vul een productnaam, categorie, geldige hoeveelheid en eenheid in.' });
  }
  try {
    const code = `VF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [result] = await pool.execute(
      'INSERT INTO producten (naam, categorie, aantal, eenheid, code) VALUES (?, ?, ?, ?, ?)',
      [naam.trim(), categorie.trim(), Number(aantal), eenheid.trim(), code]
    );
    const [rows] = await pool.execute(
      'SELECT id, naam, categorie, aantal, eenheid, code FROM producten WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Product kon niet worden opgeslagen.' });
  }
});

app.put('/api/producten/:id', requireSession('docent'), async (req, res) => {
  const id = Number(req.params.id);
  const { naam, categorie, aantal, eenheid } = req.body;
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldig productnummer.' });
  if (aantal !== undefined && (!Number.isInteger(Number(aantal)) || Number(aantal) < 0)) {
    return res.status(400).json({ error: 'Aantal moet een positief geheel getal of nul zijn.' });
  }
  try {
    const [result] = await pool.execute(
      `UPDATE producten SET
        naam = COALESCE(?, naam),
        categorie = COALESCE(?, categorie),
        aantal = COALESCE(?, aantal),
        eenheid = COALESCE(?, eenheid)
       WHERE id = ?`,
      [naam?.trim() || null, categorie?.trim() || null, aantal === undefined ? null : Number(aantal), eenheid?.trim() || null, id]
    );
    if (!result.affectedRows) {
      const [existing] = await pool.execute('SELECT id FROM producten WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ error: 'Product niet gevonden.' });
    }
    const [rows] = await pool.execute(
      'SELECT id, naam, categorie, aantal, eenheid, code FROM producten WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Product kon niet worden bijgewerkt.' });
  }
});

app.delete('/api/producten/:id', requireSession('docent'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldig productnummer.' });
  try {
    const [result] = await pool.execute('DELETE FROM producten WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product niet gevonden.' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Product kon niet worden verwijderd.' });
  }
});

app.post('/api/accounts/register', async (req, res) => {
  const naam = req.body.naam?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const wachtwoord = req.body.wachtwoord;
  const rol = req.body.rol;
  if (!naam || !email || typeof wachtwoord !== 'string' || wachtwoord.length < 8 || !['student', 'docent'].includes(rol)) {
    return res.status(400).json({ error: 'Vul naam en e-mailadres in. Het wachtwoord moet minimaal 8 tekens hebben.' });
  }
  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = (await scrypt(wachtwoord, salt, 64)).toString('hex');
    const [result] = await pool.execute(
      'INSERT INTO accounts (naam, email, wachtwoord_hash, `rol`) VALUES (?, ?, ?, ?)',
      [naam, email, `${salt}:${hash}`, rol]
    );
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { id: result.insertId, naam, email, rol });
    res.status(201).json({ id: result.insertId, naam, email, rol, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Er bestaat al een account met dit e-mailadres.' });
    console.error(err);
    res.status(500).json({ error: 'Account kon niet worden aangemaakt.' });
  }
});

app.post('/api/accounts/login', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const wachtwoord = req.body.wachtwoord;
  const rol = req.body.rol;
  if (!email || typeof wachtwoord !== 'string') return res.status(400).json({ error: 'Vul e-mailadres en wachtwoord in.' });
  try {
    const [rows] = await pool.execute(
      'SELECT id, naam, email, wachtwoord_hash, `rol` FROM accounts WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Dit e-mailadres of wachtwoord klopt niet.' });
    const account = rows[0];
    if (rol && account.rol !== rol) return res.status(401).json({ error: 'Dit account hoort bij een andere rol.' });
    const [salt, savedHash] = account.wachtwoord_hash.split(':');
    const inputHash = await scrypt(wachtwoord, salt, 64);
    const expectedHash = Buffer.from(savedHash, 'hex');
    if (inputHash.length !== expectedHash.length || !crypto.timingSafeEqual(inputHash, expectedHash)) {
      return res.status(401).json({ error: 'Dit e-mailadres of wachtwoord klopt niet.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const session = { id: account.id, naam: account.naam, email: account.email, rol: account.rol };
    sessions.set(token, session);
    res.json({ ...session, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Inloggen is niet gelukt.' });
  }
});

app.post('/api/accounts/logout', requireSession(), (req, res) => {
  const token = req.get('authorization').replace(/^Bearer\s+/i, '');
  sessions.delete(token);
  res.status(204).end();
});

app.get('/api/docent/reserveringen', requireSession('docent'), async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT reserveringen.id, reserveringen.product_naam, reserveringen.aantal,
        reserveringen.eenheid, reserveringen.aangemaakt_op, reserveringen.status,
        reserveringen.uitgegeven_op, reserveringen.ingeleverd_op, reserveringen.geannuleerd_op,
        accounts.naam AS student_naam, accounts.email AS student_email
       FROM reserveringen
       INNER JOIN accounts ON accounts.id = reserveringen.account_id
       ORDER BY reserveringen.aangemaakt_op DESC, reserveringen.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reserveringen konden niet worden opgehaald.' });
  }
});

// Nieuwe reserveringen sinds een bepaald id, voor meldingen bij docenten.
// Zonder ?na= wordt alleen het laatste id teruggegeven, zodat oude reserveringen geen melding geven.
app.get('/api/docent/reserveringen/nieuw', requireSession('docent'), async (req, res) => {
  const na = Number(req.query.na);
  try {
    if (!Number.isInteger(na) || na < 0) {
      const [[row]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS laatste_id FROM reserveringen');
      return res.json({ laatste_id: row.laatste_id, reserveringen: [] });
    }
    const [rows] = await pool.execute(
      `SELECT reserveringen.id, reserveringen.product_naam, reserveringen.aantal,
        reserveringen.eenheid, reserveringen.aangemaakt_op, accounts.naam AS student_naam
       FROM reserveringen
       INNER JOIN accounts ON accounts.id = reserveringen.account_id
       WHERE reserveringen.id > ?
       ORDER BY reserveringen.id ASC
       LIMIT 20`,
      [na]
    );
    if (rows.length) return res.json({ laatste_id: rows[rows.length - 1].id, reserveringen: rows });
    // Na verwijderen en een MySQL-herstart kunnen id's opnieuw gebruikt worden, dus nooit boven het hoogste id blijven
    const [[row]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS laatste_id FROM reserveringen');
    res.json({ laatste_id: Math.min(na, row.laatste_id), reserveringen: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nieuwe reserveringen konden niet worden opgehaald.' });
  }
});

// Meldingen zijn reserveringen; verwijderen verbergt ze alleen voor deze docent.
app.get('/api/docent/meldingen', requireSession('docent'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT reserveringen.id, reserveringen.product_naam, reserveringen.aantal,
        reserveringen.eenheid, reserveringen.aangemaakt_op, accounts.naam AS student_naam
       FROM reserveringen
       INNER JOIN accounts ON accounts.id = reserveringen.account_id
       WHERE NOT EXISTS (
         SELECT 1 FROM verwijderde_meldingen
         WHERE verwijderde_meldingen.reservering_id = reserveringen.id
           AND verwijderde_meldingen.account_id = ?
       )
       ORDER BY reserveringen.id DESC
       LIMIT 20`,
      [req.account.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Meldingen konden niet worden opgehaald.' });
  }
});

app.delete('/api/docent/meldingen', requireSession('docent'), async (req, res) => {
  try {
    await pool.execute(
      'INSERT IGNORE INTO verwijderde_meldingen (account_id, reservering_id) SELECT ?, id FROM reserveringen',
      [req.account.id]
    );
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Meldingen verwijderen is niet gelukt.' });
  }
});

app.delete('/api/docent/meldingen/:id', requireSession('docent'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldige melding.' });
  try {
    await pool.execute(
      'INSERT IGNORE INTO verwijderde_meldingen (account_id, reservering_id) SELECT ?, id FROM reserveringen WHERE id = ?',
      [req.account.id, id]
    );
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Melding verwijderen is niet gelukt.' });
  }
});

// Alleen afgeronde reserveringen mogen weg: actieve houden voorraad vast of zijn nog bij een student.
app.delete('/api/docent/reserveringen/afgerond', requireSession('docent'), async (_req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM reserveringen WHERE status IN ('ingeleverd', 'geannuleerd')");
    res.json({ verwijderd: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reserveringen verwijderen is niet gelukt.' });
  }
});

app.delete('/api/docent/reserveringen/:id', requireSession('docent'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldige reservering.' });
  try {
    const [result] = await pool.execute(
      "DELETE FROM reserveringen WHERE id = ? AND status IN ('ingeleverd', 'geannuleerd')",
      [id]
    );
    if (!result.affectedRows) return res.status(409).json({ error: 'Alleen afgeronde reserveringen kunnen worden verwijderd.' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reservering verwijderen is niet gelukt.' });
  }
});

// Artikel meegeven aan de student: de voorraad is al verlaagd bij het reserveren.
app.post('/api/docent/reserveringen/:id/uitgeven', requireSession('docent'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldige reservering.' });
  try {
    const [update] = await pool.execute(
      "UPDATE reserveringen SET status = 'in_gebruik', uitgegeven_op = NOW() WHERE id = ? AND status = 'gereserveerd'",
      [id]
    );
    if (!update.affectedRows) return res.status(409).json({ error: 'Deze reservering kan niet meer worden uitgegeven.' });
    res.json({ id, status: 'in_gebruik' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Uitgeven is niet gelukt.' });
  }
});

// Artikelen terug in het magazijn: status en voorraad worden samen bijgewerkt.
// dateColumn komt alleen uit de routes hieronder, nooit uit het verzoek.
async function returnToStock(res, { rawId, from, to, dateColumn, accountId, conflictError, failureError }) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ongeldige reservering.' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [update] = await connection.execute(
      `UPDATE reserveringen SET status = ?, ${dateColumn} = NOW()
       WHERE id = ? AND status = ?${accountId ? ' AND account_id = ?' : ''}`,
      accountId ? [to, id, from, accountId] : [to, id, from]
    );
    if (!update.affectedRows) {
      await connection.rollback();
      return res.status(409).json({ error: conflictError });
    }
    await connection.execute(
      `UPDATE producten
       INNER JOIN reserveringen ON reserveringen.product_id = producten.id
       SET producten.aantal = producten.aantal + reserveringen.aantal
       WHERE reserveringen.id = ?`,
      [id]
    );
    await connection.commit();
    res.json({ id, status: to });
  } catch (err) {
    await connection?.rollback();
    console.error(err);
    res.status(500).json({ error: failureError });
  } finally {
    connection?.release();
  }
}

app.post('/api/docent/reserveringen/:id/inleveren', requireSession('docent'), (req, res) => returnToStock(res, {
  rawId: req.params.id,
  from: 'in_gebruik',
  to: 'ingeleverd',
  dateColumn: 'ingeleverd_op',
  conflictError: 'Dit artikel is niet in gebruik.',
  failureError: 'Inleveren is niet gelukt.',
}));

const CANCEL_CONFLICT = 'Deze reservering kan niet meer worden geannuleerd.';

app.post('/api/docent/reserveringen/:id/annuleren', requireSession('docent'), (req, res) => returnToStock(res, {
  rawId: req.params.id,
  from: 'gereserveerd',
  to: 'geannuleerd',
  dateColumn: 'geannuleerd_op',
  conflictError: CANCEL_CONFLICT,
  failureError: 'Annuleren is niet gelukt.',
}));

// Studenten kunnen alleen hun eigen reservering annuleren
app.post('/api/reserveringen/:id/annuleren', requireSession('student'), (req, res) => returnToStock(res, {
  rawId: req.params.id,
  from: 'gereserveerd',
  to: 'geannuleerd',
  dateColumn: 'geannuleerd_op',
  accountId: req.account.id,
  conflictError: CANCEL_CONFLICT,
  failureError: 'Annuleren is niet gelukt.',
}));

app.get('/api/reserveringen', requireSession('student'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, product_naam, aantal, eenheid, aangemaakt_op, status FROM reserveringen WHERE account_id = ? ORDER BY id DESC',
      [req.account.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reserveringen konden niet worden opgehaald.' });
  }
});

app.post('/api/reserveringen', requireSession('student'), async (req, res) => {
  const productId = Number(req.body.product_id);
  const aantal = Number(req.body.aantal);
  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(aantal) || aantal < 1) {
    return res.status(400).json({ error: 'Kies een geldig product en aantal.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [update] = await connection.execute(
      'UPDATE producten SET aantal = aantal - ? WHERE id = ? AND aantal >= ?',
      [aantal, productId, aantal]
    );
    if (!update.affectedRows) {
      await connection.rollback();
      return res.status(409).json({ error: 'Er zijn niet genoeg artikelen beschikbaar.' });
    }
    const [products] = await connection.execute(
      'SELECT naam, eenheid FROM producten WHERE id = ?',
      [productId]
    );
    const [result] = await connection.execute(
      'INSERT INTO reserveringen (account_id, product_id, product_naam, aantal, eenheid) VALUES (?, ?, ?, ?, ?)',
      [req.account.id, productId, products[0].naam, aantal, products[0].eenheid]
    );
    await connection.commit();
    res.status(201).json({
      id: result.insertId,
      product_naam: products[0].naam,
      aantal,
      eenheid: products[0].eenheid,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Reserveren is niet gelukt.' });
  } finally {
    connection.release();
  }
});

app.post('/api/qr-login/start', (req, res) => {
  const rol = req.body?.rol;
  if (!['student', 'docent'].includes(rol)) return res.status(400).json({ error: 'Ongeldige rol.' });
  const id = crypto.randomBytes(32).toString('hex');
  qrLogins.set(id, { rol, status: 'pending', expires: Date.now() + QR_TTL });
  res.json({ id });
});

app.get ('/api/qr-login/status/:id', (req, res) => {
  const entry = qrLogins.get(req.params.id);
  if (!entry || entry.expires < Date.now()) {
    qrLogins.delete(req.params.id);
    return res.status(404).json({ error: 'QR-code is verlopen of ongeldig.' });
  }
  if (entry.status !== 'approved') return res.json({ status: 'pending', rol: entry.rol });
  qrLogins.delete(req.params.id); // Clean up after approval
  res.json({ status: 'approved', ...entry.session });
});

app.post('/api/qr-login/approve/:id', requireSession(), (req, res) => {
  const entry = qrLogins.get(req.params.id);
  if (!entry || entry.expires < Date.now() || entry.status !== 'pending') {
    qrLogins.delete(req.params.id);
    return res.status(404).json({ error: 'QR-code is verlopen of ongeldig.' });
  }
  if (req.account.rol !== entry.rol) {
    return res.status(403).json({ error: 'Toegang geweigerd.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, req.account);
  entry.status = 'approved';
  entry.session = { ...req.account, token };
  res.json({ ok: true });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
