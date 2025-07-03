// server/controllers/examsController.js
const pool = require('../config/db');

// Crear examen
exports.createExam = async (req, res, next) => {
  try {
    const { nombre, descripcion, contrasena, creador_id, class_id } = req.body;

    // Verificar campos necesarios
    if (!nombre || !creador_id || !class_id) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para crear el examen.' });
    }

    // Crear el examen
    const examRes = await pool.query(
      'INSERT INTO exams (nombre, descripcion, contrasena, creador_id, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, descripcion, contrasena, creador_id, class_id]
    );
    const examId = examRes.rows[0].id;

    // Asignar rol de administrador al creador del examen
    await pool.query(
      'INSERT INTO exam_roles (exam_id, user_id, role) VALUES ($1, $2, $3)',
      [examId, creador_id, 'administrador']
    );

    res.status(201).json({ message: 'Examen creado', exam: examRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los exámenes con detalles de la clase y el creador
exports.getExams = async (req, res, next) => {
  try {
    const query = `
      SELECT e.id AS exam_id, e.nombre AS exam_nombre, e.descripcion AS exam_descripcion, 
             u.nombre AS creador_nombre, c.materia AS clase_nombre,
             e.creador_id, e.class_id
      FROM exams e
      JOIN users u ON e.creador_id = u.id
      LEFT JOIN clases c ON e.class_id = c.id
      ORDER BY e.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Obtener un examen por ID (incluye la contraseña)
exports.getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM exams WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Verificar la contraseña del examen (solo alumnos la necesitan)
exports.verifyExamPassword = async (req, res, next) => {
  try {
    const { examen_id, contrasena, user_id } = req.body;

    // Buscar el examen
    const result = await pool.query('SELECT * FROM exams WHERE id = $1', [examen_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Examen no encontrado' });
    }
    const exam = result.rows[0];

    // Verificar si el usuario es administrador en class_enrollments
    const adminCheck = await pool.query(
      'SELECT * FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND role = $3',
      [exam.class_id, user_id, 'administrador']
    );

    // Si es administrador, acceso sin contraseña
    if (adminCheck.rows.length > 0) {
      return res.json({ message: 'Acceso concedido sin necesidad de contraseña' });
    }

    // Si no es administrador, verificar la contraseña
    if (exam.contrasena === contrasena) {
      // Marcarlo como alumno si no está en exam_roles
      const existing = await pool.query(
        'SELECT * FROM exam_roles WHERE exam_id = $1 AND user_id = $2',
        [examen_id, user_id]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO exam_roles (exam_id, user_id, role) VALUES ($1, $2, $3)',
          [examen_id, user_id, 'alumno']
        );
      }

      return res.json({ message: 'Acceso concedido' });
    } else {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    next(error);
  }
};
