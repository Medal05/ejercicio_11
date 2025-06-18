// server/routes/examenPreguntasRoutes.js
const express = require('express');
const router = express.Router();
const examenPreguntasController = require('../controllers/examenPreguntasController');

router.post('/', examenPreguntasController.asignarPreguntasAExamen);
router.get('/:examen_id', examenPreguntasController.getPreguntasAsignadas);

module.exports = router;
