// client/src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import icono from '../assets/Logo.jpeg';
import { 
  FaUniversity, 
  FaBriefcase, 
  FaComments, 
  FaCalendarAlt, 
  FaSignOutAlt, 
  FaBook, 
  FaClipboard, 
  FaBars, 
  FaTimes 
} from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  // Para escritorio, el menú puede mostrarse abierto, pero en móviles lo mantenemos contraído por defecto.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    if (user) {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="logo">
          <img src={icono} alt="Logo" className="navbar-logo" />
        </div>
        {user && (
          <p className="user-name">
            <span>Sesión iniciada con:</span> {user.nombre}
          </p>
        )}
        {/* Ícono de menú para móviles */}
        <div className="menu-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      <div className={`navbar-middle ${isOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          <li>
            <Link to="/university" className="nav-item">
              <FaUniversity className="nav-icon" />
              Universidad
            </Link>
          </li>
          <li>
            <Link to="/jobs" className="nav-item">
              <FaBriefcase className="nav-icon" />
              Ofertas de Trabajo
            </Link>
          </li>
          <li>
            <Link to="/calendar" className="nav-item">
              <FaCalendarAlt className="nav-icon" />
              Calendario
            </Link>
          </li>
          <li>
            <Link to="/chat" className="nav-item">
              <FaComments className="nav-icon" />
              Mensajería
            </Link>
          </li>
          <li>
            <Link to="/classes" className="nav-item">
              <FaBook className="nav-icon" />
              Clases
            </Link>
          </li>
          <li>
            <Link to="/exams" className="nav-item">
              <FaClipboard className="nav-icon" />
              Exámenes
            </Link>
          </li>
        </ul>
      </div>

      <div className="navbar-bottom">
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="nav-icon" />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
