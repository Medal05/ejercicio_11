// server/controllers/examenPreguntasController.js
const pool = require('../config/db');

// Asignar preguntas a un examen sin duplicados con validación y logs
exports.asignarPreguntasAExamen = async (req, res) => {
  try {
    const { examen_id, preguntas } = req.body;

    if (!examen_id || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({
        message: 'Datos inválidos: asegúrate de enviar examen_id y un arreglo con preguntas.'
      });
    }

    // Obtener todas las preguntas ya asignadas en una sola consulta
    const { rows: asignadas } = await pool.query(
      'SELECT pregunta_id FROM examen_preguntas WHERE examen_id = $1 AND pregunta_id = ANY($2::int[])',
      [examen_id, preguntas]
    );
    const asignadasSet = new Set(asignadas.map(row => row.pregunta_id));

    // Filtrar solo las preguntas que no están asignadas
    const nuevasPreguntas = preguntas.filter(pid => pid && !asignadasSet.has(pid));

    if (nuevasPreguntas.length === 0) {
      return res.status(200).json({ message: 'Todas las preguntas ya estaban asignadas.' });
    }

    // Construir valores para el INSERT múltiple
    const values = nuevasPreguntas.map((pid, i) => `($1, $${i + 2})`).join(', ');
    const params = [examen_id, ...nuevasPreguntas];

    await pool.query(
      `INSERT INTO examen_preguntas (examen_id, pregunta_id) VALUES ${values}`,
      params
    );

    return res.status(201).json({ message: `✅ ${nuevasPreguntas.length} preguntas asignadas correctamente.` });
  } catch (error) {
    console.error('❌ Error asignando preguntas al examen:', error);
    return res.status(500).json({
      message: '❌ Error interno al asignar preguntas al examen',
      error: error.message
    });
  }
};

// Obtener todas las preguntas asignadas a un examen
exports.getPreguntasAsignadas = async (req, res) => {
  const { examen_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT p.*
      FROM examen_preguntas ep
      JOIN preguntas p ON ep.pregunta_id = p.id
      WHERE ep.examen_id = $1
    `, [examen_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener preguntas asignadas:', error);
    res.status(500).json({
      message: '❌ Error al obtener preguntas asignadas',
      error: error.message
    });
  }
};
