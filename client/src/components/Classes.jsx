import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Classes.css';
import { FaPlus } from 'react-icons/fa';

const Classes = () => {
  const [clases, setClases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materia, setMateria] = useState('');
  const [contrasena, setContrasena] = useState('');

  // Función para obtener las clases del backend
  const fetchClases = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/clases');
      const data = await res.json();
      console.log("Clases recibidas:", data);
      setClases(data);
    } catch (error) {
      console.error('Error al obtener las clases:', error);
    }
  };

  useEffect(() => {
    fetchClases();
  }, []);

  const handleCreateClase = async (e) => {
    e.preventDefault();
    if (!materia || !contrasena) {
      alert('Por favor, ingresa todos los campos');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch('http://localhost:5000/api/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia,
          contrasena,
          creador_id: user.id,
        }),
      });
      if (res.ok) {
        await fetchClases();
        setMateria('');
        setContrasena('');
        setIsModalOpen(false);
      } else {
        alert('Error al crear la clase');
      }
    } catch (error) {
      console.error('Error al crear la clase:', error);
    }
  };

  return (
    <div className="classes-page">
      <h1>Clases</h1>

      <div className="classes-list">
        {clases.map((clase) => (
          <div key={clase.id} className="class-card">
            {/* Parte superior en verde */}
            <div className="class-card-top">
              <h3>{clase.materia}</h3>
              <p>Creado por: {clase.creador_nombre}</p>
              <p>Número de alumnos: {clase.num_alumnos || 0}</p>
            </div>
            {/* Parte inferior en blanco */}
            <div className="class-card-bottom">
              <Link to={`/classes/${clase.id}`}>
                <button className="class-card-button">Ver Detalle</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Botón flotante para agregar una nueva clase */}
      <button className="add-class-btn" onClick={() => setIsModalOpen(true)}>
        <FaPlus />
      </button>

      {/* Modal para crear una nueva clase */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              X
            </button>
            <h2>Crear Nueva Clase</h2>
            <form onSubmit={handleCreateClase} className="create-class-form">
              <div className="form-group">
                <label>Materia:</label>
                <input
                  type="text"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Ingresa la materia"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña de la clase:</label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  required
                />
              </div>
              <button type="submit">Crear Clase</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
