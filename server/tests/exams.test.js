// server/tests/exams.test.js

const request = require('supertest');
const express = require('express');
const examsRoutes = require('../routes/examsRoutes');


require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api/exams', examsRoutes);

describe('Exams API', () => {
  // Prueba para GET /api/exams
  it('debería responder con una lista de exámenes', async () => {
    const response = await request(app).get('/api/exams');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Prueba para POST /api/exams (creación de examen)
  it('debería crear un examen nuevo', async () => {
    const nuevoExamen = {
      nombre: 'Examen de prueba',
      descripcion: 'Este es un examen generado por test',
      contrasena: '12345',
      creador_id: 1,     // asegúrate de que este ID exista en tu DB
      class_id: 1        // asegúrate de que este ID exista en tu DB
    };

    const res = await request(app)
      .post('/api/exams')
      .send(nuevoExamen);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('exam');
    expect(res.body.exam.nombre).toBe(nuevoExamen.nombre);
  });

  // Prueba para GET /api/exams/:id
  it('debería obtener un examen por ID', async () => {
    // Asegúrate que el ID exista o crea uno en el test anterior
    const idExistente = 1;
    const res = await request(app).get(`/api/exams/${idExistente}`);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', idExistente);
    } else {
      expect(res.statusCode).toBe(404); // examen no encontrado
    }
  });

  // Prueba de error para POST sin campos requeridos
  it('debería fallar si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/exams')
      .send({ descripcion: 'sin nombre' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
