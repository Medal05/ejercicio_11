// server/models/Job.js
const pool = require('../config/db');

const Job = {
  async getAllJobs() {
    const query = 'SELECT * FROM jobs ORDER BY id DESC'; 
    // ORDER BY opcional para mostrar el registro más reciente primero
    const { rows } = await pool.query(query);
    return rows; // Retorna un arreglo de objetos (cada fila de la tabla)
  },

  async createJob(jobData) {
    const { title, salary, location, requirements, schedule, contract_type } = jobData;
    const query = `
      INSERT INTO jobs (title, salary, location, requirements, schedule, contract_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [title, salary, location, requirements, schedule, contract_type];
    const { rows } = await pool.query(query, values);
    return rows[0]; // Retorna la fila recién insertada
  },
};

module.exports = Job;
