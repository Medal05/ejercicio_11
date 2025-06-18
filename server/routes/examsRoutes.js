// server/routes/examsRoutes.js
const express = require('express');
const router = express.Router();
const examsController = require('../controllers/examsController');

// Obtener todos los exámenes
router.get('/', examsController.getExams);

router.get('/:id', examsController.getExamById);

// Crear nuevo examen
router.post('/', examsController.createExam);

// Verificar contraseña del examen
router.post('/verify', examsController.verifyExamPassword);

module.exports = router;
