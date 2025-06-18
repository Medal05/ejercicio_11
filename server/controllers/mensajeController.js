// server/controllers/mensajeController.js
const pool = require('../config/db');

exports.getAllMessages = async (req, res) => {
  try {
    const query = `
      SELECT m.*, u.nombre AS sender_name, u.email AS sender_email, u.id AS sender_id
      FROM mensaje m
      JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ message: 'Error obteniendo mensajes', error: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { sender_id, content, recipient_id, tipo } = req.body;
    if (!sender_id || !content || !recipient_id) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    const query = `
      INSERT INTO mensaje (sender_id, content, recipient_id, tipo, created_at, seen)
      VALUES ($1, $2, $3, $4, NOW(), FALSE)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [sender_id, content, recipient_id, tipo || 'normal']);
    
    // Actualizar el tiempo de actividad del usuario
    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [sender_id]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creando mensaje:', error);
    res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { message_id } = req.params;
    const query = `UPDATE mensaje SET seen = TRUE WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [message_id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error marcando mensaje como visto:', error);
    res.status(500).json({ message: 'Error marcando mensaje como visto', error: error.message });
  }
};