import { useEffect, useRef, useState } from 'react';
import { NEW_RESERVATION_EVENT, describe } from './reservationNotifications';
import './ReservationNotifier.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const POLL_INTERVAL = 10000;
const TOAST_DURATION = 8000;

function getPermission() {
  if (!('Notification' in window) || !window.isSecureContext) return 'unsupported';
  return Notification.permission;
}

// Korte "ping" via Web Audio, zodat er geen geluidsbestand nodig is
function playPing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(1320, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    oscillator.connect(gain).connect(context.destination);
    oscillator.onended = () => context.close();
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  } catch {
    // Geluid is optioneel; de melding verschijnt ook zonder
  }
}

function ReservationNotifier({ token }) {
  const [toasts, setToasts] = useState([]);
  const [permission, setPermission] = useState(getPermission);
  const [askLater, setAskLater] = useState(false);
  const lastIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const announce = (reservations) => {
      setToasts((current) => [...current, ...reservations].slice(-4));
      reservations.forEach((reservation) => {
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== reservation.id));
        }, TOAST_DURATION);
      });
      playPing();

      // Systeemmelding alleen als het tabblad niet in beeld is
      if (document.hidden && getPermission() === 'granted') {
        const body = reservations.length === 1
          ? describe(reservations[0])
          : `${reservations.length} nieuwe reserveringen`;
        new Notification('Nieuwe reservering', { body, tag: 'vistaflow-reservering' });
      }

      window.dispatchEvent(new CustomEvent(NEW_RESERVATION_EVENT));
    };

    const check = async () => {
      try {
        const query = lastIdRef.current === null ? '' : `?na=${lastIdRef.current}`;
        const response = await fetch(`${API_URL}/api/docent/reserveringen/nieuw${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const isFirstCheck = lastIdRef.current === null;
        lastIdRef.current = data.laatste_id;
        if (!isFirstCheck && data.reserveringen.length) announce(data.reserveringen);
      } catch (error) {
        console.error(error);
      }
    };

    const firstCheck = window.setTimeout(check, 0);
    const timer = window.setInterval(check, POLL_INTERVAL);
    return () => {
      cancelled = true;
      window.clearTimeout(firstCheck);
      window.clearInterval(timer);
    };
  }, [token]);

  const askPermission = async () => {
    setPermission(await Notification.requestPermission());
  };

  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <div className="reservation-toasts" aria-live="polite">
      {permission === 'default' && !askLater && (
        <div className="reservation-toast reservation-toast-permission">
          <div>
            <strong>Meldingen aanzetten?</strong>
            <span>Krijg ook een melding als dit tabblad op de achtergrond staat.</span>
            <div className="reservation-toast-actions">
              <button type="button" onClick={askPermission}>Aanzetten</button>
              <button type="button" onClick={() => setAskLater(true)}>Niet nu</button>
            </div>
          </div>
        </div>
      )}
      {toasts.map((reservation) => (
        <div className="reservation-toast" key={reservation.id} role="status">
          <span className="reservation-toast-dot" aria-hidden="true" />
          <div>
            <strong>Nieuwe reservering</strong>
            <span>{describe(reservation)}</span>
          </div>
          <button className="reservation-toast-close" type="button" aria-label="Melding sluiten" onClick={() => dismiss(reservation.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

export default ReservationNotifier;
