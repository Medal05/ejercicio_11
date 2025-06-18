// client/src/components/ClaseDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import '../styles/ClaseDetail.css';

const ClaseDetail = () => {
  const { id } = useParams();
  const [clase, setClase] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [tareas, setTareas] = useState([]);
  const [files, setFiles] = useState({});
  const [calificaciones, setCalificaciones] = useState({});
  const [newGrades, setNewGrades] = useState({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [openSubmissions, setOpenSubmissions] = useState({});

  // Estado para el formulario de mensaje (solo para alumno)
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageToCreator, setMessageToCreator] = useState("");

  // Estado para mostrar/ocultar el reporte de calificaciones
  const [showGradeReport, setShowGradeReport] = useState(false);

  // Se asume que el usuario autenticado está en localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // --------------------------------------------------------------------------
  // FUNCIONES DE CÁLCULO
  // --------------------------------------------------------------------------
  const calcularPromedio = (submissions) => {
    const validGrades = submissions.filter(s => s.calificacion !== null && s.calificacion !== undefined);
    if (validGrades.length === 0) return '0';
    const suma = validGrades.reduce((acc, curr) => acc + Number(curr.calificacion), 0);
    return (suma / validGrades.length).toFixed(2);
  };

  const computeOverallAverages = () => {
    const averages = {};
    const totalTareas = tareas.length;
    const userMap = {};

    tareas.forEach(tarea => {
      const calSubs = calificaciones[tarea.id];
      if (calSubs) {
        if (Array.isArray(calSubs)) {
          calSubs.forEach(sub => {
            const userKey = sub.nombre || sub.usuario_id;
            if (!userMap[userKey]) {
              userMap[userKey] = 0;
            }
            const grade = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 0;
            userMap[userKey] += grade;
          });
        } else {
          const sub = calSubs;
          const userKey = sub.nombre || sub.usuario_id;
          if (!userMap[userKey]) {
            userMap[userKey] = 0;
          }
          const grade = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 0;
          userMap[userKey] += grade;
        }
      }
    });

    Object.keys(userMap).forEach(userKey => {
      averages[userKey] = totalTareas > 0 ? (userMap[userKey] / totalTareas).toFixed(2) : '0.00';
    });

    return averages;
  };

  // --------------------------------------------------------------------------
  // FUNCIONES PARA FETCH
  // --------------------------------------------------------------------------
  const fetchClaseDetail = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clases/${id}`);
      const data = await res.json();
      setClase(data);
      if (data && data.creador_id === user.id) {
        setEnrollment({ role: 'admin' });
      }
    } catch (error) {
      console.error('Error al obtener detalle de la clase:', error);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clases/enrollment/${id}/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollment(data);
      } else if (res.status === 404) {
        setEnrollment(null);
      }
    } catch (error) {
      console.error('Error al obtener inscripción:', error);
    }
  };

  const fetchTareas = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tareas/${id}`);
      const data = await res.json();
      setTareas(data);
    } catch (error) {
      console.error('Error al obtener las tareas:', error);
    }
  };

  const fetchSubmissions = async (tareaId) => {
    try {
      if (enrollment && enrollment.role === 'admin') {
        const res = await fetch(`http://localhost:5000/api/calificacion/task/${tareaId}`);
        if (res.ok) {
          const data = await res.json();
          const submissions = Array.isArray(data) ? data : (data ? [data] : []);
          setCalificaciones(prev => ({ ...prev, [tareaId]: submissions }));
        }
      } else {
        const res = await fetch(`http://localhost:5000/api/calificacion/${tareaId}/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCalificaciones(prev => ({ ...prev, [tareaId]: data }));
        } else if (res.status === 404) {
          setCalificaciones(prev => ({ ...prev, [tareaId]: null }));
        }
      }
    } catch (error) {
      console.error(`Error al obtener la entrega para la tarea ${tareaId}:`, error);
    }
  };

  // --------------------------------------------------------------------------
  // FUNCIONES AUXILIARES
  // --------------------------------------------------------------------------
  const handleJoinClase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/clases/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: id,
          contrasena: passwordInput,
          user_id: user.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollment(data.enrollment);
        setJoinError('');
      } else {
        setJoinError(data.message || 'Error al unirse a la clase');
      }
    } catch (error) {
      console.error('Error al unirse a la clase:', error);
      setJoinError('Error al unirse a la clase');
    }
  };

  const handleFileChange = (tareaId, file) => {
    setFiles(prev => ({ ...prev, [tareaId]: file }));
  };

  const handleFileUpload = async (tareaId) => {
    if (!files[tareaId]) return;
    const formData = new FormData();
    formData.append('archivo', files[tareaId]);
    formData.append('tarea_id', tareaId);
    formData.append('usuario_id', user.id);
    try {
      const res = await fetch('http://localhost:5000/api/calificacion', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const submissionData = await res.json();
        setCalificaciones(prev => ({ ...prev, [tareaId]: submissionData }));
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    }
  };

  const handleGradeSubmit = async (tareaId, submissionId) => {
    const grade = newGrades[`${tareaId}_${submissionId}`];
    if (!grade) return;
    try {
      const res = await fetch(`http://localhost:5000/api/calificacion/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: grade })
      });
      if (res.ok) {
        await fetchSubmissions(tareaId);
      }
    } catch (error) {
      console.error("Error actualizando la calificación:", error);
    }
  };

  const handleNewTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskName || !newTaskDeadline) return;
    try {
      const res = await fetch('http://localhost:5000/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: id,
          nombre: newTaskName,
          vencimiento: newTaskDeadline,
          descripcion: newTaskDescription
        })
      });
      if (res.ok) {
        const nuevaTarea = await res.json();
        setTareas(prev => [nuevaTarea, ...prev]);
        setNewTaskName('');
        setNewTaskDeadline('');
        setNewTaskDescription('');
        setIsTaskModalOpen(false);
      }
    } catch (error) {
      console.error("Error al crear la tarea:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageToCreator.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          recipient_id: clase.creador_id,
          content: messageToCreator.trim(),
          tipo: "clase"
        })
      });
      if (res.ok) {
        setMessageToCreator("");
        setShowMessageForm(false);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const toggleGradeReport = () => {
    setShowGradeReport(prev => !prev);
  };

  const toggleSubmissions = (tareaId) => {
    setOpenSubmissions(prev => ({
      ...prev,
      [tareaId]: !prev[tareaId]
    }));
  };

  // --------------------------------------------------------------------------
  // EFECTOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchClaseDetail();
    fetchEnrollment();
    // Eliminamos la llamada a fetchParticipants para evitar el 404
  }, [id]);

  useEffect(() => {
    if (enrollment) {
      fetchTareas();
    }
  }, [enrollment]);

  useEffect(() => {
    if (enrollment && tareas.length > 0) {
      tareas.forEach(tarea => {
        fetchSubmissions(tarea.id);
      });
    }
  }, [tareas, enrollment]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchClaseDetail();
      fetchEnrollment();
      if (enrollment) {
        fetchTareas();
        tareas.forEach(tarea => {
          fetchSubmissions(tarea.id);
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [enrollment, tareas]);

  // --------------------------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------------------------
  if (!enrollment && clase && user.id !== clase.creador_id) {
    return (
      <div className="clase-detail">
        <h2>Unirse a la Clase: {clase.materia}</h2>
        <form onSubmit={handleJoinClase}>
          <input 
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Ingresa la contraseña"
            required
          />
          <button type="submit">Unirse</button>
        </form>
        {joinError && <p className="error">{joinError}</p>}
      </div>
    );
  }

  if (!clase) return <div>Loading...</div>;

  return (
    <div className="clase-detail">
      {/* Encabezado */}
      <div className="clase-header">
        <h1>{clase.materia}</h1>
        <p>Creado por: {clase.creador_nombre}</p>
        <p>Número de alumnos: {clase.num_alumnos}</p>
        {enrollment && (
          <p>
            {enrollment.role === 'admin'
              ? "Usted es el Administrador de esta clase."
              : "Usted está inscrito como Alumno."}
          </p>
        )}
        {enrollment && enrollment.role === 'admin' && (
          <p>Contraseña de la clase: {clase.contrasena}</p>
        )}
        <div className="header-buttons">
          <button className="toggle-report-btn" onClick={toggleGradeReport}>
            {showGradeReport ? 'Ocultar Reporte' : 'Mostrar Reporte'}
          </button>
          {enrollment && enrollment.role !== 'admin' && (
            <button className="send-message-btn" onClick={() => setShowMessageForm(true)}>
              Enviar mensaje al creador
            </button>
          )}
        </div>
        {showMessageForm && (
          <div className="message-section">
            <textarea
              value={messageToCreator}
              onChange={(e) => setMessageToCreator(e.target.value)}
              placeholder="Escribe tu mensaje al creador..."
            />
            <button onClick={handleSendMessage}>Enviar Mensaje</button>
            <button onClick={() => setShowMessageForm(false)}>Cancelar</button>
          </div>
        )}
      </div>

      {/* Reporte de Calificaciones (tabla pivot) */}
      {showGradeReport && (
        <PivotCalificaciones
          tareas={tareas}
          calificaciones={calificaciones}
          enrollment={enrollment}
          user={user}
        />
      )}

      {/* Sección de Tareas */}
      <section className="tareas-section">
        <h2>Tareas</h2>
        <div className="tareas-list">
          {tareas.map(tarea => (
            <div key={tarea.id} className="tarea-box">
              <h3>{tarea.nombre}</h3>
              <p>Subida: {new Date(tarea.created_at).toLocaleString()}</p>
              <p>Vence: {new Date(tarea.vencimiento).toLocaleString()}</p>
              {tarea.descripcion && <p><strong>Descripción:</strong> {tarea.descripcion}</p>}
              {enrollment && enrollment.role === 'admin' ? (
                <div className="submission-list">
                  <button
                    className="toggle-submissions-btn"
                    onClick={() => toggleSubmissions(tarea.id)}
                  >
                    {openSubmissions[tarea.id]
                      ? `Ocultar entregas (${calificaciones[tarea.id]?.length || 0})`
                      : `Ver entregas (${calificaciones[tarea.id]?.length || 0})`}
                  </button>
                  {openSubmissions[tarea.id] && (
                    <>
                      {calificaciones[tarea.id] && calificaciones[tarea.id].length > 0 ? (
                        calificaciones[tarea.id].map(submission => (
                          <div key={submission.id} className="submission-item">
                            <p><strong>Alumno:</strong> {submission.nombre || submission.usuario_id}</p>
                            <p>
                              <strong>Archivo:</strong>{' '}
                              <a href={`http://localhost:5000/${submission.archivo}`} target="_blank" rel="noopener noreferrer">
                                Descargar
                              </a>
                            </p>
                            {submission.calificacion ? (
                              <p><strong>Calificación:</strong> {submission.calificacion}</p>
                            ) : (
                              <div className="grade-section">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ingresa calificación"
                                  value={newGrades[`${tarea.id}_${submission.id}`] || ''}
                                  onChange={(e) =>
                                    setNewGrades(prev => ({
                                      ...prev,
                                      [`${tarea.id}_${submission.id}`]: e.target.value,
                                    }))
                                  }
                                />
                                <button onClick={() => handleGradeSubmit(tarea.id, submission.id)}>
                                  Calificar
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No hay entregas para esta tarea.</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {calificaciones[tarea.id] ? (
                    <div className="calificacion-info">
                      <p>Archivo enviado</p>
                      {calificaciones[tarea.id].calificacion ? (
                        <p><strong>Calificación:</strong> {calificaciones[tarea.id].calificacion}</p>
                      ) : (
                        <p>Esperando calificación</p>
                      )}
                    </div>
                  ) : (
                    <div className="upload-section">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(tarea.id, e.target.files[0])}
                      />
                      <button onClick={() => handleFileUpload(tarea.id)}>Subir Archivo</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Botón flotante para agregar nueva tarea (solo admin) */}
      {enrollment && enrollment.role === 'admin' && (
        <button className="add-task-btn" onClick={() => setIsTaskModalOpen(true)}>
          <FaPlus />
        </button>
      )}

      {/* Modal para crear nueva tarea (solo admin) */}
      {isTaskModalOpen && (
        <div className="task-modal-overlay">
          <div className="task-modal-content">
            <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>
              <FaTimes />
            </button>
            <h2>Crear Nueva Tarea</h2>
            <form onSubmit={handleNewTaskSubmit} className="create-task-form">
              <div className="form-group">
                <label>Nombre de la Tarea:</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha y Hora de Vencimiento:</label>
                <input
                  type="datetime-local"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción (opcional):</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>
              <button type="submit">Crear Tarea</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponente para mostrar el reporte de calificaciones en una tabla pivotada
function PivotCalificaciones({ tareas, calificaciones, enrollment, user }) {
  const tareaNombres = tareas.map(t => t.nombre);

  if (enrollment.role !== 'admin') {
    // Vista para alumno: muestra una sola fila con su nombre
    const califs = {};
    let sum = 0;
    tareas.forEach(tarea => {
      const sub = calificaciones[tarea.id];
      let grade = 0;
      if (sub && sub.usuario_id === user.id) {
        grade = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 0;
      }
      califs[tarea.nombre] = grade;
      sum += grade;
    });
    const final = tareas.length > 0 ? (sum / tareas.length).toFixed(2) : '0.00';
    return (
      <section className="grade-report-box">
        <h2>Reporte de Calificaciones</h2>
        <table className="pivot-table">
          <thead>
            <tr>
              <th>Nombre</th>
              {tareaNombres.map(tNom => (<th key={tNom}>{tNom}</th>))}
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{user.nombre}</td>
              {tareaNombres.map(tNom => (
                <td key={`${user.nombre}-${tNom}`}>
                  {califs[tNom] !== null && califs[tNom] !== undefined ? califs[tNom] : 0}
                </td>
              ))}
              <td>{final}</td>
            </tr>
          </tbody>
        </table>
      </section>
    );
  } else {
    // Vista para administrador: se muestran todas las filas basadas en las entregas registradas
    const userMap = {};
    tareas.forEach(tarea => {
      const calSubs = calificaciones[tarea.id];
      if (calSubs && Array.isArray(calSubs)) {
        calSubs.forEach(sub => {
          const userKey = sub.nombre || sub.usuario_id;
          if (!userMap[userKey]) {
            userMap[userKey] = {};
          }
          userMap[userKey][tarea.nombre] = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 0;
        });
      } else if (calSubs) {
        const sub = calSubs;
        const userKey = sub.nombre || sub.usuario_id;
        if (!userMap[userKey]) {
          userMap[userKey] = {};
        }
        userMap[userKey][tarea.nombre] = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 0;
      }
    });

    const rows = Object.keys(userMap).map(userKey => {
      let sum = 0;
      tareaNombres.forEach(tNom => {
        const val = userMap[userKey][tNom] !== undefined ? userMap[userKey][tNom] : 0;
        sum += val;
      });
      const final = tareas.length > 0 ? (sum / tareas.length).toFixed(2) : '0.00';
      return { userKey, califs: userMap[userKey], final };
    });

    return (
      <section className="grade-report-box">
        <h2>Reporte de Calificaciones</h2>
        <table className="pivot-table">
          <thead>
            <tr>
              <th>Nombre</th>
              {tareaNombres.map(tNom => (
                <th key={tNom}>{tNom}</th>
              ))}
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.userKey}>
                <td>{row.userKey}</td>
                {tareaNombres.map(tNom => (
                  <td key={`${row.userKey}-${tNom}`}>
                    {row.califs[tNom] !== null && row.califs[tNom] !== undefined ? row.califs[tNom] : 0}
                  </td>
                ))}
                <td>{row.final}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }
}

export default ClaseDetail;
