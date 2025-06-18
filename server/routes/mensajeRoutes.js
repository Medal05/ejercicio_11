// server/routes/mensajeRoutes.js
const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');

router.get('/', mensajeController.getAllMessages);
router.post('/', mensajeController.createMessage);
router.put('/seen/:message_id', mensajeController.markAsSeen);

module.exports = router;
