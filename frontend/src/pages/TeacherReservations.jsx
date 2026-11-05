import { useCallback, useEffect, useState } from 'react';
import './Dashboard.css';
import './TeacherReservations.css';
import { NEW_RESERVATION_EVENT, RESERVATIONS_REMOVED_EVENT } from '../components/reservationNotifications';
import { STATUS_LABELS } from '../components/reservationStatus';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const FILTERS = [
  { value: 'alle', label: 'Alle', dateLabel: 'Datum' },
  { value: 'gereserveerd', label: STATUS_LABELS.gereserveerd, dateLabel: 'Gereserveerd op' },
  { value: 'in_gebruik', label: STATUS_LABELS.in_gebruik, dateLabel: 'In gebruik sinds' },
  { value: 'ingeleverd', label: STATUS_LABELS.ingeleverd, dateLabel: 'Ingeleverd op' },
  { value: 'geannuleerd', label: STATUS_LABELS.geannuleerd, dateLabel: 'Geannuleerd op' },
];

// De datum die bij de huidige status van de reservering hoort
function getStatusDate(reservation) {
  if (reservation.status === 'in_gebruik') return reservation.uitgegeven_op;
  if (reservation.status === 'ingeleverd') return reservation.ingeleverd_op;
  if (reservation.status === 'geannuleerd') return reservation.geannuleerd_op;
  return reservation.aangemaakt_op;
}

function TeacherReservations({ user }) {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [busyId, setBusyId] = useState(null);
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

  // Lijst verversen zodra er een nieuwe reservering binnenkomt
  useEffect(() => {
    window.addEventListener(NEW_RESERVATION_EVENT, loadReservations);
    return () => window.removeEventListener(NEW_RESERVATION_EVENT, loadReservations);
  }, [loadReservations]);

  const changeStatus = async (reservation, action) => {
    setBusyId(reservation.id);
    try {
      const response = await fetch(`${API_URL}/api/docent/reserveringen/${reservation.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'De status wijzigen is niet gelukt.');
      await loadReservations();
    } catch (changeError) {
      // De lijst kan verouderd zijn, bijvoorbeeld als de student net zelf heeft geannuleerd
      await loadReservations();
      setError(changeError.message || 'De status wijzigen is niet gelukt.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (reservation) => {
    const question = `Reservering van ${reservation.student_naam} voor ${reservation.aantal} ${reservation.eenheid} ${reservation.product_naam} annuleren?`;
    if (window.confirm(question)) changeStatus(reservation, 'annuleren');
  };

  const removeReservations = async (target) => {
    setBusyId(target);
    try {
      const response = await fetch(`${API_URL}/api/docent/reserveringen/${target}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verwijderen is niet gelukt.');
      }
      await loadReservations();
      window.dispatchEvent(new CustomEvent(RESERVATIONS_REMOVED_EVENT));
    } catch (removeError) {
      await loadReservations();
      setError(removeError.message || 'Verwijderen is niet gelukt.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = (reservation) => {
    const question = `Reservering van ${reservation.student_naam} voor ${reservation.aantal} ${reservation.eenheid} ${reservation.product_naam} definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`;
    if (window.confirm(question)) removeReservations(reservation.id);
  };

  const countByStatus = (status) => (
    status === 'alle' ? reservations.length : reservations.filter((reservation) => reservation.status === status).length
  );

  const finishedCount = countByStatus('ingeleverd') + countByStatus('geannuleerd');

  const handleRemoveFinished = () => {
    const question = `${finishedCount === 1 ? '1 afgeronde reservering' : `Alle ${finishedCount} afgeronde reserveringen`} (ingeleverd en geannuleerd) definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`;
    if (window.confirm(question)) removeReservations('afgerond');
  };

  const activeFilter = FILTERS.find((filter) => filter.value === statusFilter);

  const matchingReservations = reservations.filter((reservation) => (
    (statusFilter === 'alle' || reservation.status === statusFilter)
    && `${reservation.student_naam} ${reservation.student_email} ${reservation.product_naam}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ));

  return (
    <div className="dashboard teacher-reservations-page">

      <main className="teacher-reservations-main">
        <div className="teacher-reservations-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> DOCENT</p>
            <h1>Student <span>reserveringen.</span></h1>
            <p className="page-description">Bekijk wie welke artikelen heeft gereserveerd of in gebruik heeft.</p>
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

        <div className="teacher-reservations-toolbar">
          <div className="teacher-reservations-filters" role="group" aria-label="Filter op status">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={statusFilter === filter.value ? 'is-active' : ''}
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label} <span>{countByStatus(filter.value)}</span>
              </button>
            ))}
          </div>
          {finishedCount > 0 && (
            <button
              className="button button-outline teacher-reservations-clear"
              type="button"
              disabled={busyId === 'afgerond'}
              onClick={handleRemoveFinished}
            >
              Afgeronde verwijderen ({finishedCount})
            </button>
          )}
        </div>

        <section className="teacher-reservations-list" aria-label="Reserveringen">
          <div className="teacher-reservations-row teacher-reservations-labels">
            <span>Student</span>
            <span>Artikel</span>
            <span>Aantal</span>
            <span>{activeFilter.dateLabel}</span>
            <span>Status</span>
          </div>
          {matchingReservations.map((reservation) => (
            <article className="teacher-reservations-row" key={reservation.id}>
              <div className="teacher-reservation-student">
                <strong>{reservation.student_naam}</strong>
                <span>{reservation.student_email}</span>
              </div>
              <strong className="teacher-reservation-product">{reservation.product_naam}</strong>
              <span className="teacher-reservation-amount">{reservation.aantal} {reservation.eenheid}</span>
              <time dateTime={getStatusDate(reservation)}>
                {new Intl.DateTimeFormat('nl-NL', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(getStatusDate(reservation)))}
              </time>
              <div className="teacher-reservation-status">
                <span className={`status-label status-${reservation.status}`}>{STATUS_LABELS[reservation.status]}</span>
                {reservation.status === 'gereserveerd' && (
                  <div className="teacher-reservation-actions">
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={busyId === reservation.id}
                      onClick={() => handleCancel(reservation)}
                    >
                      Annuleren
                    </button>
                    <button
                      className="button button-dark"
                      type="button"
                      disabled={busyId === reservation.id}
                      onClick={() => changeStatus(reservation, 'uitgeven')}
                    >
                      Uitgeven
                    </button>
                  </div>
                )}
                {reservation.status === 'in_gebruik' && (
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={busyId === reservation.id}
                    onClick={() => changeStatus(reservation, 'inleveren')}
                  >
                    Inleveren
                  </button>
                )}
                {(reservation.status === 'ingeleverd' || reservation.status === 'geannuleerd') && (
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={busyId === reservation.id || busyId === 'afgerond'}
                    onClick={() => handleRemove(reservation)}
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </article>
          ))}
          {!error && matchingReservations.length === 0 && (
            <p className="teacher-reservations-empty">
              {reservations.length
                ? (statusFilter === 'in_gebruik' && !search.trim() ? 'Er zijn nu geen artikelen in gebruik.' : 'Geen reserveringen gevonden.')
                : 'Er zijn nog geen reserveringen.'}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default TeacherReservations;
