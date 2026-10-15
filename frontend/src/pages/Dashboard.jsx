import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const STORAGE_KEY = 'voorraadbeheer-items-v2';

function loadStoredItems() {
  try {
    const storedItems = window.localStorage.getItem(STORAGE_KEY);
    return storedItems ? JSON.parse(storedItems) : [];
  } catch {
    return [];
  }
}

function getSymbol(name) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function Dashboard() {
  const [items, setItems] = useState(loadStoredItems);
  const [apiItems, setApiItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', category: '', quantity: '0', unit: 'stuks' });
  const loggedUser = window.localStorage.getItem('voorraadbeheer-user');

  useEffect(() => {
    fetch('http://localhost:3000/api/producten')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setApiItems(data.map((product, index) => {
          const name = product.naam ?? product.name ?? `Product ${index + 1}`;
          return {
            id: `api-${product.id ?? index}`,
            name,
            category: product.categorie ?? product.category ?? '',
            code: product.code ?? '',
            quantity: Number(product.aantal ?? product.quantity ?? 0),
            unit: product.eenheid ?? product.unit ?? 'stuks',
            symbol: product.code || getSymbol(name),
            readOnly: true,
          };
        }));
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!selectedItem) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedItem]);

  const allItems = [...apiItems, ...items];
  const normalizedSearch = search.trim().toLowerCase();
  const matchingItems = allItems.filter((item) => (
    `${item.name} ${item.category}`.toLowerCase().includes(normalizedSearch)
  ));
  const availableItems = matchingItems.filter((item) => item.quantity > 0);
  const emptyItems = matchingItems.filter((item) => item.quantity <= 0);
  const availableCount = allItems.filter((item) => item.quantity > 0).length;
  const emptyCount = allItems.filter((item) => item.quantity <= 0).length;

  const handleAddProduct = (event) => {
    event.preventDefault();
    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const unit = productForm.unit.trim();
    if (!name || !category || !unit) return;

    const nextId = items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
    setItems([...items, {
      id: nextId,
      name,
      category,
      quantity: Math.max(0, Number.parseInt(productForm.quantity, 10) || 0),
      unit,
      symbol: getSymbol(name),
    }]);
    setProductForm({ name: '', category: '', quantity: '0', unit: 'stuks' });
  };

  const handleRename = (item) => {
    const name = window.prompt('Nieuwe artikelnaam:', item.name);
    if (name === null) return;
    const cleanName = name.trim();
    if (!cleanName) {
      window.alert('De artikelnaam mag niet leeg zijn.');
      return;
    }
    setItems(items.map((storedItem) => (
      storedItem.id === item.id
        ? { ...storedItem, name: cleanName, symbol: getSymbol(cleanName) }
        : storedItem
    )));
  };

  const handleQuantityChange = (item, change) => {
    setItems(items.map((storedItem) => (
      storedItem.id === item.id
        ? { ...storedItem, quantity: Math.max(0, storedItem.quantity + change) }
        : storedItem
    )));
  };

  const handleDelete = () => {
    setItems(items.filter((item) => item.id !== selectedItem.id));
    setSelectedItem(null);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('voorraadbeheer-user');
    window.location.assign('/login');
  };

  const renderItem = (item) => (
    <article className="stock-item" key={`${item.readOnly ? 'api' : 'local'}-${item.id}`}>
      <div className="item-symbol">{item.symbol}</div>
      <div className="item-info">
        <div className="item-name-line">
          <strong>{item.name}</strong>
          {loggedUser && !item.readOnly && (
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
      {!item.readOnly && (
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
      )}
    </article>
  );

  return (
    <div className="dashboard">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">V</span>
          <span>VistaFlow</span>
        </Link>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <Link to="/">Home</Link>
          <Link className="active" to="/dashboard">Magazijn</Link>
        </nav>
        <div className="header-actions">
          <span className="user-label">{loggedUser || 'Demo-overzicht'}</span>
          {loggedUser && <button className="button button-outline" type="button" onClick={handleLogout}>Uitloggen</button>}
          {!loggedUser && <Link className="button button-outline top-login" to="/login">Inloggen <span>↗</span></Link>}
        </div>
      </header>

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
          <div><h2>Voorraad overzicht</h2><p>Voeg zelf producten toe en beheer de aantallen met plus en min.</p></div>
          <label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Zoek een artikel..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>

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

        <p className="inventory-hint"><span>i</span> Na het inloggen kun je namen en aantallen wijzigen. De gegevens worden alleen in deze browser bewaard.</p>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/"><span className="brand-mark">V</span><span>VistaFlow</span></Link>
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
