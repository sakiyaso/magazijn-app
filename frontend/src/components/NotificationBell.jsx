import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NEW_RESERVATION_EVENT, describe } from './reservationNotifications';
import './NotificationBell.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const HISTORY_LIMIT = 20;

function storageKey(accountId) {
  return `vistaflow-meldingen-gezien-${accountId}`;
}

function readLastSeen(accountId) {
  try {
    const value = window.localStorage.getItem(storageKey(accountId));
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

function saveLastSeen(accountId, id) {
  try {
    window.localStorage.setItem(storageKey(accountId), String(id));
  } catch {
    // Zonder opslag werkt het overzicht nog, alleen onthoudt het niet wat gelezen is
  }
}

function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'zojuist';
  if (minutes < 60) return `${minutes} min geleden`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} uur geleden`;
  return new Date(value).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function NotificationBell({ user }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(user.id));
  // Bij openen: onthouden wat nog nieuw was, zodat dat gemarkeerd blijft terwijl het paneel open is
  const [highlightAbove, setHighlightAbove] = useState(null);
  const wrapperRef = useRef(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/docent/reserveringen?limit=${HISTORY_LIMIT}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setItems(data);
      // Eerste keer op dit apparaat: bestaande reserveringen tellen als gelezen
      setLastSeen((current) => {
        if (current !== null) return current;
        const newest = data[0]?.id ?? 0;
        saveLastSeen(user.id, newest);
        return newest;
      });
    } catch (error) {
      console.error(error);
    }
  }, [user.id, user.token]);

  useEffect(() => {
    const timer = window.setTimeout(loadItems, 0);
    window.addEventListener(NEW_RESERVATION_EVENT, loadItems);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(NEW_RESERVATION_EVENT, loadItems);
    };
  }, [loadItems]);

  // Paneel sluiten met Escape of een klik ernaast
  useEffect(() => {
    if (!open) return undefined;
    const closeOnClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const newestId = items[0]?.id ?? 0;
  const unreadCount = lastSeen === null ? 0 : items.filter((item) => item.id > lastSeen).length;

  const markAllRead = () => {
    setLastSeen(newestId);
    saveLastSeen(user.id, newestId);
  };

  const toggle = () => {
    if (!open) {
      setHighlightAbove(lastSeen);
      markAllRead();
    }
    setOpen(!open);
  };

  return (
    <div className="notification-bell" ref={wrapperRef}>
      <button
        className="notification-bell-button"
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unreadCount ? `Meldingen, ${unreadCount} nieuw` : 'Meldingen'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0-6 6v3.6L4.3 15.4A1 1 0 0 0 5.2 17h13.6a1 1 0 0 0 .9-1.6L18 12.6V9a6 6 0 0 0-6-6Z" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Meldingen">
          <div className="notification-panel-header">
            <strong>Meldingen</strong>
            <span>Laatste {HISTORY_LIMIT} reserveringen</span>
          </div>
          {items.length === 0 ? (
            <p className="notification-empty">Nog geen reserveringen.</p>
          ) : (
            <ul className="notification-list">
              {items.map((item) => (
                <li key={item.id} className={highlightAbove !== null && item.id > highlightAbove ? 'is-new' : ''}>
                  <span className="notification-dot" aria-hidden="true" />
                  <div>
                    <span>{describe(item)}</span>
                    <time dateTime={item.aangemaakt_op}>{timeAgo(item.aangemaakt_op)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link className="notification-panel-footer" to="/docent/reserveringen" onClick={() => setOpen(false)}>
            Alle reserveringen bekijken <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
