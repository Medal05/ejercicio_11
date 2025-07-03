// server/controllers/preguntasController.js
const pool = require('../config/db');

// Crear una nueva pregunta
exports.createPregunta = async (req, res, next) => {
  try {
    const {
      examen_id,
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta_correcta,
      tipo = 'multiple'
    } = req.body;

    const result = await pool.query(
      `INSERT INTO preguntas (
         examen_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, tipo
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [examen_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, tipo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Obtener todas las preguntas de un examen específico
exports.getPreguntasPorExamen = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM preguntas WHERE examen_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Obtener banco de preguntas de la misma clase y administrador
exports.getBancoPreguntas = async (req, res, next) => {
  const { class_id, admin_id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        p.*, 
        e.nombre AS examen_nombre
      FROM preguntas p
      JOIN exams e 
        ON p.examen_id = e.id
      WHERE e.class_id = $1
        AND e.creador_id = $2
      `,
      [class_id, admin_id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
