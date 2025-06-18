import React from 'react';
export default function NotFound() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#e74c3c' }}>404</h1>
      <p>Página no encontrada. Verifica la URL o regresa al <a href="/">inicio</a>.</p>
    </div>
  );
}
