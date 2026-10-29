import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';
import LoginQr from '../components/LoginQr';

const API_URL = import.meta.env.VITE_API_URL ?? '';

function Login({ onLogin }) {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('rol');
  const [role, setRole] = useState(roleFromUrl === 'student' || roleFromUrl === 'docent' ? roleFromUrl : '');
  const [accountMode, setAccountMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (accountMode && password !== confirmation) {
      setError('De wachtwoorden zijn niet hetzelfde.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountMode ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountMode
          ? { naam: name.trim(), email: email.trim().toLowerCase(), wachtwoord: password, rol: role }
          : { email: email.trim().toLowerCase(), wachtwoord: password, rol: role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Inloggen is niet gelukt.');
      onLogin(data);
      navigate(data.rol === 'docent' ? '/dashboard' : '/reserveren');
    } catch (submitError) {
      setError(submitError.message || 'De server is niet bereikbaar.');
    }
  };

  return (
    <div className="login-page">

      <main className="login-layout">
        <section className="login-intro">
          <p className="eyebrow"><span className="eyebrow-dot" /> VISTAFLOW</p>
          <h1>{role ? <>Welkom,<br /><span>{role}.</span></> : <>Kies je<br /><span>rol.</span></>}</h1>
          <p>{role ? 'Log in of maak een account.' : 'Student of docent?'}</p>
        </section>

        <section className="login-card">
          {!role ? (
            <div className="role-choice">
              <div className="card-heading">
                <span className="card-kicker">INLOGGEN</span>
                <h2>Kies je rol</h2>
              </div>
              <div className="role-option">
                <button className="role-card" type="button" onClick={() => setRole('student')}>
                  <span>Student</span><span aria-hidden="true">→</span>
                </button>
                <LoginQr rol="student" label="Scan als student" />
              </div>
              <div className="role-option">
                <button className="role-card" type="button" onClick={() => setRole('docent')}>
                  <span>Docent</span><span aria-hidden="true">→</span>
                </button>
                <LoginQr rol="docent" label="Scan als docent" />
              </div>
            </div>
          ) : (
            <>
              <div className="card-heading">
                <span className="card-kicker">{role === 'student' ? 'STUDENT' : 'DOCENT'}</span>
                <h2>{accountMode ? 'Account maken' : 'Inloggen'}</h2>
                <p>{accountMode ? 'Vul je gegevens in.' : 'Log in met je account.'}</p>
              </div>
              <form onSubmit={handleSubmit}>
                {accountMode && (
                  <>
                    <label htmlFor="account-name">Naam</label>
                    <input id="account-name" name="name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
                  </>
                )}
                <label htmlFor="account-email">E-mailadres</label>
                <input id="account-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                <label htmlFor="account-password">Wachtwoord</label>
                <input id="account-password" name="password" type="password" minLength={8} autoComplete={accountMode ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} />
                {accountMode && (
                  <>
                    <label htmlFor="account-confirmation">Herhaal wachtwoord</label>
                    <input id="account-confirmation" name="confirm" type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                  </>
                )}
                <div className="form-error" role="status" aria-live="polite">{error}</div>
                <button className="button button-dark button-full" type="submit">
                  {accountMode ? 'Account maken' : 'Inloggen'} <span>→</span>
                </button>
              </form>
              <button className="button button-outline button-full create-account-link" type="button" onClick={() => {
                setAccountMode(!accountMode);
                setError('');
              }}>
                {accountMode ? 'Terug naar inloggen' : 'Account maken'}
              </button>
              <button className="role-back" type="button" onClick={() => {
                setRole('');
                setAccountMode(false);
                setError('');
              }}>
                Andere rol kiezen
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Login;
