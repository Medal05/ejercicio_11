// authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Configuración del transporter con pool para mejorar la velocidad de envío
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,              // ej: "smtp.gmail.com"
  port: parseInt(process.env.SMTP_PORT, 10),  // ej: 587
  secure: false,                            // false para puerto 587, true para 465
  pool: true,                               // Habilita el pool de conexiones
  maxConnections: 5,                        // Ajusta según la carga esperada
  maxMessages: 100,                         // Límite de mensajes por conexión
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Registrar usuario
exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;
  
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserResult = await pool.query(
      'INSERT INTO users (nombre, email, password, last_active) VALUES ($1, $2, $3, NOW()) RETURNING id, nombre, email',
      [nombre, email, hashedPassword]
    );
    const newUser = newUserResult.rows[0];

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, nombre: newUser.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error("Error registrando usuario: ", error);
    return res.status(500).json({ message: 'Error registrando usuario' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // 1. Buscar usuario y verificar credenciales en una sola operación
    const { rows: [user] } = await pool.query(
      `SELECT id, nombre, email, password, active 
       FROM users WHERE email = $1`, 
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    if (user.active) {
      return res.status(403).json({ 
        message: 'Usuario ya tiene sesión activa. Cierre sesión primero.' 
      });
    }

    // 2. Generar token y actualizar estado en paralelo
    const [token] = await Promise.all([
      jwt.sign(
        { id: user.id, email: user.email, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      ),
      pool.query(
        'UPDATE users SET active = true, last_active = NOW() WHERE id = $1',
        [user.id]
      )
    ]);

    // 3. Respuesta simplificada
    return res.json({ 
      token, 
      user: { id: user.id, nombre: user.nombre, email: user.email } 
    });

  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};
// Cerrar sesión
exports.logout = async (req, res) => {
  const { userId } = req.body;
  try {
    await pool.query('UPDATE users SET active = false WHERE id = $1', [userId]);
    return res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error("Error al cerrar sesión: ", error);
    return res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

// Recuperación de contraseña: Paso 1 - Solicitar Código
exports.recoverPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Buscar usuario en la base de datos usando el correo ingresado por el usuario
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'No se encontró un usuario con ese correo' });
    }
    const user = userResult.rows[0];

    // Genera un código de recuperación de 6 dígitos
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Inserta el código en la tabla password_recovery
    await pool.query(
      'INSERT INTO password_recovery (user_id, recovery_code) VALUES ($1, $2)',
      [user.id, recoveryCode]
    );

    const mailOptions = {
      from: `"Soporte" <${process.env.SMTP_USER}>`,
      to: email,  // Se envía al correo que el usuario ingresó para recuperar su contraseña
      subject: "Código de Recuperación",
      text: `Tu código de recuperación es: ${recoveryCode}`,
    };

    // Enviar el correo usando el transporter con pool
    let info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);
    return res.json({ message: 'Código enviado al correo' });
  } catch (error) {
    console.error("Error en recoverPassword:", error);
    return res.status(500).json({ message: 'Error en la recuperación de contraseña' });
  }
};

// Recuperación de contraseña: Paso 2 - Verificar Código
exports.verifyRecoveryCode = async (req, res) => {
  const { email, recoveryCode } = req.body;
  try {
    // Buscar usuario
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'No se encontró un usuario con ese correo' });
    }
    const user = userResult.rows[0];

    // Buscar el código de recuperación en la tabla que no haya sido usado
    const recoveryResult = await pool.query(
      'SELECT * FROM password_recovery WHERE user_id = $1 AND recovery_code = $2 AND used = false ORDER BY created_at DESC LIMIT 1',
      [user.id, recoveryCode]
    );
    if (recoveryResult.rows.length === 0) {
      return res.status(400).json({ message: 'Código de recuperación inválido' });
    }
    const recoveryRecord = recoveryResult.rows[0];

    // Verificar la expiración del código (por ejemplo, 15 minutos de validez)
    const createdAt = new Date(recoveryRecord.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);
    if (diffMinutes > 15) {
      return res.status(400).json({ message: 'El código de recuperación ha expirado' });
    }

    // Marcar el código como usado para evitar reutilización
    await pool.query('UPDATE password_recovery SET used = true WHERE id = $1', [recoveryRecord.id]);

    return res.json({ message: 'Código validado. Puedes restablecer tu contraseña.' });
  } catch (error) {
    console.error("Error en verifyRecoveryCode:", error);
    return res.status(500).json({ message: 'Error al verificar el código de recuperación' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  
  try {
    // 1. Buscar usuario y actualizar contraseña en una operación más eficiente
    const { rows: [user] } = await pool.query(
      'SELECT id FROM users WHERE email = $1', 
      [email]
    );

    if (!user) {
      return res.status(400).json({ message: 'No se encontró un usuario con ese correo' });
    }

    // 2. Hash de contraseña y actualización en paralelo
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Salt auto-generado
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    // 3. Respuesta mejorada
    return res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error en resetPassword:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al restablecer la contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función para cerrar sesiones inactivas cada 8 minutos
const cerrarSesionesInactivas = async () => {
  try {
    await pool.query(`
      UPDATE users 
      SET active = false 
      WHERE active = true AND last_active < NOW() - INTERVAL '8 minutes'
    `);
    console.log("Sesiones inactivas cerradas.");
  } catch (error) {
    console.error("Error cerrando sesiones inactivas:", error);
  }
};

setInterval(cerrarSesionesInactivas, 8 * 60 * 1000);
