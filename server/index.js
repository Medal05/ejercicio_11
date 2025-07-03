const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db'); // Importar la conexión a la BD
require('dotenv').config();

const jobsRoutes = require('./routes/jobsRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clasesRoutes = require('./routes/clasesRoutes');
const tareasRoutes = require('./routes/tareasRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');
const examsRoutes = require('./routes/examsRoutes');
const preguntasRoutes = require('./routes/preguntasRoutes');
const examenPreguntasRoutes = require('./routes/examenPreguntasRoutes');
const respuestasEstudianteRoutes = require('./routes/respuestasEstudianteRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta "uploads"
app.use('/uploads', express.static('uploads'));

app.use('/api/jobs', jobsRoutes);
app.use('/api/mensaje', mensajeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/calificacion', calificacionRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/preguntas', preguntasRoutes);
app.use('/api/examen-preguntas', examenPreguntasRoutes);
app.use('/api/respuestas-estudiante', respuestasEstudianteRoutes);

// Agrega el middleware de errores al final
app.use(errorHandler);

// WebSockets: Manejo de conexiones de usuarios
io.on('connection', async (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('userConnected', async (userId) => {
    if (userId) {
      await pool.query('UPDATE users SET active = true, last_active = NOW() WHERE id = $1', [userId]);
      io.emit('updateUsers');
    }
  });

  socket.on('userDisconnected', async (userId) => {
    if (userId) {
      await pool.query('UPDATE users SET active = false WHERE id = $1', [userId]);
      io.emit('updateUsers');
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Función para cerrar sesiones inactivas cada 8 minutos
const cerrarSesionesInactivas = async () => {
  try {
    console.log("Ejecutando cierre de sesiones inactivas...");
    const result = await pool.query(`
      UPDATE users 
      SET active = false 
      WHERE active = true AND last_active < NOW() - INTERVAL '4 minutes'
      RETURNING id, nombre;
    `);
    console.log("Usuarios desactivados:", result.rows);
  } catch (error) {
    console.error("Error cerrando sesiones inactivas:", error);
  }
};

// Ejecutar cada 8 minutos
console.log("Iniciando cierre automático de sesiones cada 8 minutos...");
setInterval(cerrarSesionesInactivas, 8 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

module.exports = io;
