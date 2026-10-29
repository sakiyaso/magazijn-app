import './Homepage.css';
import { Link } from 'react-router-dom';
import LoginQr from '../components/LoginQr';

function Homepage() {
  return (
    <div className="homepage">

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> OVERZICHTELIJK VOORRAAD BEHEREN</p>
            <h1>Alles op voorraad.<br /><span>Alles onder controle.</span></h1>
            <p className="hero-text">Een duidelijk overzicht van wat er in het magazijn ligt en welke producten aangevuld moeten worden. Zo weet je meteen waar je aan toe bent.</p>
            <div className="hero-actions">
              <Link className="button button-dark" to="/dashboard">Bekijk het magazijn <span>→</span></Link>
              <Link className="text-link" to="/login">Inloggen op je account</Link>
            </div>
            <div className="hero-stats">
              <div><strong>01</strong><span>Één duidelijk overzicht</span></div>
              <div><strong>02</strong><span>Snel voorraad controleren</span></div>
            </div>
            <div className="hero-qr">
              <h2>Scan om in te loggen</h2>
              <div className="qr-codes">
                <LoginQr rol="student" label="Student" />
                <LoginQr rol="docent" label="Docent" />
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-top">
              <span>MAGAZIJN STATUS</span>
              <span className="status-pill"><i /> Live overzicht</span>
            </div>
            <div className="warehouse-illustration" aria-hidden="true">
              <div className="shelf shelf-one">
                <div className="shelf-line" /><div className="crate coral" /><div className="crate cream" />
                <div className="crate teal" /><div className="crate coral small" /><div className="shelf-line" />
              </div>
              <div className="shelf shelf-two">
                <div className="shelf-line" /><div className="crate cream" /><div className="crate teal" />
                <div className="crate coral" /><div className="crate cream small" /><div className="shelf-line" />
              </div>
              <div className="floor-line" />
            </div>
            <div className="visual-bottom">
              <div><span className="legend-dot in-stock" /><span>Op voorraad</span></div>
              <div><span className="legend-dot low-stock" /><span>Aanvullen nodig</span></div>
              <Link to="/dashboard">Open voorraad <span>↗</span></Link>
            </div>
          </div>
        </section>

        <section className="feature-row">
          <article className="feature">
            <span className="feature-number">01 / OVERZICHT</span>
            <h2>Alles op één plek</h2>
            <p>Bekijk direct welke artikelen beschikbaar zijn en welke op zijn.</p>
          </article>
          <article className="feature">
            <span className="feature-number">02 / VOORRAAD</span>
            <h2>Weet wat ontbreekt</h2>
            <p>Producten zonder voorraad staan apart, zodat ze niet over het hoofd worden gezien.</p>
          </article>
          <article className="feature">
            <span className="feature-number">03 / EENVOUDIG</span>
            <h2>Snel bijgewerkt</h2>
            <p>Pas aantallen aan vanuit het magazijnoverzicht.</p>
          </article>
        </section>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">V</span>
          <span>VistaFlow</span>
        </Link>
        <span>Een helder overzicht, elke dag.</span>
        <span>© 2026 VistaFlow</span>
      </footer>
    </div>
  );
}

export default Homepage;