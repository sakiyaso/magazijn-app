import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin;

function LoginQr({ rol, label }) {
    const [src, setSrc] = useState('');
    const url = `${PUBLIC_URL}/login?rol=${rol}`;

    useEffect(() => {
        QRCode.toDataURL(url, { width: 200, margin: 1 })
            .then(setSrc)
            .catch(console.error);
    }, [url]);

    return (
        <a className="login-qr" href={url}> 
            {src && <img src={src} alt={`QR-code: inloggen als ${label}`} width={200} height={200} />}
            <span>{label}</span>
        </a>
    );
}

export default LoginQr;