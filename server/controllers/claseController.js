// server/controllers/claseController.js
const pool = require('../config/db');

exports.getAllClases = async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.nombre AS creador_nombre, COALESCE(enroll.count, 0) AS num_alumnos
      FROM clases c
      JOIN users u ON c.creador_id = u.id
      LEFT JOIN (
          SELECT class_id, COUNT(*) AS count
          FROM class_enrollments
          GROUP BY class_id
      ) enroll ON c.id = enroll.class_id
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo clases:", error);
    res.status(500).json({ message: "Error obteniendo clases", error: error.message });
  }
};

exports.getClaseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT c.*, u.nombre AS creador_nombre, 
             (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id) AS num_alumnos
      FROM clases c
      JOIN users u ON c.creador_id = u.id
      WHERE c.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Clase no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error obteniendo detalle de la clase:", error);
    res.status(500).json({ message: "Error obteniendo detalle de la clase", error: error.message });
  }
};

exports.createClase = async (req, res) => {
  try {
    const { materia, creador_id, contrasena } = req.body;
    if (!materia || !creador_id || !contrasena) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }
    // Inserta la nueva clase
    const insertQuery = `
      INSERT INTO clases (materia, creador_id, contrasena)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(insertQuery, [materia, creador_id, contrasena]);
    const claseId = rows[0].id;
    // Inscribir automáticamente al creador como administrador
    const enrollQuery = `
      INSERT INTO class_enrollments (class_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `;
    await pool.query(enrollQuery, [claseId, creador_id]);
    // Consultar la clase recién creada (num_alumnos inicialmente 1)
    const query = `
      SELECT c.*, u.nombre AS creador_nombre, 1 AS num_alumnos
      FROM clases c
      JOIN users u ON c.creador_id = u.id
      WHERE c.id = $1;
    `;
    const result = await pool.query(query, [claseId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando clase:", error);
    res.status(500).json({ message: "Error creando clase", error: error.message });
  }
};

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
