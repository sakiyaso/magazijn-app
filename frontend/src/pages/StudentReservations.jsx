import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './StudentReservations.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function StudentReservations({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [productsResponse, reservationsResponse] = await Promise.all([
        fetch(`${API_URL}/api/producten`),
        fetch(`${API_URL}/api/reserveringen`, { headers: { Authorization: `Bearer ${user.token}` } }),
      ]);
      if (!productsResponse.ok || !reservationsResponse.ok) throw new Error('Gegevens laden is niet gelukt.');
      const [productData, reservationData] = await Promise.all([
        productsResponse.json(),
        reservationsResponse.json(),
      ]);
      setProducts(productData);
      setReservations(reservationData);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [user.token]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleReserve = async (product) => {
    const aantal = Number(quantities[product.id] || 1);
    if (!Number.isInteger(aantal) || aantal < 1 || aantal > Number(product.aantal)) {
      setError('Vul een geldig aantal in dat op voorraad is.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/reserveringen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ product_id: product.id, aantal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reserveren is niet gelukt.');
      setMessage(`${data.product_naam} gereserveerd.`);
      setQuantities((current) => ({ ...current, [product.id]: 1 }));
      await loadData();
    } catch (reserveError) {
      setError(reserveError.message);
    }
  };

  const matchingProducts = products.filter((product) => (
    `${product.naam} ${product.categorie}`.toLowerCase().includes(search.trim().toLowerCase())
  ));

  return (
    <div className="dashboard reservation-page">
      <header className="topbar">
        <Link className="brand" to="/reserveren">
          <span className="brand-mark">V</span><span>VistaFlow</span>
        </Link>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <Link className="active" to="/reserveren">Reserveren</Link>
        </nav>
        <div className="header-actions">
          <span className="user-label">{user.naam}</span>
          <button className="button button-outline" type="button" onClick={onLogout}>Uitloggen</button>
        </div>
      </header>

      <main className="reservation-main">
        <div className="reservation-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> STUDENT</p>
            <h1>Reserveer <span>artikelen.</span></h1>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Zoek artikel" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        {error && <p className="reservation-message error-message" role="alert">{error}</p>}
        {message && <p className="reservation-message success-message" role="status">{message}</p>}

        <section className="reservation-list" aria-label="Beschikbare artikelen">
          {matchingProducts.filter((product) => Number(product.aantal) > 0).map((product) => (
            <article className="reservation-item" key={product.id}>
              <div className="reservation-product">
                <strong>{product.naam}</strong>
                <span>{product.categorie} · {product.aantal} {product.eenheid} beschikbaar</span>
              </div>
              <label className="reservation-quantity">
                <span>Aantal</span>
                <input
                  aria-label={`Aantal ${product.naam}`}
                  type="number"
                  min="1"
                  max={product.aantal}
                  step="1"
                  value={quantities[product.id] || 1}
                  onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: event.target.value }))}
                />
              </label>
              <button className="button button-dark" type="button" onClick={() => handleReserve(product)}>Reserveer</button>
            </article>
          ))}
          {matchingProducts.filter((product) => Number(product.aantal) > 0).length === 0 && (
            <p className="reservation-empty">Geen artikelen beschikbaar.</p>
          )}
        </section>

        <section className="my-reservations">
          <h2>Mijn reserveringen</h2>
          {reservations.length === 0 ? (
            <p className="reservation-empty">Nog geen reserveringen.</p>
          ) : (
            <ul>
              {reservations.map((reservation) => (
                <li key={reservation.id}>
                  <span>{reservation.product_naam}</span>
                  <strong>{reservation.aantal} {reservation.eenheid}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentReservations;
