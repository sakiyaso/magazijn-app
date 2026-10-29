import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

const LINKS = {
  docent: [
    { to: '/dashboard', label: 'Magazijn' },
    { to: '/docent/reserveringen', label: 'Reserveringen' },
  ],
  student: [
    { to: '/reserveren', label: 'Reserveren' },
  ],
  gast: [
    { to: '/', label: 'Home', end: true },
    { to: '/dashboard', label: 'Magazijn' },
  ],
};

function Navbar({ user, onLogout }) {
  const links = LINKS[user?.rol] || LINKS.gast;
  const home = !user ? '/' : user.rol === 'docent' ? '/dashboard' : '/reserveren';

  return (
    <header className="topbar">
      <Link className="brand" to={home}>
        <span className="brand-mark">V</span>
        <span>VistaFlow</span>
      </Link>
      <nav className="nav" aria-label="Hoofdnavigatie">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {user ? (
        <div className="header-actions">
          <span className="user-label">{user.naam}</span>
          <button className="button button-outline" type="button" onClick={onLogout}>
            Uitloggen
          </button>
        </div>
      ) : (
        <Link className="button button-outline top-login" to="/login">
          Inloggen <span aria-hidden="true">↗</span>
        </Link>
      )}
    </header>
  );
}

export default Navbar;
