// server/controllers/jobsController.js

const Job = require('../models/Job');

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.getAllJobs();
    // Enviamos el arreglo "jobs" al frontend
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo ofertas de trabajo' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const newJob = await Job.createJob(req.body);
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error en createJob:', error);
    res.status(500).json({ message: 'Error al agregar la oferta' });
  }
};
