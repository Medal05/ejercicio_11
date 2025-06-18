import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Lista de dominios permitidos
  const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

  const validateEmail = (email) => {
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  };

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pwd);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setMessage('El correo debe ser de dominio gmail.com, hotmail.com, outlook.com o yahoo.com.');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registro exitoso');
        navigate('/');
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('Error en el registro.');
    }
  };

  const goToLogin = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Registrarse</h2>
        <form onSubmit={handleRegister}>
          <label>
            Nombre:
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Correo:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Contraseña:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Confirmar Contraseña:
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </label>
          <button type="submit">Registrarse</button>
        </form>
        {message && <p className="error-msg">{message}</p>}

        <div className="auth-link">
          <p>¿Ya tienes una cuenta?</p>
          <button type="button" onClick={goToLogin}>Volver al Login</button>
        </div>
      </div>
    </div>
  );
}

export default Register;
