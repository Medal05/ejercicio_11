const pool = require('../config/db');

const getUsuarios = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM users'); // Revisa si la tabla 'users' existe
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsuarios };
