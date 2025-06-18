// ListaUsuarios.jsx
import React, { useEffect, useState } from 'react';

function ListaUsuarios({ onSelectUser, selectedUser }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/usuarios')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => setUsuarios(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="users-section">
      <h3 className="users-title">Lista de Usuarios</h3>
      <div className="users-list">
        {usuarios.length === 0 ? (
          <p>No hay usuarios registrados</p>
        ) : (
          usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className={`user-card ${selectedUser && selectedUser.id === usuario.id ? 'selected' : ''}`}
              onClick={() => onSelectUser(usuario)}
            >
              {usuario.nombre}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ListaUsuarios;
