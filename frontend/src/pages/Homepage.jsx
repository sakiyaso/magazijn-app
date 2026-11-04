import './Homepage.css';
import { Link } from 'react-router-dom';
import LoginQr from '../components/LoginQr';
import LinkQr from '../components/LinkQr';

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
          </div>
          <div className="hero-visual">
            <LinkQr to="/" />
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
    </div>
  );
}

export default Homepage;