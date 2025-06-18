const pool = require('../config/db');

const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM users'); // Revisa si la tabla 'users' existe
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

module.exports = { getUsuarios };
