// server/controllers/examenPreguntasController.js
const pool = require('../config/db');

// Asignar preguntas a un examen sin duplicados con validación y logs
exports.asignarPreguntasAExamen = async (req, res) => {
  try {
    const { examen_id, preguntas } = req.body;

    // Validación de datos recibidos
    if (!examen_id || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({
        message: 'Datos inválidos: asegúrate de enviar examen_id y un arreglo con preguntas.'
      });
    }

    console.log(`Asignando ${preguntas.length} preguntas al examen ${examen_id}`);

    for (const preguntaId of preguntas) {
      if (!preguntaId) {
        console.warn(`Pregunta inválida:`, preguntaId);
        continue;
      }

      // Verificar si ya está asignada
      const yaExiste = await pool.query(
        'SELECT id FROM examen_preguntas WHERE examen_id = $1 AND pregunta_id = $2',
        [examen_id, preguntaId]
      );

      if (yaExiste.rows.length === 0) {
        try {
          await pool.query(
            'INSERT INTO examen_preguntas (examen_id, pregunta_id) VALUES ($1, $2)',
            [examen_id, preguntaId]
          );
          console.log(`✅ Asignada pregunta ${preguntaId} al examen ${examen_id}`);
        } catch (insertError) {
          console.error(`❌ Error insertando pregunta ${preguntaId}:`, insertError.message);
        }
      } else {
        console.log(`⚠️ Pregunta ${preguntaId} ya estaba asignada`);
      }
    }

    return res.status(201).json({ message: '✅ Preguntas asignadas correctamente.' });
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
