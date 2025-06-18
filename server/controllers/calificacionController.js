// server/controllers/calificacionController.js
const pool = require('../config/db');

exports.createCalificacion = async (req, res) => {
  try {
    const { tarea_id, usuario_id } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }
    const archivoPath = req.file.path; // Ruta del archivo subido
    const query = `
      INSERT INTO calificacion (tarea_id, usuario_id, archivo)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [tarea_id, usuario_id, archivoPath]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creando calificacion:", error);
    res.status(500).json({ message: "Error creando calificacion", error: error.message });
  }
};

exports.getCalificacionByTaskAndUser = async (req, res) => {
  try {
    const { tarea_id, usuario_id } = req.params;
    const query = `SELECT * FROM calificacion WHERE tarea_id = $1 AND usuario_id = $2`;
    const { rows } = await pool.query(query, [tarea_id, usuario_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontró envío" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error obteniendo calificacion:", error);
    res.status(500).json({ message: "Error obteniendo calificacion", error: error.message });
  }
};

exports.updateCalificacion = async (req, res) => {
  try {
    const { id } = req.params; // id de la fila en la tabla calificacion
    const { calificacion } = req.body;
    if (calificacion === undefined) {
      return res.status(400).json({ message: "La calificación es requerida" });
    }
    const query = `UPDATE calificacion SET calificacion = $1 WHERE id = $2 RETURNING *;`;
    const { rows } = await pool.query(query, [calificacion, id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontró el envío" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error actualizando calificacion:", error);
    res.status(500).json({ message: "Error actualizando calificacion", error: error.message });
  }
};

exports.getCalificacionesPorTarea = async (req, res) => {
  try {
    // Convertir tareaId a entero
    const tareaId = parseInt(req.params.tareaId, 10);
    if (isNaN(tareaId)) {
      return res.status(400).json({ message: "TareaId inválido" });
    }
    console.log("Obteniendo calificaciones para tareaId:", tareaId);
    // Se realiza un JOIN para obtener el nombre del alumno
    const query = `
      SELECT c.*, u.nombre 
      FROM calificacion c
      JOIN users u ON c.usuario_id = u.id
      WHERE c.tarea_id = $1
      ORDER BY c.created_at DESC
    `;
    const { rows } = await pool.query(query, [tareaId]);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo calificaciones por tarea:", error);
    res.status(500).json({ message: "Error obteniendo calificaciones por tarea", error: error.message });
  }
};
