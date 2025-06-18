// server/routes/tareasRoutes.js
const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');

// Ruta para crear una tarea
router.post('/', tareaController.createTarea);

// Ruta para obtener todas las tareas de una clase
router.get('/:clase_id', tareaController.getTareasByClase);

module.exports = router;
