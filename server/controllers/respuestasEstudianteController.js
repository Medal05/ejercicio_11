const pool = require('../config/db');

// Guardar respuesta del alumno
exports.guardarRespuesta = async (req, res) => {
  const { examen_id, pregunta_id, user_id, respuesta } = req.body;
  try {
    await pool.query(`
      INSERT INTO respuestas_estudiante (examen_id, pregunta_id, user_id, respuesta)
      VALUES ($1, $2, $3, $4)
    `, [examen_id, pregunta_id, user_id, respuesta]);

    res.status(201).json({ message: 'Respuesta guardada' });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    res.status(500).json({ message: 'Error al guardar respuesta', error: error.message });
  }
};

// Verificar si el usuario ya respondió
exports.verificarIntento = async (req, res) => {
  const { exam_id, user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 1 FROM respuestas_estudiante
      WHERE examen_id = $1 AND user_id = $2
      LIMIT 1
    `, [exam_id, user_id]);

    res.json({ yaRespondido: result.rows.length > 0 });
  } catch (error) {
    console.error('Error verificando intento:', error);
    res.status(500).json({ message: 'Error verificando intento', error: error.message });
  }
};

// Obtener respuestas de todos los alumnos para un examen
exports.obtenerRespuestasPorExamen = async (req, res) => {
  const { exam_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        u.nombre AS alumno_nombre,
        p.pregunta,
        p.opcion_a,
        p.opcion_b,
        p.opcion_c,
        p.opcion_d,
        p.tipo
      FROM respuestas_estudiante r
      JOIN users u       ON u.id = r.user_id
      JOIN preguntas p   ON p.id = r.pregunta_id
      WHERE r.examen_id = $1
      ORDER BY r.user_id, r.pregunta_id
    `, [exam_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ message: 'Error al obtener respuestas', error: error.message });
  }
};

exports.marcarCorrecta = async (req, res) => {
  const { respuesta_id } = req.params;
  const { es_correcta } = req.body;

  try {
    await pool.query(`
      UPDATE respuestas_estudiante
      SET es_correcta = $1
      WHERE id = $2
    `, [es_correcta, respuesta_id]);

    res.json({ message: 'Respuesta marcada correctamente' });
  } catch (error) {
    console.error('Error al marcar respuesta:', error);
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};
