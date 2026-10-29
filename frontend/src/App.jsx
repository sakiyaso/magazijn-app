import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentReservations from './pages/StudentReservations';
import TeacherReservations from './pages/TeacherReservations';
import './App.css';
import Navbar from './components/Navbar';

function getSavedUser() {
  try {
    return JSON.parse(window.localStorage.getItem('voorraadbeheer-session')) || null;
  } catch {
    window.localStorage.removeItem('voorraadbeheer-session');
    return null;
  }
}

function App() {
  const [user, setUser] = useState(getSavedUser);

  const handleLogin = (session) => {
    window.localStorage.setItem('voorraadbeheer-session', JSON.stringify(session));
    setUser(session);
  };

  const handleLogout = async () => {
    if (user?.token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/accounts/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error('De sessie kon niet op de server worden afgesloten.');
      } catch (error) {
        console.error(error);
      }
    }
    window.localStorage.removeItem('voorraadbeheer-session');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/"
          element={user
            ? <Navigate to={user.rol === 'docent' ? '/dashboard' : '/reserveren'} replace />
            : <Homepage />}
        />
        <Route path="/login" element={user ? <Navigate to={user.rol === 'docent' ? '/dashboard' : '/reserveren'} replace /> : <Login onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={user?.rol === 'docent'
            ? <Dashboard user={user} />
            : <Navigate to={user?.rol === 'student' ? '/reserveren' : '/login'} replace />}
        />
        <Route
          path="/reserveren"
          element={user?.rol === 'student'
            ? <StudentReservations user={user} />
            : <Navigate to={user?.rol === 'docent' ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="/docent/reserveringen"
          element={user?.rol === 'docent'
            ? <TeacherReservations user={user} />
            : <Navigate to={user?.rol === 'student' ? '/reserveren' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
