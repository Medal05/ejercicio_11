// server/controllers/claseController.js
const pool = require('../config/db');

exports.getAllClases = async (req, res) => {
 

exports.createClase = async (req, res) => {
  try {
    const { materia, creador_id, contrasena } = req.body;
    if (!materia || !creador_id || !contrasena) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

exports.joinClase = async (req, res) => {
  try {
    const { clase_id, contrasena, user_id } = req.body;
    // Verifica que la clase exista
    const claseQuery = 'SELECT * FROM clases WHERE id = $1';
    const claseResult = await pool.query(claseQuery, [clase_id]);
    if (claseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Clase no encontrada' });
    }
    const clase = claseResult.rows[0];
    // Si el usuario es el creador, inscribe automáticamente como admin (aunque ya debería estarlo)
    if (clase.creador_id === user_id) {
      const checkQuery = 'SELECT * FROM class_enrollments WHERE class_id = $1 AND user_id = $2';
      const checkResult = await pool.query(checkQuery, [clase_id, user_id]);
      if (checkResult.rows.length === 0) {
        const insertQuery = 'INSERT INTO class_enrollments (class_id, user_id, role) VALUES ($1, $2, \'admin\') RETURNING *';
        const insertResult = await pool.query(insertQuery, [clase_id, user_id]);
        return res.status(201).json({ message: 'Administrador inscrito', enrollment: insertResult.rows[0] });
      } else {
        return res.json({ message: 'Administrador ya inscrito', enrollment: checkResult.rows[0] });
      }
    } else {
      // Para alumnos, verifica la contraseña
      if (clase.contrasena !== contrasena) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
      // Verifica si ya está inscrito
      const checkQuery = 'SELECT * FROM class_enrollments WHERE class_id = $1 AND user_id = $2';
      const checkResult = await pool.query(checkQuery, [clase_id, user_id]);
      if (checkResult.rows.length > 0) {
        return res.json({ message: 'Alumno ya inscrito', enrollment: checkResult.rows[0] });
      }
      // Inserta al usuario como alumno
      const insertQuery = 'INSERT INTO class_enrollments (class_id, user_id, role) VALUES ($1, $2, \'student\') RETURNING *';
      const insertResult = await pool.query(insertQuery, [clase_id, user_id]);
      return res.status(201).json({ message: 'Alumno inscrito correctamente', enrollment: insertResult.rows[0] });
    }
  } catch (error) {
    console.error('Error en joinClase:', error);
    res.status(500).json({ message: 'Error al unirse a la clase', error: error.message });
  }
};
