// server/controllers/tareaController.js
const pool = require('../config/db');

exports.createTarea = async (req, res) => {
  try {
    const { clase_id, nombre, vencimiento, descripcion } = req.body;
    // Verifica que se envíen los campos obligatorios
    if (!clase_id || !nombre || !vencimiento) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Punto 2: Evitar tareas duplicadas (por nombre y clase)
    const existe = await pool.query(
      `SELECT 1 FROM tareas WHERE clase_id = $1 AND nombre = $2 LIMIT 1`,
      [clase_id, nombre.trim()]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ message: "Ya existe una tarea con ese nombre en la clase." });
    }

    const query = `
      INSERT INTO tareas (clase_id, nombre, vencimiento, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [clase_id, nombre, vencimiento, descripcion]);
    // Punto 5: Retornar información relevante
    res.status(201).json({
      message: "Tarea creada correctamente",
      tarea: rows[0]
    });
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
    // Punto 5: Retornar información relevante si no hay tareas
    if (rows.length === 0) {
      return res.status(200).json({ message: "No hay tareas registradas para esta clase.", tareas: [] });
    }
    res.json({ tareas: rows });
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    res.status(500).json({ message: "Error obteniendo tareas", error: error.message });
  }
};
