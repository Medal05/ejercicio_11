// server/routes/calificacionRoutes.js
const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacionController');
const multer  = require('multer');
const path = require('path');

// Configuración personalizada de Multer para guardar el archivo con su nombre y extensión original
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    // Se conserva el nombre original y la extensión del archivo
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Ruta para obtener todas las entregas de una tarea (para admin)
router.get('/task/:tareaId', calificacionController.getCalificacionesPorTarea);

// Ruta para crear una entrega (archivo)
router.post('/', upload.single('archivo'), calificacionController.createCalificacion);

// Ruta para obtener la entrega de un usuario para una tarea específica
router.get('/:tarea_id/:usuario_id', calificacionController.getCalificacionByTaskAndUser);

// Ruta para actualizar la calificación (se pasa el id de la fila de calificacion)
router.put('/:id', calificacionController.updateCalificacion);

module.exports = router;
