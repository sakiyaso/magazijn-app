import {useEffect, useState} from "react";
import QRCode from "qrcode";

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin;

function LinkQr({ to = '/', label }) {
    const [src, setSrc] = useState('');
    const url = `${PUBLIC_URL}${to}`;

    useEffect(() => {
        QRCode.toDataURL(url, { width: 200, margin: 1 })
            .then(setSrc)
            .catch(console.error);
    }, [url]);

    return (
        <div className="login-qr">
            {src && <img src={src} alt={`QR-code: ${label}`} width={200} height={200} />}
            <span>{label}</span>
        </div>
    );
}

export default LinkQr;