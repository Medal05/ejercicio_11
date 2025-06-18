// server/routes/preguntasRoutes.js
const express = require('express');
const router = express.Router();
const preguntasController = require('../controllers/preguntasController');

router.post('/', preguntasController.createPregunta);

// server/routes/preguntasRoutes.js
router.get(
    '/clase/:class_id/admin/:admin_id',
    preguntasController.getBancoPreguntas
  );
  

module.exports = router;
