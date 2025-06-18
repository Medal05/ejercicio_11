// client/src/components/UniversityServices.jsx
import React from 'react';
import '../styles/UniversityServices.css';

function UniversityServices() {
  return (
    <main className="university-container">
      {/* Sección Hero con título, descripción e imagen */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>
            UNIVERSIDAD
            <br />
            CENTRAL DE INNOVACIÓN
          </h1>
          <p className="description">
            Descubre aquí todos los servicios disponibles para apoyarte en tu formación universitaria. En la Universidad Central de Innovación, nuestro Departamento de Servicios Escolares está comprometido con brindarte asistencia en trámites académicos, inscripciones, becas, certificaciones y más.
          </p>
        </div>
        <div className="hero-image">
          <img
            src="https://lh3.googleusercontent.com/p/AF1QipPWyaKqdmj2wshlqqHLnqit-SSQLnkZZUIFbQm-=s680-w680-h510"
            alt="Universidad"
          />
        </div>
      </header>

      {/* Sección de Servicios */}
      <section className="services-section">
        <div className="services-grid">
          <div className="service-item">
            <h3>Bolsa de Trabajo</h3>
            <p>
              Conéctate con oportunidades laborales y prácticas profesionales a través de nuestra Bolsa de Trabajo. Colaboramos con empresas nacionales e internacionales para acercarte a empleadores que buscan talento como el tuyo.
            </p>
          </div>

          <div className="service-item">
            <h3>Oferta Educativa</h3>
            <p>
              Conéctate con oportunidades laborales y prácticas profesionales a través de nuestra Bolsa de Trabajo. Colaboramos con empresas nacionales e internacionales para acercarte a empleadores que buscan talento como el tuyo.
            </p>
          </div>

          <div className="service-item">
            <h3>Afiliaciones y Convenios</h3>
            <p>
              Disfruta de los beneficios exclusivos gracias a nuestras alianzas con instituciones, empresas y organizaciones nacionales e internacionales. Obtén descuentos, certificaciones y experiencias académicas enriquecedoras.
            </p>
          </div>

          <div className="service-item">
            <h3>Becas y Apoyos Financieros</h3>
            <p>
              En la Universidad Central de Innovación, creemos que la educación debe ser accesible para todos. Consulta nuestras opciones de becas académicas, deportivas y apoyos financieros diseñados para impulsar tu desarrollo profesional.
            </p>
          </div>

          <div className="service-item">
            <h3>Actividades Extracurriculares</h3>
            <p>
              Ser parte de la UCI es más que estudiar. Únete a nuestros clubes estudiantiles, equipos deportivos y actividades culturales. Conoce los eventos que tenemos preparados para ti y vive una experiencia universitaria inolvidable.
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Logros y Reconocimientos */}
      <section className="achievements-section">
        <h2>Logros y Reconocimientos</h2>
        <div className="achievements-cards">
          <div className="achievement-card">
            <h3>+5000 Estudiantes</h3>
            <p>Formando futuros líderes</p>
          </div>
          <div className="achievement-card">
            <h3>+300 Empresas</h3>
            <p>Convenios estratégicos</p>
          </div>
          <div className="achievement-card">
            <h3>+50 Programas</h3>
            <p>Oferta educativa diversa</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default UniversityServices;
