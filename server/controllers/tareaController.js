// server/controllers/tareaController.js
const pool = require('../config/db');

exports.createTarea = async (req, res) => {
  try {
    const { clase_id, nombre, vencimiento, descripcion } = req.body;
    // Verifica que se envíen los campos obligatorios
    if (!clase_id || !nombre || !vencimiento) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    const query = `
      INSERT INTO tareas (clase_id, nombre, vencimiento, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [clase_id, nombre, vencimiento, descripcion]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creando tarea:", error);
    res.status(500).json({ message: "Error creando tarea", error: error.message });
  }
};

exports.getTareasByClase = async (req, res) => {
  try {
    const { clase_id } = req.params;
    const query = `
      SELECT * FROM tareas
      WHERE clase_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [clase_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    res.status(500).json({ message: "Error obteniendo tareas", error: error.message });
  }
};
