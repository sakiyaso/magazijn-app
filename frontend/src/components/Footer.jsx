import { Link } from 'react-router-dom';
import vistaflowLogo from '../assets/vistaflow_combined_bold.svg';
import './Footer.css';

function Footer() {
    const home = '/'; 
    
    return (
        <footer className="site-footer">
            <Link className="site-footer-brand" to={home}>
                <img src={vistaflowLogo} alt="VistaFlow" />
            </Link>
            <span className="site-footer-tagline">Een helder overzicht, elke dag.</span>
            <span>© {new Date().getFullYear()} VistaFlow</span>
        </footer>
    );
}

export default Footer;