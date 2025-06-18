import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  // Estado para determinar el modo: login o recuperación
  const [isRecovery, setIsRecovery] = useState(false);

  // Estados para el login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [captchaValue, setCaptchaValue] = useState(null);
  const [loginMessage, setLoginMessage] = useState('');

  // Estados para el flujo de recuperación (3 pasos)
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: solicitar código, 2: verificar, 3: restablecer
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Para la nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Para confirmar la nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [recoveryMessage, setRecoveryMessage] = useState('');

  // Lista de dominios permitidos (validación básica)
  const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const isEmailValid = (correo) => {
    const parts = correo.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    return allowedDomains.some(d => domain.endsWith(d));
  };

  // Manejo del reCAPTCHA
  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleCaptchaErrored = () => {
    console.error("Error en reCAPTCHA");
    setCaptchaValue(null);
    recaptchaRef.current && recaptchaRef.current.reset();
  };

  const handleCaptchaExpired = () => {
    console.warn("El reCAPTCHA expiró");
    setCaptchaValue(null);
    recaptchaRef.current && recaptchaRef.current.reset();
  };

  // Función para iniciar sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setLoginMessage("Por favor, completa el captcha.");
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captcha: captchaValue }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/university');
      } else {
        setLoginMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setLoginMessage("Ocurrió un error al iniciar sesión.");
    }
  };

  // ==============================
  // Flujo de recuperación de contraseña
  // ==============================

  // Paso 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    // Verificamos que el correo ingresado sea válido
    if (!isEmailValid(recoveryEmail)) {
      setRecoveryMessage("El correo no es válido o el dominio no está permitido.");
      return;
    }
    try {
      // Enviamos la solicitud al endpoint, pasando el correo que el usuario quiere recuperar
      // Esto hará que el back‑end genere y envíe el código a recoveryEmail
      const res = await fetch('http://localhost:5000/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        // Si todo va bien, pasamos al siguiente paso
        setRecoveryMessage(data.message);
        setRecoveryStep(2);
      } else {
        setRecoveryMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al solicitar el código.");
    }
  };

  // Paso 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      // Verificamos el código que el usuario ingresó
      const res = await fetch('http://localhost:5000/api/auth/verifyRecoveryCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, recoveryCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryMessage(data.message);
        setRecoveryStep(3);
      } else {
        setRecoveryMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al verificar el código.");
    }
  };

  // Paso 3: Restablecer contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    // Validamos que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setRecoveryMessage("Las contraseñas no coinciden.");
      return;
    }
    try {
      // Enviamos la nueva contraseña y el correo que estamos recuperando
      const res = await fetch('http://localhost:5000/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryMessage(data.message);
        // Después de restablecer, regresamos al login
        setTimeout(() => {
          setIsRecovery(false);
          setRecoveryStep(1);
          setRecoveryEmail('');
          setRecoveryCode('');
          setNewPassword('');
          setConfirmPassword('');
          setRecoveryMessage('');
        }, 2000);
      } else {
        setRecoveryMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al restablecer la contraseña.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isRecovery ? (
          <>
            <h2>Recuperar Contraseña</h2>
            {recoveryMessage && <p className="error-msg">{recoveryMessage}</p>}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestCode}>
                <label>
                  Ingresa tu correo:
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Solicitar Código</button>
              </form>
            )}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyCode}>
                <label>
                  Ingresa el código recibido:
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Verificar Código</button>
              </form>
            )}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <label>
                  Nueva Contraseña:
                  <div className="password-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </label>
                <label>
                  Confirmar Nueva Contraseña:
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </label>
                <button type="submit">Restablecer Contraseña</button>
              </form>
            )}
            <div className="auth-link">
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(false);
                  setRecoveryStep(1);
                  setRecoveryMessage('');
                }}
              >
                Volver al Login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
              <label>
                Correo:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Contraseña:
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </label>
              <div className="recaptcha-container">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeW0fAqAAAAAKhW6gWux26t_euhE_Qg3VP4NVBv"
                  onChange={handleCaptchaChange}
                  onErrored={handleCaptchaErrored}
                  onExpired={handleCaptchaExpired}
                />
              </div>
              <button type="submit">Entrar</button>
            </form>
            {loginMessage && <p className="error-msg">{loginMessage}</p>}
            <div className="auth-link">
              <p>¿Olvidaste tu contraseña?</p>
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(true);
                  // Prellenar correo de recuperación si ya se ingresó en login
                  setRecoveryEmail(email);
                  setRecoveryStep(1);
                }}
              >
                Recuperar Contraseña
              </button>
            </div>
            <div className="auth-link">
              <p>¿No tienes una cuenta?</p>
              <button type="button" onClick={() => navigate('/register')}>
                Registrarse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
