import React from 'react';
export default function NotFound() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#e74c3c' }}>404</h1>
      <h2 style={{ fontSize: '2rem', color: '#2c3e50' }}>Página no encontrada</h2>
      <p> Verifica la URL o regresa al <a href="/">inicio</a>.</p>
    </div>
  );
}
