import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // Para diferenciar mensajes de éxito/error
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para la carga
  const navigate = useNavigate();

  // Lista de dominios permitidos
  const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

  const validateEmail = (email) => {
    // Validar formato básico de email además del dominio
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  };

  const validatePassword = (pwd) => {
    // La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial.
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pwd);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpiar mensajes anteriores al intentar un nuevo registro
    setIsSuccess(false); // Resetear estado de éxito

    // Validaciones del lado del cliente
    if (!validateEmail(email)) {
      setMessage('El correo no tiene un formato válido o el dominio no está permitido (solo gmail.com, hotmail.com, outlook.com o yahoo.com).');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un carácter especial (!@#$%^&*).');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true); // Iniciar estado de carga
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('¡Registro exitoso! Serás redirigido al inicio de sesión.');
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/'); // Redirigir al login después de un breve retraso
        }, 2000); // Retraso de 2 segundos para que el usuario vea el mensaje de éxito
      } else {
        setMessage(`Error: ${data.message || 'Ocurrió un error en el registro.'}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error en la solicitud de registro:', error);
      setMessage('Ocurrió un error al intentar registrarse. Inténtalo de nuevo más tarde.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false); // Finalizar estado de carga
    }
  };

  const goToLogin = () => {
    // Deshabilitar la navegación si hay una operación en curso (aunque el botón ya estará deshabilitado)
    if (!isLoading) {
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Registrarse</h2>
        <form onSubmit={handleRegister}>
          <label>
            Nombre:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={isLoading} // Deshabilitar input durante carga
            />
          </label>
          <label>
            Correo:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading} // Deshabilitar input durante carga
            />
          </label>
          <label>
            Contraseña:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading} // Deshabilitar input durante carga
            />
          </label>
          <label>
            Confirmar Contraseña:
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading} // Deshabilitar input durante carga
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        {/* Cambia la clase del mensaje dinámicamente */}
        {message && <p className={isSuccess ? 'success-msg' : 'error-msg'}>{message}</p>}

        <div className="auth-link">
          <p>¿Ya tienes una cuenta?</p>
          <button type="button" onClick={goToLogin} disabled={isLoading}>
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;