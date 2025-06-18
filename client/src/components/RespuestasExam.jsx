import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/RespuestasExam.css';

const RespuestasExam = () => {
  const { id } = useParams(); // examen_id
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [yaRespondido, setYaRespondido] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  // Verificar si ya respondió
  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/respuestas-estudiante/${id}/${user.id}`);
        const data = await res.json();
        setYaRespondido(data.yaRespondido);
      } catch (error) {
        console.error('Error al verificar intento:', error);
      }
    };

    verificar();
    const interval = setInterval(verificar, 5000);
    return () => clearInterval(interval);
  }, [id, user.id]);

  // Cargar preguntas si no ha respondido
  useEffect(() => {
    if (!yaRespondido) {
      fetch(`http://localhost:5000/api/examen-preguntas/${id}`)
        .then(res => res.json())
        .then(data => setPreguntas(data))
        .catch(err => console.error('Error al obtener preguntas:', err));
    }
  }, [id, yaRespondido]);

  const handleChange = (pid, value) => {
    setRespuestas(prev => ({ ...prev, [pid]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (yaRespondido) return;

    try {
      const payload = Object.entries(respuestas).map(([pregunta_id, respuesta]) => ({
        examen_id: id,
        pregunta_id,
        user_id: user.id,
        respuesta
      }));

      for (const r of payload) {
        await fetch('http://localhost:5000/api/respuestas-estudiante', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r)
        });
      }

      setYaRespondido(true);
      setPreguntas([]);
      setMensajeConfirmacion('✅ Tus respuestas fueron enviadas exitosamente. Gracias por tu participación.');
    } catch (err) {
      console.error('Error enviando respuestas:', err);
      setMensajeConfirmacion('❌ Ocurrió un error al enviar tus respuestas. Intenta de nuevo.');
    }
  };

  if (yaRespondido && !mensajeConfirmacion) {
    return (
      <div className="respuestas-exam-container">
        <h2>Ya enviaste este examen ✅</h2>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', marginTop: '1rem' }}>
          Solo puedes enviar tus respuestas una vez. Gracias por tu participación.
        </p>
      </div>
    );
  }

  return (
    <div className="respuestas-exam-container">
      <h2>Examen</h2>
      <form onSubmit={handleSubmit}>
        {preguntas.map((p, index) => (
          <div key={p.id} className="pregunta-bloque">
            <p><strong>{index + 1}. {p.pregunta}</strong></p>
            {p.tipo === 'multiple' ? (
              <div className="opciones">
                {['a', 'b', 'c', 'd'].map(op => (
                  <label key={op}>
                    <input
                      type="radio"
                      name={`pregunta-${p.id}`}
                      value={op.toUpperCase()}
                      checked={respuestas[p.id] === op.toUpperCase()}
                      onChange={() => handleChange(p.id, op.toUpperCase())}
                      required
                      disabled={yaRespondido}
                    />
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                      {op.toUpperCase()}.
                    </span>
                    {p[`opcion_${op}`]}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows="3"
                placeholder="Tu respuesta..."
                value={respuestas[p.id] || ''}
                onChange={e => handleChange(p.id, e.target.value)}
                required
                disabled={yaRespondido}
              />
            )}
          </div>
        ))}
        {!yaRespondido && (
          <button type="submit">Enviar respuestas</button>
        )}
        {mensajeConfirmacion && (
          <p style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: '500',
            color: mensajeConfirmacion.startsWith('✅') ? '#2ecc71' : '#e74c3c'
          }}>
            {mensajeConfirmacion}
          </p>
        )}
      </form>
    </div>
  );
};

export default RespuestasExam;
