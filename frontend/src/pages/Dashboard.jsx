import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';

function getSymbol(name) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function Dashboard({ user }) {
  const [items, setItems] = useState([]);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', category: '', quantity: '0', unit: 'stuks' });
  const loggedUser = user.naam;
  const authHeaders = { Authorization: `Bearer ${user.token}` };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/producten`);
      if (!response.ok) throw new Error('Producten ophalen is niet gelukt.');
      const data = await response.json();
      setItems(data.map((product) => ({
        id: product.id, name: product.naam, category: product.categorie,
        quantity: Number(product.aantal), unit: product.eenheid,
        code: product.code, symbol: product.code || getSymbol(product.naam),
      })));
      setApiError('');
    } catch {
      setApiError('De database is niet bereikbaar. Start de backend en controleer de database-instellingen.');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedItem) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedItem]);

  const allItems = items;
  const normalizedSearch = search.trim().toLowerCase();
  const matchingItems = allItems.filter((item) => (
    `${item.name} ${item.category}`.toLowerCase().includes(normalizedSearch)
  ));
  const availableItems = matchingItems.filter((item) => item.quantity > 0);
  const emptyItems = matchingItems.filter((item) => item.quantity <= 0);
  const availableCount = allItems.filter((item) => item.quantity > 0).length;
  const emptyCount = allItems.filter((item) => item.quantity <= 0).length;

  const handleAddProduct = async (event) => {
    event.preventDefault();
    const product = {
      naam: productForm.name.trim(), categorie: productForm.category.trim(),
      aantal: Math.max(0, Number.parseInt(productForm.quantity, 10) || 0),
      eenheid: productForm.unit.trim(),
    };
    if (!product.naam || !product.categorie || !product.eenheid) return;
    try {
      const response = await fetch(`${API_URL}/api/producten`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(product),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Product toevoegen is niet gelukt.');
      setItems((oldItems) => [...oldItems, { id: data.id, name: data.naam, category: data.categorie, quantity: Number(data.aantal), unit: data.eenheid, code: data.code, symbol: data.code || getSymbol(data.naam) }]);
      setProductForm({ name: '', category: '', quantity: '0', unit: 'stuks' });
      setApiError('');
    } catch (error) { setApiError(error.message); }
  };

  const updateProduct = async (item, changes) => {
    try {
      const response = await fetch(`${API_URL}/api/producten/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Opslaan is niet gelukt.');
      setItems((oldItems) => oldItems.map((storedItem) => storedItem.id === item.id ? {
        ...storedItem, name: data.naam, category: data.categorie, quantity: Number(data.aantal), unit: data.eenheid, code: data.code, symbol: data.code || getSymbol(data.naam),
      } : storedItem));
      setApiError('');
    } catch (error) { setApiError(error.message); }
  };

  const handleRename = async (item) => {
    const name = window.prompt('Nieuwe artikelnaam:', item.name);
    if (name === null) return;
    const cleanName = name.trim();
    if (!cleanName) { window.alert('De artikelnaam mag niet leeg zijn.'); return; }
    await updateProduct(item, { naam: cleanName });
  };

  const handleQuantityChange = async (item, change) => {
    await updateProduct(item, { aantal: Math.max(0, item.quantity + change) });
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/api/producten/${selectedItem.id}`, { method: 'DELETE', headers: authHeaders });
      if (!response.ok) throw new Error('Product verwijderen is niet gelukt.');
      setItems((oldItems) => oldItems.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setApiError('');
    } catch (error) { setApiError(error.message); setSelectedItem(null); }
  };

  const renderItem = (item) => (
    <article className="stock-item" key={`${item.readOnly ? 'api' : 'local'}-${item.id}`}>
      <div className="item-symbol">{item.symbol}</div>
      <div className="item-info">
        <div className="item-name-line">
          <strong>{item.name}</strong>
          {loggedUser && (
            <button
              className="edit-action"
              type="button"
              aria-label={`Naam wijzigen: ${item.name}`}
              title="Naam wijzigen"
              onClick={() => handleRename(item)}
            >
              ✎
            </button>
          )}
        </div>
        <span>{item.category}</span>
      </div>
      <div className="item-quantity">
        <strong>{item.quantity} {item.unit}</strong>
        <span>{item.quantity > 0 ? 'Beschikbaar' : 'Voorraad op'}</span>
      </div>
      {
        <div className="quantity-controls">
          <button
            className="stock-action minus-action"
            type="button"
            aria-label={`Een ${item.unit} minder van ${item.name}`}
            onClick={() => handleQuantityChange(item, -1)}
          >−</button>
          <button
            className="stock-action plus-action"
            type="button"
            aria-label={`Een ${item.unit} meer van ${item.name}`}
            onClick={() => handleQuantityChange(item, 1)}
          >+</button>
          {item.quantity <= 0 && (
            <button
              className="delete-action"
              type="button"
              aria-label={`Verwijder ${item.name}`}
              title="Product verwijderen"
              onClick={() => setSelectedItem(item)}
            >🗑</button>
          )}
        </div>
      }
    </article>
  );

  return (
    <div className="dashboard">

      <main className="inventory-main">
        <div className="page-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> VISTAFLOW</p>
            <h1>Het <span>magazijn.</span></h1>
            <p className="page-description">Houd in één oogopslag bij wat beschikbaar is en wat aangevuld moet worden.</p>
          </div>
          <div className="heading-date">
            <span className="date-label">VANDAAG</span>
            <strong>{new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</strong>
          </div>
        </div>

        <section className="summary-grid" aria-label="Voorraadsamenvatting">
          <article className="summary-card"><span className="summary-label">TOTAAL ARTIKELEN</span><strong>{allItems.length}</strong><span className="summary-caption">Verschillende producten</span><span className="summary-icon">▦</span></article>
          <article className="summary-card"><span className="summary-label">OP VOORRAAD</span><strong>{availableCount}</strong><span className="summary-caption">Direct beschikbaar</span><span className="summary-icon icon-teal">✓</span></article>
          <article className="summary-card"><span className="summary-label">AANVULLEN NODIG</span><strong>{emptyCount}</strong><span className="summary-caption">Niet beschikbaar</span><span className="summary-icon icon-coral">!</span></article>
        </section>

        <div className="inventory-toolbar">
          <div><h2>Voorraad overzicht</h2><p>Beheer producten en voorraad.</p></div>
          <label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Zoek een artikel..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>

        {apiError && <p className="form-error" role="alert">{apiError}</p>}

        <section className="add-product-panel">
          <div><h2>Product toevoegen</h2><p>Begin met een lege voorraad en voeg je eigen producten toe.</p></div>
          <form className="add-product-form" onSubmit={handleAddProduct}>
            <label>Productnaam<input name="productName" placeholder="Bijv. Kartonnen dozen" required maxLength={80} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
            <label>Categorie<input name="productCategory" placeholder="Bijv. Verpakking" required maxLength={50} value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></label>
            <label>Aantal<input name="productQuantity" type="number" min="0" step="1" required value={productForm.quantity} onChange={(event) => setProductForm({ ...productForm, quantity: event.target.value })} /></label>
            <label>Eenheid<input name="productUnit" placeholder="stuks, rollen..." required maxLength={20} value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })} /></label>
            <button className="button button-dark" type="submit">+ Product toevoegen</button>
          </form>
        </section>

        <div className="stock-columns">
          <section className="stock-panel available-panel">
            <div className="panel-heading"><div className="panel-title"><span className="panel-dot teal-dot" /><h3>Op voorraad</h3><span className="count-badge">{availableCount}</span></div><span className="panel-subtitle">Artikelen beschikbaar</span></div>
            <div className="item-list">{availableItems.map(renderItem)}</div>
            {availableItems.length === 0 && <div className="empty-message">Geen beschikbare artikelen gevonden.</div>}
          </section>
          <section className="stock-panel empty-panel">
            <div className="panel-heading"><div className="panel-title"><span className="panel-dot coral-dot" /><h3>Niet op voorraad</h3><span className="count-badge coral-badge">{emptyCount}</span></div><span className="panel-subtitle">Moeten worden aangevuld</span></div>
            <div className="item-list">{emptyItems.map(renderItem)}</div>
            {emptyItems.length === 0 && <div className="empty-message">Geen artikelen gevonden.</div>}
          </section>
        </div>

        <p className="inventory-hint"><span>i</span> Na het inloggen kun je namen en aantallen wijzigen. De gegevens worden opgeslagen in de database.</p>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/dashboard"><span className="brand-mark">V</span><span>VistaFlow</span></Link>
        <span>Een helder overzicht, elke dag.</span>
        <span>© 2026 VistaFlow</span>
      </footer>

      {selectedItem && (
        <div className="delete-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedItem(null);
        }}>
          <section className="delete-modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="delete-modal-icon">🗑</div>
            <p className="delete-modal-kicker">PRODUCT VERWIJDEREN</p>
            <h2 id="delete-modal-title">Weet je het zeker?</h2>
            <p className="delete-modal-copy">Je staat op het punt <strong>{selectedItem.name}</strong> uit je voorraad te verwijderen. Dit kan niet automatisch ongedaan worden gemaakt.</p>
            <div className="delete-modal-actions">
              <button className="button button-outline" type="button" onClick={() => setSelectedItem(null)}>Annuleren</button>
              <button className="delete-confirm-button" type="button" onClick={handleDelete}>Verwijderen <span>→</span></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
