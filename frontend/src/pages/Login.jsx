import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLogin }) {
  const [naam, setNaam] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(naam);
  };

  return (
    <div className="login">
      <h1>Inloggen</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
        />
        <button type="submit">Inloggen</button>
      </form>
    </div>
  );
}

export default Login;
