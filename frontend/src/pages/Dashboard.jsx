import { useEffect, useState } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [producten, setProducten] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/producten')
      .then((res) => res.json())
      .then((data) => setProducten(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="producten-lijst">
        {producten.map((p) => (
          <div key={p.id} className="product-kaart">
            <strong>{p.naam}</strong>
            <span>{p.categorie}</span>
            <span>{p.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
