// server/routes/jobsRoutes.js
const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');

// GET todas las ofertas
router.get('/', jobsController.getAllJobs);

// POST crear una nueva oferta
router.post('/', jobsController.createJob);

module.exports = router;
