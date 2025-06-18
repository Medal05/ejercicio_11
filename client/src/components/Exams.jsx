// client/src/components/Exams.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Exams.css';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', contrasena: '', class_id: '' });
  const [adminClasses, setAdminClasses] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [inputPassword, setInputPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchExams();
    fetchAdminClasses();
    const interval = setInterval(fetchExams, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchExams = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exams');
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error('Error al cargar exámenes:', err);
    }
  };

  const fetchAdminClasses = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clases/admin/${user.id}`);
      const data = await res.json();
      setAdminClasses(data);
    } catch (err) {
      console.error('Error al cargar clases administradas:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creador_id: user.id })
      });

      if (!res.ok) throw new Error('Error al crear el examen');

      const { exam } = await res.json();
      await fetchExams();
      setShowCreateModal(false);
      navigate(`/exams/${exam.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExamSelection = (exam) => {
    if (exam.creador_id === user.id) {
      navigate(`/exams/${exam.exam_id}`);
    } else {
      setSelectedExam(exam);
      setErrorMsg('');
    }
  };

  const verifyExamPassword = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/exams/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examen_id: selectedExam.exam_id,
          contrasena: inputPassword,
          user_id: user.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        const route = data.message.includes('sin necesidad') ?
          `/classes/${selectedExam.class_id}` :
          `/responder-examen/${selectedExam.exam_id}`;
        navigate(route);
      } else {
        setErrorMsg('Contraseña incorrecta, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('Ocurrió un error, intenta nuevamente.');
    }
  };

  return (
    <div className="exams-container">
      <h2 className="exams-title">Exámenes Disponibles</h2>
      <div className="exams-grid">
        {exams.map((exam) => (
          <div key={exam.exam_id} className="exam-card" onClick={() => handleExamSelection(exam)}>
            <h3 className="exam-card-title">{exam.exam_nombre}</h3>
            <p className="exam-card-description">{exam.exam_descripcion}</p>
            <div className="exam-info">
              <span><strong>Creado por:</strong> {exam.creador_nombre}</span><br />
              <span><strong>Clase:</strong> {exam.clase_nombre}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="create-exam-button" onClick={() => setShowCreateModal(true)}>+</button>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nuevo Examen</h3>
            <form onSubmit={handleCreateExam}>
              <select name="class_id" value={formData.class_id} onChange={handleInputChange} required>
                <option value="">Seleccione clase</option>
                {adminClasses.map(c => <option key={c.id} value={c.id}>{c.materia}</option>)}
              </select>
              <input name="nombre" placeholder="Nombre del examen" value={formData.nombre} onChange={handleInputChange} required />
              <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleInputChange} />
              <input type="password" name="contrasena" placeholder="Contraseña (solo alumnos)" value={formData.contrasena} onChange={handleInputChange} />
              <div className="buttons-row">
                <button type="submit">Crear</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExam && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Contraseña del Examen</h3>
            <div className="password-form">
              <input type="password" placeholder="Contraseña" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} />
              <button onClick={verifyExamPassword}>Acceder</button>
              <button className="cancel-btn" onClick={() => setSelectedExam(null)}>Cancelar</button>
            </div>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
