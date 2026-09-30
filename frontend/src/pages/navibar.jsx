import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">VistaFlow</span>
        <Link to="/login" className="navbar-link">Login</Link>
      </div>

      <svg className="navbar-curve" viewBox="0 0 1440 24" preserveAspectRatio="none">
        <path d="M0,8 C480,24 960,0 1440,12 L1440,24 L0,24 Z" />
      </svg>
    </nav>
  );
}

export default Navbar;