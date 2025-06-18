// server/routes/clasesRoutes.js
const express = require('express');
const router = express.Router();
const claseController = require('../controllers/claseController');
const pool = require('../config/db');

router.get('/', claseController.getAllClases);
router.get('/:id', claseController.getClaseDetail);
router.post('/', claseController.createClase);

// Ruta opcional para verificar la contraseña (si la necesitas)
router.post('/verify', async (req, res) => {
  const { clase_id, contrasena } = req.body;
  try {
    const query = 'SELECT * FROM clases WHERE id = $1';
    const { rows } = await pool.query(query, [clase_id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Clase no encontrada" });
    const clase = rows[0];
    if (clase.contrasena === contrasena) {
      return res.json({ message: "Acceso concedido" });
    } else {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verificando clase", error: error.message });
  }
});

// Ruta para unirse a la clase
router.post('/join', claseController.joinClase);

// Ruta para obtener la inscripción de un usuario en una clase específica
router.get('/enrollment/:class_id/:user_id', async (req, res) => {
  try {
    const { class_id, user_id } = req.params;
    const query = 'SELECT * FROM class_enrollments WHERE class_id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [class_id, user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No inscrito' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo inscripción', error: error.message });
  }
});

// Ruta para obtener todas las clases donde el usuario es administrador
router.get('/class-enrollments/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = 'SELECT * FROM class_enrollments WHERE user_id = $1 AND role = $2';
    const result = await pool.query(query, [user_id, 'administrador']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo clases como administrador', error: error.message });
  }
});

// Nueva ruta: obtener clases donde el usuario es administrador o creador
router.get('/admin/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = `
      SELECT DISTINCT c.*
      FROM clases c
      LEFT JOIN class_enrollments e ON c.id = e.class_id
      WHERE (e.user_id = $1 AND e.role = 'administrador') OR c.creador_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clases como administrador o creador', error: error.message });
  }
});

// Ruta para obtener nombre de clase y creador del examen
router.get('/examen-info/:exam_id', async (req, res) => {
  const { exam_id } = req.params;
  try {
    const query = `
      SELECT e.id AS exam_id, e.nombre AS exam_nombre, u.nombre AS creador_nombre, c.materia AS clase_nombre
      FROM exams e
      JOIN users u ON e.creador_id = u.id
      LEFT JOIN clases c ON e.class_id = c.id
      WHERE e.id = $1
    `;
    const result = await pool.query(query, [exam_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo información del examen', error: error.message });
  }
});

module.exports = router;
