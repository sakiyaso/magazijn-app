import './Homepage.css';

function Homepage() {
  return (
    <div className="homepage">
      <header className="hero">
        <div className="hero-content">
          <div className="hero-search">
            <input type="text" placeholder="Search:" />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <svg className="hero-curve" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,40 C480,120 960,0 1440,60 L1440,120 L0,120 Z" />
        </svg>
      </header>

      <main className="homepage-body">
        {/* resultaten / content hier */}
      </main>
    </div>
  );
}

export default Homepage;