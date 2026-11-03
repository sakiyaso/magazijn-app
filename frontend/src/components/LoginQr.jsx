import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
const API_URL = import.meta.env.VITE_API_URL ?? '';

function LoginQr({ rol, label, onLogin }) {
    const [requestId, setRequestId] = useState(null);
    const [src, setSrc] = useState('');
    const onLoginRef = useRef(onLogin);

    useEffect(() => {
        onLoginRef.current = onLogin;
    });

    // Nieuwe aanvraag starten, en opnieuw zodra de vorige verloopt
    useEffect(() => {
        if (requestId) return;
        fetch(`${API_URL}/api/qr-login/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol }),
        })
            .then((response) => response.json())
            .then((data) => setRequestId(data.id))
            .catch(console.error);
    }, [requestId, rol]);

    // QR tonen en elke 2 seconden vragen of de telefoon heeft bevestigd
    useEffect(() => {
        if (!requestId) return;
        QRCode.toDataURL(`${PUBLIC_URL}/qr-login/${requestId}`, { width: 200, margin: 1 })
            .then(setSrc)
            .catch(console.error);

        const timer = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/qr-login/status/${requestId}`);
                if (!response.ok) {
                    // Verlopen of ongeldig (404): nieuwe QR-code aanvragen
                    clearInterval(timer);
                    setRequestId(null);
                    return;
                }
                const data = await response.json();
                if (data.status === 'approved') {
                    clearInterval(timer);
                    onLoginRef.current(data);
                }
            } catch (error) {
                console.error(error);
            }
        }, 2000);
        return () => clearInterval(timer);
    }, [requestId]);

    return (
        <div className="login-qr">
            {src && <img src={src} alt={`QR-code: inloggen als ${label}`} width={200} height={200} />}
            <span>{label}</span>
        </div>
    );
}

export default LoginQr;
