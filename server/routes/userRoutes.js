const express = require('express');
const { getUsuarios } = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsuarios); // Define la ruta para obtener los usuarios

module.exports = router;
