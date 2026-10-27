import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './TeacherReservations.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function TeacherReservations({ user, onLogout }) {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadReservations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/docent/reserveringen`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reserveringen ophalen is niet gelukt.');
      setReservations(data);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Reserveringen ophalen is niet gelukt.');
    }
  }, [user.token]);

  useEffect(() => {
    const timer = window.setTimeout(loadReservations, 0);
    return () => window.clearTimeout(timer);
  }, [loadReservations]);

  const matchingReservations = reservations.filter((reservation) => (
    `${reservation.student_naam} ${reservation.student_email} ${reservation.product_naam}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ));

  return (
    <div className="dashboard teacher-reservations-page">
      <header className="topbar">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">V</span><span>VistaFlow</span>
        </Link>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <Link to="/dashboard">Magazijn</Link>
          <Link className="active" to="/docent/reserveringen">Reserveringen</Link>
        </nav>
        <div className="header-actions">
          <span className="user-label">{user.naam}</span>
          <button className="button button-outline" type="button" onClick={onLogout}>Uitloggen</button>
        </div>
      </header>

      <main className="teacher-reservations-main">
        <div className="teacher-reservations-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> DOCENT</p>
            <h1>Student <span>reserveringen.</span></h1>
            <p className="page-description">Bekijk wie welke artikelen heeft gereserveerd.</p>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Zoek student of artikel"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <section className="teacher-reservations-list" aria-label="Alle reserveringen">
          <div className="teacher-reservations-row teacher-reservations-labels">
            <span>Student</span>
            <span>Artikel</span>
            <span>Aantal</span>
            <span>Gereserveerd op</span>
          </div>
          {matchingReservations.map((reservation) => (
            <article className="teacher-reservations-row" key={reservation.id}>
              <div className="teacher-reservation-student">
                <strong>{reservation.student_naam}</strong>
                <span>{reservation.student_email}</span>
              </div>
              <strong className="teacher-reservation-product">{reservation.product_naam}</strong>
              <span className="teacher-reservation-amount">{reservation.aantal} {reservation.eenheid}</span>
              <time dateTime={reservation.aangemaakt_op}>
                {new Intl.DateTimeFormat('nl-NL', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(reservation.aangemaakt_op))}
              </time>
            </article>
          ))}
          {!error && matchingReservations.length === 0 && (
            <p className="teacher-reservations-empty">
              {reservations.length ? 'Geen reserveringen gevonden.' : 'Er zijn nog geen reserveringen.'}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default TeacherReservations;
