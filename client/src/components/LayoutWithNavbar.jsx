import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { NavLink, useLocation } from 'react-router-dom';
import '../styles/LayoutWithNavbar.css';

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(x => x);

  const [className, setClassName] = useState('');
  const [examName, setExamName] = useState('');

  useEffect(() => {
    // Para rutas de clases: /classes/:id
    if (segments[0] === 'classes' && segments[1]) {
      fetch(`http://localhost:5000/api/clases/${segments[1]}`)
        .then(res => res.json())
        .then(data => {
          if (data.materia) setClassName(data.materia);
        })
        .catch(err => console.error('Error al obtener clase:', err));
    }

    // Para exámenes o respuestas: se acepta tanto /exams, /respuestasexam y /responder-examen
    if (["exams", "respuestasexam", "responder-examen"].includes(segments[0].toLowerCase()) && segments[1]) {
      // Extraemos el ID real tomando la última parte del string "slug-id"
      const parts = segments[1].split('-');
      const possibleId = parts[parts.length - 1];

      if (!isNaN(possibleId)) {
        fetch(`http://localhost:5000/api/exams/${possibleId}`)
          .then(res => {
            if (!res.ok) {
              throw new Error('No encontrado');
            }
            return res.json();
          })
          .then(data => {
            // Puede retornarse en data.nombre o data.exam_nombre según tu API
            if (data.nombre) setExamName(data.nombre);
            else if (data.exam_nombre) setExamName(data.exam_nombre);
          })
          .catch(err => {
            // Fallback: obtenemos la lista de exámenes y filtramos por id
            fetch('http://localhost:5000/api/exams')
              .then(res => res.json())
              .then(data => {
                const examFound = data.find(item => item.exam_id.toString() === possibleId);
                if (examFound) {
                  setExamName(examFound.exam_nombre || examFound.nombre);
                }
              })
              .catch(err2 => console.error('Error (fallback) al obtener examen:', err2));
          });
      }
    }
  }, [location.pathname]);

  // Mapeamos el nombre de la ruta para que no se muestre "responder-examen" sino "Examen"
  const breadcrumbNames = {
    university: "Universidad",
    jobs: "Oferta de trabajo",
    chat: "Mensajería",
    calendar: "Calendario",
    classes: "Clases",
    exams: "Examen",
    respuestasexam: "Examen",
    "responder-examen": "Examen"
  };

  return (
    <nav className="breadcrumb-nav">
      <NavLink to="/university">Home</NavLink>
      {segments.map((value, index) => {
        const to = `/${segments.slice(0, index + 1).join('/')}`;
        let displayName =
          breadcrumbNames[value.toLowerCase()] ||
          value.charAt(0).toUpperCase() + value.slice(1);

        // Para rutas de clases: en el segmento 1 se muestra el nombre (materia)
        if (segments[0] === 'classes' && index === 1 && className) {
          displayName = className;
        }
        // Para exámenes o respuestas: en el segmento 1 se muestra el nombre del examen (ya extraído)
        if (
          ["exams", "respuestasexam", "responder-examen"].includes(segments[0].toLowerCase()) &&
          index === 1 &&
          examName
        ) {
          displayName = examName;
        }

        return (
          <React.Fragment key={to}>
            <span style={{ margin: '0 4px' }}>{'>'}</span>
            <NavLink to={to}>{displayName}</NavLink>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function LayoutWithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <div className="layout-container">
        <Breadcrumbs />
        {children}
      </div>
    </>
  );
}

export default LayoutWithNavbar;
