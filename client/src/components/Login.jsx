import React, { useState, useRef, useEffect } from 'react'; // Agregamos useEffect
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css'; // Asegúrate de que tus estilos CSS manejen .success-msg y .error-msg

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
  const [isLoginMessageSuccess, setIsLoginMessageSuccess] = useState(false); // Para diferenciar tipo de mensaje

  // Estados para el flujo de recuperación (3 pasos)
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: solicitar código, 2: verificar, 3: restablecer
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Para la nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(''); // Mensaje de error para nueva contraseña

  // Para confirmar la nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(''); // Mensaje de error para confirmar contraseña

  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRecoveryMessageSuccess, setIsRecoveryMessageSuccess] = useState(false); // Para diferenciar tipo de mensaje

  // Nuevo estado para manejar la carga en todas las solicitudes
  const [isLoading, setIsLoading] = useState(false);

  // Estado para el contador de reenvío de código
  const [resendTimer, setResendTimer] = useState(0); // Segundos restantes

  // useEffect para el contador de reenvío
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    }
    return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta o el timer cambia
  }, [resendTimer]);

  // Lista de dominios permitidos (validación básica)
  const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const isEmailValid = (correo) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) return false;

    const parts = correo.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    return allowedDomains.some(d => domain.endsWith(d));
  };

  // Función para validar la complejidad de la nueva contraseña
  const validateNewPassword = (pwd) => {
    let errors = [];
    if (pwd.length < 8) {
      errors.push("Al menos 8 caracteres");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Una letra mayúscula");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Una letra minúscula");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Un número");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(pwd)) {
      errors.push("Un carácter especial (!@#$%^&*)");
    }
    return errors.length ? errors.join(", ") : "";
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
    setLoginMessage(''); // Limpiar mensajes anteriores
    setIsLoginMessageSuccess(false);

    if (!captchaValue) {
      setLoginMessage("Por favor, completa el captcha.");
      return;
    }

    setIsLoading(true);
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
        setIsLoginMessageSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setLoginMessage("Ocurrió un error al iniciar sesión.");
      setIsLoginMessageSuccess(false);
    } finally {
      setIsLoading(false);
      recaptchaRef.current && recaptchaRef.current.reset();
      setCaptchaValue(null);
    }
  };

  // ==============================
  // Flujo de recuperación de contraseña
  // ==============================

  // Paso 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setRecoveryMessage(''); // Limpiar mensajes anteriores
    setIsRecoveryMessageSuccess(false);

    if (!isEmailValid(recoveryEmail)) {
      setRecoveryMessage("El correo no es válido o el dominio no está permitido.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryMessage(data.message + ". Revisa tu bandeja de entrada.");
        setIsRecoveryMessageSuccess(true);
        setRecoveryStep(2);
        setResendTimer(60); // Iniciar contador para reenviar código
      } else {
        setRecoveryMessage(data.message);
        setIsRecoveryMessageSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al solicitar el código. Intenta de nuevo.");
      setIsRecoveryMessageSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setRecoveryMessage(''); // Limpiar mensajes anteriores
    setIsRecoveryMessageSuccess(false);

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/verifyRecoveryCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, recoveryCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryMessage(data.message);
        setIsRecoveryMessageSuccess(true);
        setRecoveryStep(3);
        setResendTimer(0); // Detener el contador
      } else {
        setRecoveryMessage(data.message);
        setIsRecoveryMessageSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al verificar el código. Asegúrate de ingresarlo correctamente.");
      setIsRecoveryMessageSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 3: Restablecer contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryMessage(''); // Limpiar mensajes anteriores
    setIsRecoveryMessageSuccess(false);

    const newPwdValidationErrors = validateNewPassword(newPassword);
    if (newPwdValidationErrors) {
      setNewPasswordError(`La contraseña debe tener: ${newPwdValidationErrors}.`);
      return;
    } else {
      setNewPasswordError('');
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      return;
    } else {
      setConfirmPasswordError('');
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryMessage(data.message + ". Serás redirigido al inicio de sesión.");
        setIsRecoveryMessageSuccess(true);
        setTimeout(() => {
          setIsRecovery(false);
          setRecoveryStep(1);
          setRecoveryEmail('');
          setRecoveryCode('');
          setNewPassword('');
          setConfirmPassword('');
          setRecoveryMessage('');
          setIsRecoveryMessageSuccess(false); // Resetear
          setLoginMessage('Contraseña restablecida con éxito. ¡Ahora puedes iniciar sesión!');
          setIsLoginMessageSuccess(true); // Mensaje de éxito en login
        }, 2500); // 2.5 segundos para ver el mensaje
      } else {
        setRecoveryMessage(data.message);
        setIsRecoveryMessageSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setRecoveryMessage("Error al restablecer la contraseña. Intenta de nuevo.");
      setIsRecoveryMessageSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isRecovery ? (
          <>
            <h2>Recuperar Contraseña</h2>
            {recoveryMessage && (
              <p className={isRecoveryMessageSuccess ? "success-msg" : "error-msg"}>
                {recoveryMessage}
              </p>
            )}

            {recoveryStep === 1 && (
              <form onSubmit={handleRequestCode}>
                <label>
                  Ingresa tu correo:
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    aria-describedby="email-format-help"
                  />
                  {!isEmailValid(recoveryEmail) && recoveryEmail && (
                    <span className="input-error-msg" id="email-format-help">
                      Correo no válido o dominio no permitido.
                    </span>
                  )}
                </label>
                <button type="submit" disabled={isLoading || !recoveryEmail.trim() || !isEmailValid(recoveryEmail)}>
                  {isLoading ? 'Solicitando...' : 'Solicitar Código'}
                </button>
                {resendTimer > 0 && (
                  <p className="timer-msg">Reenviar código en {resendTimer} segundos</p>
                )}
                {resendTimer === 0 && recoveryStep === 1 && recoveryEmail && (
                  <button type="button" onClick={handleRequestCode} disabled={isLoading}>
                    Reenviar Código
                  </button>
                )}
              </form>
            )}

            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyCode}>
                <label>
                  Ingresa el código recibido en {recoveryEmail}:
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    required
                    disabled={isLoading}
                    pattern="\d{6}" // Asumiendo un código de 6 dígitos
                    title="El código debe ser de 6 dígitos numéricos."
                  />
                  {recoveryCode && !/^\d{6}$/.test(recoveryCode) && (
                     <span className="input-error-msg">El código debe ser de 6 dígitos numéricos.</span>
                  )}
                </label>
                <button type="submit" disabled={isLoading || !recoveryCode.trim() || !/^\d{6}$/.test(recoveryCode)}>
                  {isLoading ? 'Verificando...' : 'Verificar Código'}
                </button>
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
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError(validateNewPassword(e.target.value)); // Validar en tiempo real
                      }}
                      required
                      disabled={isLoading}
                      aria-describedby="new-pwd-help"
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {newPasswordError && (
                    <span className="input-error-msg" id="new-pwd-help">
                      {newPasswordError}
                    </span>
                  )}
                </label>
                <label>
                  Confirmar Nueva Contraseña:
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (newPassword && e.target.value !== newPassword) {
                          setConfirmPasswordError("Las contraseñas no coinciden.");
                        } else {
                          setConfirmPasswordError('');
                        }
                      }}
                      required
                      disabled={isLoading}
                      aria-describedby="confirm-pwd-help"
                    />
                    <span
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {confirmPasswordError && (
                    <span className="input-error-msg" id="confirm-pwd-help">
                      {confirmPasswordError}
                    </span>
                  )}
                </label>
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword || newPasswordError || confirmPasswordError || newPassword !== confirmPassword}
                >
                  {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </button>
              </form>
            )}
            <div className="auth-link">
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(false);
                  setRecoveryStep(1);
                  setRecoveryMessage('');
                  setIsRecoveryMessageSuccess(false); // Resetear
                  setRecoveryEmail('');
                  setRecoveryCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setNewPasswordError('');
                  setConfirmPasswordError('');
                  setResendTimer(0); // Detener el contador
                }}
                disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            {loginMessage && (
              <p className={isLoginMessageSuccess ? "success-msg" : "error-msg"}>
                {loginMessage}
              </p>
            )}
            <div className="auth-link">
              <p>¿Olvidaste tu contraseña?</p>
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(true);
                  setRecoveryEmail(email);
                  setRecoveryStep(1);
                  setLoginMessage('');
                  setIsLoginMessageSuccess(false); // Resetear
                  // Asegúrate de limpiar otros estados si es necesario
                }}
                disabled={isLoading}
              >
                Recuperar Contraseña
              </button>
            </div>
            <div className="auth-link">
              <p>¿No tienes una cuenta?</p>
              <button type="button" onClick={() => navigate('/register')} disabled={isLoading}>
                Registrarse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;9