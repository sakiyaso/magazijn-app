import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function QrApprove({ user }) {
    const { id } = useParams();
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    if (!user) {
        return <Navigate to={`/login?next=${encodeURIComponent(`/qr-login/${id}`)}`} replace />;
    }

    const approve = async () => {
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/qr-login/approve/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setStatus('done');
        } catch (approveError) {
            setError(approveError.message || 'Bevestigen is niet gelukt.');
        }
    };

    return (
        <main className="qr-approve">
          {status === 'done' ? (
            <h1>Je bent ingelogd op de computer.</h1>
          ) : (
            <>
              <h1>Inloggen op de computer</h1>
              <p>Je logt in als <strong>{user.naam}</strong> ({user.rol}).</p>
              <p>Bevestig alleen als je deze QR-code zelf net hebt gescand.</p>
              <button className="button button-dark" type="button" onClick={approve}>Bevestigen</button>
              {error && <p className="error">{error}</p>}
            </>
          )}
        </main>
    );
}

export default QrApprove;
