// client/src/components/Calendar.jsx
import React from 'react';
import calendarImg from '../assets/calendar.png'; // Ruta a tu imagen
import '../styles/Calendar.css';

function Calendar() {
  return (
    <div className="calendar-page">
      <h1>Calendario 2025-2026</h1>
      <img src={calendarImg} alt="Calendario Académico" className="calendar-image" />
      <p>Consulta fechas importantes: inscripciones, exámenes, etc.</p>
    </div>
  );
}

export default Calendar;
