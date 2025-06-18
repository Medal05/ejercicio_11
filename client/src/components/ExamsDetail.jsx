// client/src/components/ExamsDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/ExamsDetail.css';

const ExamsDetail = () => {
  const { id } = useParams();
  const bancoListRef = useRef(null);

  // Estados de datos y UI
  const [exam, setExam] = useState(null);
  const [tipo, setTipo] = useState('multiple');
  const [todasPreguntas, setTodasPreguntas] = useState([]);
  const [preguntasAsignadas, setPreguntasAsignadas] = useState([]);
  const [respuestasAlumnos, setRespuestasAlumnos] = useState([]);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});
  const [cantidadAzar, setCantidadAzar] = useState(5);
  const [seleccionadas, setSeleccionadas] = useState(() => {
    const saved = localStorage.getItem(`seleccionadas-${id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [preguntaData, setPreguntaData] = useState({
    pregunta: '', opcion_a: '', opcion_b: '', opcion_c: '', opcion_d: ''
  });
  const [formMsg, setFormMsg] = useState('');
  const [assignMsg, setAssignMsg] = useState('');

  // Banco de preguntas
  const [bancoPreguntas, setBancoPreguntas] = useState([]);
  const [bancoSeleccionadas, setBancoSeleccionadas] = useState([]);
  const [showBanco, setShowBanco] = useState(false);
  const [bancoMsg, setBancoMsg] = useState('');

  // Filtrado de alumnos
  const [searchTerm, setSearchTerm] = useState('');

  // Toggles para gráficos
  const [showBarChart, setShowBarChart] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);

  // Carga inicial
  useEffect(() => {
    fetch(`/api/exams/${id}`).then(r => r.json()).then(setExam);
    fetch(`/api/preguntas/examen/${id}`).then(r => r.json()).then(setTodasPreguntas);
    fetchRespuestas();
    fetchPreguntasAsignadas();
    const iv = setInterval(fetchRespuestas, 5000);
    return () => clearInterval(iv);
  }, [id]);

  // Scroll al abrir banco
  useEffect(() => {
    if (showBanco && bancoListRef.current) {
      bancoListRef.current.scrollTop = 0;
    }
  }, [showBanco]);

  // Obtener respuestas
  const fetchRespuestas = () => {
    fetch(`/api/respuestas-estudiante/examen/${id}`)
      .then(r => r.json())
      .then(data => setRespuestasAlumnos(Array.isArray(data) ? data : []))
      .catch(() => setRespuestasAlumnos([]));
  };

  // Obtener preguntas asignadas
  const fetchPreguntasAsignadas = () => {
    fetch(`/api/examen-preguntas/${id}`)
      .then(r => r.json())
      .then(data => setPreguntasAsignadas(data.map(p => p.id)));
  };

  // Persistir seleccionadas
  useEffect(() => {
    localStorage.setItem(`seleccionadas-${id}`, JSON.stringify(seleccionadas));
  }, [seleccionadas, id]);

  // Crear nueva pregunta
  const handleChange = e =>
    setPreguntaData({ ...preguntaData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setFormMsg('');
    const payload = { examen_id: id, pregunta: preguntaData.pregunta, tipo };
    if (tipo === 'multiple') Object.assign(payload, preguntaData);
    const res = await fetch('/api/preguntas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const nueva = await res.json();
      setTodasPreguntas(ts => [...ts, nueva]);
      setPreguntaData({ pregunta: '', opcion_a: '', opcion_b: '', opcion_c: '', opcion_d: '' });
    } else {
      setFormMsg('❌ Error al guardar la pregunta');
    }
  };

  // Manejo de checkboxes
  const handleCheckboxChange = pid =>
    setSeleccionadas(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );

  // Asignar preguntas
  const asignarPreguntas = async () => {
    setAssignMsg('');
    const nuevas = seleccionadas.filter(pid => !preguntasAsignadas.includes(pid));
    if (!nuevas.length) {
      setAssignMsg('No hay preguntas nuevas por asignar.');
      return;
    }
    const res = await fetch('/api/examen-preguntas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examen_id: id, preguntas: nuevas })
    });
    if (res.ok) {
      setAssignMsg('✅ Preguntas asignadas correctamente.');
      setSeleccionadas([]);
      fetchPreguntasAsignadas();
    } else {
      setAssignMsg('❌ Error al asignar preguntas.');
    }
  };

  // Selección al azar
  const seleccionarAzar = () => {
    const mezcladas = [...todasPreguntas].sort(() => 0.5 - Math.random());
    setSeleccionadas(mezcladas.slice(0, cantidadAzar).map(p => p.id));
  };

  // Banco de preguntas
  const fetchBanco = () => {
    if (!exam) return;
    fetch(`/api/preguntas/clase/${exam.class_id}/admin/${exam.creador_id}`)
      .then(r => r.json())
      .then(setBancoPreguntas)
      .catch(console.error);
  };
  const toggleBanco = () => {
    setBancoMsg('');
    if (!showBanco) fetchBanco();
    setShowBanco(v => !v);
  };
  const handleBancoCheckbox = pid =>
    setBancoSeleccionadas(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  const agregarDesdeBanco = () => {
    setTodasPreguntas(prev => {
      const nuevos = bancoPreguntas.filter(
        q => bancoSeleccionadas.includes(q.id) && !prev.some(p => p.id === q.id)
      );
      return [...prev, ...nuevos];
    });
    setSeleccionadas(prev => Array.from(new Set([...prev, ...bancoSeleccionadas])));
    setBancoSeleccionadas([]);
    setShowBanco(false);
    setBancoMsg('✅ Preguntas agregadas al listado.');
  };

  // Toggle sección alumno
  const toggleSeccionAlumno = userId =>
    setSeccionesAbiertas(prev => ({ ...prev, [userId]: !prev[userId] }));

  // Agrupar respuestas por alumno
  const respuestasPorAlumno = respuestasAlumnos.reduce((acc, r) => {
    if (!acc[r.user_id]) acc[r.user_id] = [];
    acc[r.user_id].push(r);
    return acc;
  }, {});

  // Datos para gráfico de barras
  const resumenPorPregunta = () => {
    const resumen = {};
    respuestasAlumnos.forEach(({ pregunta, es_correcta }) => {
      if (!resumen[pregunta]) resumen[pregunta] = { correcta: 0, incorrecta: 0 };
      resumen[pregunta][es_correcta ? 'correcta' : 'incorrecta']++;
    });
    return Object.entries(resumen).map(([name, d]) => ({
      name, Correctas: d.correcta, Incorrectas: d.incorrecta
    }));
  };

  // Datos para histograma
  const calificaciones = Object.values(respuestasPorAlumno).map(resps => {
    const total = resps.length;
    const correctas = resps.filter(r => r.es_correcta).length;
    return Math.round((100 * correctas) / total);
  });
  const bins = [
    { name: '0-20', count: 0 },
    { name: '21-40', count: 0 },
    { name: '41-60', count: 0 },
    { name: '61-80', count: 0 },
    { name: '81-100', count: 0 }
  ];
  calificaciones.forEach(c => {
    if (c <= 20) bins[0].count++;
    else if (c <= 40) bins[1].count++;
    else if (c <= 60) bins[2].count++;
    else if (c <= 80) bins[3].count++;
    else bins[4].count++;
  });

  // Filtrar alumnos por búsqueda
  const filteredAlumnos = Object.entries(respuestasPorAlumno).filter(
    ([, resps]) => resps[0].alumno_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="exams-detail-container">
      <h2>📝 Examen: <span style={{ color: '#1e88e5' }}>{exam?.nombre}</span></h2>
      {exam?.contrasena && (
        <p style={{ marginBottom: '2rem' }}>
          <strong>Contraseña:</strong> {exam.contrasena}
        </p>
      )}

      {/* Formulario para crear preguntas */}
      <label style={{ fontWeight: 'bold', display: 'block', marginTop: '1.5rem' }}>
        Tipo de pregunta:
      </label>
      <select value={tipo} onChange={e => setTipo(e.target.value)}>
        <option value="multiple">Opción múltiple</option>
        <option value="abierta">Abierta</option>
      </select>

      <form onSubmit={handleSubmit} className="crear-pregunta-form">
        <textarea
          name="pregunta"
          placeholder="Escribe la pregunta aquí"
          value={preguntaData.pregunta}
          onChange={handleChange}
          required
        />
        {tipo === 'multiple' && (
          <div className="opciones-container">
            {['a', 'b', 'c', 'd'].map(op => (
              <div key={op} className="opcion-item">
                <label>Opción {op.toUpperCase()}</label>
                <input
                  name={`opcion_${op}`}
                  value={preguntaData[`opcion_${op}`]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
        )}
        <button type="submit">➕ Agregar Pregunta</button>
        {formMsg && (
          <p style={{
            marginTop: '0.5rem',
            fontWeight: '500',
            color: formMsg.startsWith('✅') ? '#2ecc71' : '#e74c3c'
          }}>
            {formMsg}
          </p>
        )}
      </form>

      {/* Banco de preguntas */}
      <button onClick={toggleBanco} style={{ marginBottom: '0.5rem' }}>
        {showBanco ? 'Ocultar banco de preguntas' : 'Ver banco de preguntas'}
      </button>
      {bancoMsg && (
        <p style={{
          marginBottom: '1rem',
          fontWeight: '500',
          color: bancoMsg.startsWith('✅') ? '#2ecc71' : '#e74c3c'
        }}>
          {bancoMsg}
        </p>
      )}
      {showBanco && (
        <>
          <ul
            ref={bancoListRef}
            className="preguntas-lista"
            style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}
          >
            {bancoPreguntas.map(q => (
              <li key={q.id} className="pregunta-item">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={bancoSeleccionadas.includes(q.id)}
                    onChange={() => handleBancoCheckbox(q.id)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <strong>{q.pregunta}</strong> <em>({q.examen_nombre})</em>
                </div>
                {q.tipo === 'multiple' && (
                  <ul className="pregunta-opciones">
                    <li>A. {q.opcion_a}</li>
                    <li>B. {q.opcion_b}</li>
                    <li>C. {q.opcion_c}</li>
                    <li>D. {q.opcion_d}</li>
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <button onClick={agregarDesdeBanco}>➕ Agregar seleccionadas al listado</button>
        </>
      )}

      {/* Selección de preguntas */}
      <h3 style={{ marginTop: '2rem' }}>📋 Seleccionar preguntas:</h3>
      <ul className="preguntas-lista">
        {todasPreguntas.map(p => (
          <li key={p.id} className="pregunta-item">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={seleccionadas.includes(p.id)}
                disabled={preguntasAsignadas.includes(p.id)}
                onChange={() => handleCheckboxChange(p.id)}
                style={{ marginRight: '0.5rem' }}
              />
              <label>
                {p.pregunta} ({p.tipo}){preguntasAsignadas.includes(p.id) && ' ✔️ ya asignada'}
              </label>
            </div>
            {p.tipo === 'multiple' && (
              <ul className="pregunta-opciones">
                <li>A. {p.opcion_a}</li>
                <li>B. {p.opcion_b}</li>
                <li>C. {p.opcion_c}</li>
                <li>D. {p.opcion_d}</li>
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div style={{ margin: '1rem 0' }}>
        <label>Cantidad al azar:</label>
        <input
          type="number"
          min={1}
          max={todasPreguntas.length}
          value={cantidadAzar}
          onChange={e => setCantidadAzar(Number(e.target.value))}
          style={{ width: '60px', margin: '0 0.5rem' }}
        />
        <button onClick={seleccionarAzar}>🎲 Seleccionar al azar</button>
      </div>
      <button onClick={asignarPreguntas}>✅ Asignar seleccionadas</button>
      {assignMsg && (
        <p style={{
          marginTop: '0.5rem',
          fontWeight: '500',
          color: assignMsg.startsWith('✅') ? '#2ecc71' : '#e74c3c'
        }}>
          {assignMsg}
        </p>
      )}

      {/* Gráfico de barras contraíble */}
      <h3
        onClick={() => setShowBarChart(!showBarChart)}
        style={{ cursor: 'pointer', marginTop: '3rem' }}
      >
        📊 Desempeño por pregunta {showBarChart ? '▲' : '▼'}
      </h3>
      {showBarChart && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={resumenPorPregunta()}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Correctas" fill="#2ecc71" />
              <Bar dataKey="Incorrectas" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Histograma de calificaciones contraíble */}
      <h3
        onClick={() => setShowHistogram(!showHistogram)}
        style={{ cursor: 'pointer', marginTop: '2rem' }}
      >
        📊 Histograma de calificaciones {showHistogram ? '▲' : '▼'}
      </h3>
      {showHistogram && (
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={bins}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Alumnos" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Respuestas de los alumnos con búsqueda */}
      <h3 style={{ marginTop: '3rem' }}>📊 Respuestas de los alumnos:</h3>
      <input
        type="text"
        placeholder="Buscar alumno..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem',
          marginBottom: '1rem',
          border: '1px solid #b0bac5',
          borderRadius: '6px'
        }}
      />
      {filteredAlumnos.length === 0 ? (
        <p style={{ fontStyle: 'italic' }}>No hay alumnos que coincidan.</p>
      ) : (
        <div className="respuestas-alumnos">
          {filteredAlumnos.map(([userId, resps]) => {
            const total = resps.length;
            const correctas = resps.filter(r => r.es_correcta).length;
            const calif = Math.round((100 * correctas) / total);
            return (
              <div key={userId} className="respuestas-por-alumno">
                <div
                  className="acordeon-header"
                  onClick={() => toggleSeccionAlumno(userId)}
                >
                  <h4>{resps[0].alumno_nombre} — {calif} / 100</h4>
                  <span>{seccionesAbiertas[userId] ? '▲' : '▼'}</span>
                </div>
                {seccionesAbiertas[userId] && (
                  <ul className="acordeon-cuerpo">
                    {resps.map((r, idx) => (
                      <li key={r.id}>
                        <div className={`respuesta-contenedor ${r.es_correcta ? 'correcta' : ''}`}>
                          <div className="respuesta-info">
                            <strong>{idx + 1}. {r.pregunta}</strong>
                            {r.tipo === 'multiple' ? (
                              <>
                                <ul className="pregunta-opciones">
                                  <li>A. {r.opcion_a}</li>
                                  <li>B. {r.opcion_b}</li>
                                  <li>C. {r.opcion_c}</li>
                                  <li>D. {r.opcion_d}</li>
                                </ul>
                                <p className="seleccion-text">
                                  <strong>Seleccionaste:</strong> {r.respuesta}
                                </p>
                              </>
                            ) : (
                              <p className="seleccion-text">
                                <strong>Respuesta:</strong> {r.respuesta}
                              </p>
                            )}
                          </div>
                          <label className="palomita-label">
                            <input
                              type="checkbox"
                              checked={r.es_correcta}
                              onChange={async e => {
                                const es_correcta = e.target.checked;
                                await fetch(
                                  `/api/respuestas-estudiante/marcar-correcta/${r.id}`,
                                  {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ es_correcta })
                                  }
                                );
                                setRespuestasAlumnos(prev =>
                                  prev.map(item =>
                                    item.id === r.id ? { ...item, es_correcta } : item
                                  )
                                );
                              }}
                            /> ✓
                          </label>
                        </div>
                      </li>
                    ))}
                    <li style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                      Calificación: {calif} / 100
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamsDetail;
