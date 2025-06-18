const express = require('express');
const router = express.Router();
const controller = require('../controllers/respuestasEstudianteController');


router.get('/examen/:exam_id', controller.obtenerRespuestasPorExamen);
router.get('/:exam_id/:user_id', controller.verificarIntento);
router.post('/', controller.guardarRespuesta);
router.put('/marcar-correcta/:respuesta_id', controller.marcarCorrecta);



module.exports = router;
