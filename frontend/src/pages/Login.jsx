import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLogin }) {
  const [accountMode, setAccountMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    let accounts;

    try {
      accounts = JSON.parse(window.localStorage.getItem('voorraadbeheer-accounts') || '[]');
    } catch {
      accounts = [];
    }

    if (!cleanEmail || password.length < 4) {
      setError('Controleer je e-mailadres en wachtwoord.');
      return;
    }

    if (accountMode) {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Vul je naam in.');
        return;
      }
      if (password !== confirmation) {
        setError('De wachtwoorden zijn niet hetzelfde.');
        return;
      }
      if (accounts.some((account) => account.email === cleanEmail)) {
        setError('Er bestaat al een account met dit e-mailadres.');
        return;
      }

      const newAccount = { name: cleanName, email: cleanEmail, password };
      window.localStorage.setItem('voorraadbeheer-accounts', JSON.stringify([...accounts, newAccount]));
      window.localStorage.setItem('voorraadbeheer-user', cleanEmail);
      onLogin(cleanName);
      navigate('/dashboard');
      return;
    }

    let activeAccount;
    if (accounts.length > 0) {
      activeAccount = accounts.find((account) => account.email === cleanEmail && account.password === password);
      if (!activeAccount) {
        setError('Dit e-mailadres of wachtwoord klopt niet.');
        return;
      }
    }

    window.localStorage.setItem('voorraadbeheer-user', cleanEmail);
    onLogin(activeAccount?.name || cleanEmail);
    navigate('/dashboard');
  };

  return (
    <div className={`login-page${accountMode ? ' account-mode' : ''}`}>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>VistaFlow</span>
        </a>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <a href="/">Home</a>
          <a href="/dashboard">Magazijn</a>
        </nav>
        <a className="button button-outline top-login" href="/login">Inloggen <span aria-hidden="true">↗</span></a>
      </header>

      <main className="login-layout">
        <section className="login-intro">
          <p className="eyebrow"><span className="eyebrow-dot" />{accountMode ? 'BEGIN MET VISTAFLOW' : 'GOED OM JE WEER TE ZIEN'}</p>
          <h1>{accountMode ? <>Maak je<br /><span>account.</span></> : <>Welkom<br /><span>terug.</span></>}</h1>
          <p>{accountMode ? 'Maak een account aan om in te loggen en het magazijn te bekijken.' : 'Log in om het magazijn te bekijken en de voorraad bij te werken.'}</p>
        </section>

        <section className="login-card">
          <div className="card-heading">
            <span className="card-kicker">{accountMode ? 'NIEUW ACCOUNT' : 'ACCOUNT'}</span>
            <h2>{accountMode ? 'Account maken' : 'Inloggen'}</h2>
            <p>{accountMode ? 'Vul hieronder je gegevens in.' : 'Vul je gegevens in om verder te gaan.'}</p>
          </div>
          <form onSubmit={handleSubmit}>
            {accountMode && (
              <>
                <label htmlFor="account-name">Naam</label>
                <input id="account-name" name="name" type="text" placeholder="Je naam" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
              </>
            )}
            <label htmlFor="account-email">E-mailadres</label>
            <input id="account-email" name="email" type="email" placeholder="naam@bedrijf.nl" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <label htmlFor="account-password">Wachtwoord</label>
            <input id="account-password" name="password" type="password" placeholder="Minimaal 4 tekens" minLength={4} autoComplete={accountMode ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} />
            {accountMode && (
              <>
                <label htmlFor="account-confirmation">Herhaal wachtwoord</label>
                <input id="account-confirmation" name="confirm" type="password" placeholder="Vul je wachtwoord opnieuw in" minLength={4} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              </>
            )}
            <div className="form-error" role="status" aria-live="polite">{error}</div>
            <button className="button button-dark button-full" type="submit">
              {accountMode ? 'Account aanmaken' : 'Inloggen'} <span>→</span>
            </button>
          </form>
          <p className="login-foot">{accountMode ? 'Heb je al een account?' : 'Nog geen account?'}</p>
          <button
            className="button button-outline button-full create-account-link"
            type="button"
            onClick={() => {
              setAccountMode(!accountMode);
              setError('');
            }}
          >
            {accountMode ? 'Terug naar inloggen' : 'Account maken'} <span>→</span>
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="/">
          <span className="brand-mark">V</span>
          <span>VistaFlow</span>
        </a>
        <span>Een helder overzicht, elke dag.</span>
        <span>© 2026 VistaFlow</span>
      </footer>
    </div>
  );
}

export default Login;
