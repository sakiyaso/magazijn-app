const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { promisify } = require('util');

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
        reserveringen.eenheid, reserveringen.aangemaakt_op,
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

app.get('/api/reserveringen', requireSession('student'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, product_naam, aantal, eenheid, aangemaakt_op FROM reserveringen WHERE account_id = ? ORDER BY id DESC',
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

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
