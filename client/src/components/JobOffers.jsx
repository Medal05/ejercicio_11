// client/src/components/JobOffers.jsx
import React, { useEffect, useState } from 'react';
import '../styles/JobOffers.css';

function JobOffers() {
  // Estado completo y filtrado de ofertas
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  // Estados para filtros
  const [salaryRanges, setSalaryRanges] = useState([]); // Ej.: ["10-20", "20-40"]
  const [locations, setLocations] = useState([]);       // Ej.: ["Remoto", "CDMX"]
  // Estado para la búsqueda de palabras clave en múltiples campos
  const [keywordSearch, setKeywordSearch] = useState('');

  // Estados para el modal de agregar oferta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    salary: '',
    location: '',
    requirements: '',
    schedule: '',
    contract_type: '',
  });

  // Cargar todas las ofertas al montar el componente
  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener las ofertas');
        return res.json();
      })
      .then((data) => {
        setJobs(data);
        setFilteredJobs(data);
      })
      .catch((err) => {
        console.error(err);
        setJobs([]);
        setFilteredJobs([]);
      });
  }, []);

  // Aplicar filtrado en el lado del cliente cada vez que cambien los filtros o la lista completa
  useEffect(() => {
    let filtered = jobs;

    // Filtrar por rango de salario (extrayendo el número de la cadena salary)
    if (salaryRanges.length > 0) {
      filtered = filtered.filter((job) => {
        // Ejemplo: "$40,000 MXN" -> 40000
        const numericSalary = parseInt(job.salary.replace(/[^0-9]/g, ''), 10);
        return salaryRanges.some((range) => {
          const [minStr, maxStr] = range.split('-');
          const min = parseInt(minStr, 10) * 1000;
          const max = parseInt(maxStr, 10) * 1000;
          return numericSalary >= min && numericSalary <= max;
        });
      });
    }

    // Filtrar por ubicación
    if (locations.length > 0) {
      filtered = filtered.filter((job) => locations.includes(job.location));
    }

    // Filtrar por palabras clave en múltiples campos
    if (keywordSearch.trim() !== '') {
      const keyword = keywordSearch.trim().toLowerCase();
      filtered = filtered.filter((job) => {
        return (
          (job.title && job.title.toLowerCase().includes(keyword)) ||
          (job.location && job.location.toLowerCase().includes(keyword)) ||
          (job.requirements && job.requirements.toLowerCase().includes(keyword)) ||
          (job.schedule && job.schedule.toLowerCase().includes(keyword)) ||
          (job.contract_type && job.contract_type.toLowerCase().includes(keyword))
        );
      });
    }

    setFilteredJobs(filtered);
  }, [salaryRanges, locations, keywordSearch, jobs]);

  // Funciones para manejar cambios en los filtros
  const handleSalaryChange = (rangeValue, checked) => {
    if (checked) {
      setSalaryRanges((prev) => [...prev, rangeValue]);
    } else {
      setSalaryRanges((prev) => prev.filter((r) => r !== rangeValue));
    }
  };

  const handleLocationChange = (locValue, checked) => {
    if (checked) {
      setLocations((prev) => [...prev, locValue]);
    } else {
      setLocations((prev) => prev.filter((l) => l !== locValue));
    }
  };

  const handleKeywordSearch = (e) => {
    setKeywordSearch(e.target.value);
  };

  // Funciones para el modal de agregar oferta
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewJob({
      title: '',
      salary: '',
      location: '',
      requirements: '',
      schedule: '',
      contract_type: '',
    });
  };

  const handleNewJobChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) throw new Error('Error al agregar la oferta');
      const addedJob = await res.json();
      setJobs([addedJob, ...jobs]);
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al agregar la oferta');
    }
  };

  return (
    <div className="job-offers-page">
      {/* Barra de búsqueda general encima del título */}
      <div className="global-search">
        <input
          type="text"
          placeholder="Buscar ofertas..."
          value={keywordSearch}
          onChange={handleKeywordSearch}
        />
      </div>

      <h1>Ofertas de Trabajo</h1>

      <div className="content-container">
        {/* Panel de filtros a la izquierda (sin la barra de búsqueda) */}
        <aside className="filters">
          <section className="filter-group">
            <h2>Salario</h2>
            <div className="options">
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleSalaryChange('10-20', e.target.checked)}
                  checked={salaryRanges.includes('10-20')}
                />
                $10,000 - $20,000
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleSalaryChange('20-40', e.target.checked)}
                  checked={salaryRanges.includes('20-40')}
                />
                $20,000 - $40,000
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleSalaryChange('40-60', e.target.checked)}
                  checked={salaryRanges.includes('40-60')}
                />
                $40,000 - $60,000
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleSalaryChange('60-9999', e.target.checked)}
                  checked={salaryRanges.includes('60-9999')}
                />
                $60,000+
              </label>
            </div>
            <a href="#!" className="show-more">Mostrar más</a>
          </section>

          <section className="filter-group">
            <h2>Ubicación</h2>
            <div className="options">
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleLocationChange('Remoto', e.target.checked)}
                  checked={locations.includes('Remoto')}
                />
                Remoto
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleLocationChange('CDMX', e.target.checked)}
                  checked={locations.includes('CDMX')}
                />
                CDMX
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleLocationChange('Guadalajara', e.target.checked)}
                  checked={locations.includes('Guadalajara')}
                />
                Guadalajara
              </label>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleLocationChange('Monterrey', e.target.checked)}
                  checked={locations.includes('Monterrey')}
                />
                Monterrey
              </label>
            </div>
            <a href="#!" className="show-more">Mostrar más</a>
          </section>
        </aside>

        {/* Sección de ofertas a la derecha */}
        <div className="jobs-box">
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <h2>{job.title}</h2>
                <p><strong>Salario:</strong> {job.salary}</p>
                <p><strong>Ubicación:</strong> {job.location}</p>
                <p><strong>Requisitos:</strong> {job.requirements}</p>
                <p><strong>Horario:</strong> {job.schedule}</p>
                <p><strong>Tipo de contrato:</strong> {job.contract_type}</p>
                <button>Aplicar Ahora</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón flotante para abrir modal de agregar oferta */}
      <button className="add-job-btn" onClick={openModal}>+</button>

      {/* Modal para agregar una nueva oferta */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2>Agregar Oferta de Trabajo</h2>
            <form onSubmit={handleSubmitJob}>
              <label>
                Título:
                <input
                  type="text"
                  name="title"
                  value={newJob.title}
                  onChange={handleNewJobChange}
                  required
                />
              </label>
              <label>
                Salario:
                <input
                  type="text"
                  name="salary"
                  value={newJob.salary}
                  onChange={handleNewJobChange}
                  required
                />
              </label>
              <label>
                Ubicación:
                <input
                  type="text"
                  name="location"
                  value={newJob.location}
                  onChange={handleNewJobChange}
                  required
                />
              </label>
              <label>
                Requisitos:
                <input
                  type="text"
                  name="requirements"
                  value={newJob.requirements}
                  onChange={handleNewJobChange}
                />
              </label>
              <label>
                Horario:
                <input
                  type="text"
                  name="schedule"
                  value={newJob.schedule}
                  onChange={handleNewJobChange}
                />
              </label>
              <label>
                Tipo de contrato:
                <input
                  type="text"
                  name="contract_type"
                  value={newJob.contract_type}
                  onChange={handleNewJobChange}
                />
              </label>
              <button type="submit">Guardar Oferta</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobOffers;
