// client/src/components/Chat.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Chat.css'; // Asegúrate de importar el nuevo archivo de estilos
import ListaUsuarios from './ListaUsuarios';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  // Para enviar mensajes: opción predefinida o "personalizado"
  const [messageTypeOption, setMessageTypeOption] = useState('normal');
  const [customMessageType, setCustomMessageType] = useState('');
  // Para filtrar mensajes: se selecciona la categoría (por defecto 'all' muestra todos)
  const [filterType, setFilterType] = useState('all');
  // Para el filtro de mensajes personalizados
  const [filterCustomText, setFilterCustomText] = useState('');
  
  

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const sender_id = user ? user.id : null;

  // Polling: actualiza los mensajes cada 3 segundos
  useEffect(() => {
    const fetchMessages = () => {
      fetch('/api/mensaje')
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch((err) => console.error('Error obteniendo mensajes:', err));
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, []);

  // Marcar mensajes no leídos como vistos
  useEffect(() => {
    if (selectedUser && sender_id) {
      const unseenMessages = messages.filter(
        (msg) =>
          msg.recipient_id === sender_id &&
          msg.sender_id === selectedUser.id &&
          !msg.seen
      );
      unseenMessages.forEach((msg) => {
        fetch(`/api/mensaje/seen/${msg.id}`, { method: 'PUT' });
      });
    }
  }, [selectedUser, messages, sender_id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sender_id || !selectedUser) return;
    let tipo = messageTypeOption;
    if (messageTypeOption === 'personalizado') {
      if (!customMessageType.trim()) {
        alert("Ingrese una etiqueta personalizada");
        return;
      }
      tipo = customMessageType.trim();
    }
    try {
      const res = await fetch('/api/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id,
          content: message,
          recipient_id: selectedUser.id,
          tipo: tipo
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setMessage('');
        setMessageTypeOption('normal');
        setCustomMessageType('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filtrado de mensajes:
  const filteredMessages = selectedUser
    ? messages.filter((msg) => {
        const isChatMessage =
          (msg.sender_id === sender_id && msg.recipient_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.recipient_id === sender_id);
        if (!isChatMessage) return false;
        if (filterType === 'all') return true;
        if (filterType === 'personalizado') {
          if (filterCustomText.trim() !== '') {
            return msg.tipo.toLowerCase().includes(filterCustomText.trim().toLowerCase());
          } else {
            return !["normal", "urgente", "personal", "Clase"].includes(msg.tipo.toLowerCase());
          }
        }
        return msg.tipo.toLowerCase() === filterType.toLowerCase();
      })
    : [];

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ListaUsuarios onSelectUser={setSelectedUser} selectedUser={selectedUser} />
        <div className="chat-section">
          <div className="chat-header">
            <h2>
              {selectedUser ? `Chat con ${selectedUser.nombre}` : 'Selecciona un usuario'}
            </h2>
            {selectedUser && (
              <div className="filter-container">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterCustomText('');
                  }}
                  className="message-filter-select"
                >
                  <option value="all">Todos</option>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="personal">Personal</option>
                  <option value="Clase">Clase</option>
                  <option value="personalizado">Personalizado</option>
                </select>
                {filterType === 'personalizado' && (
                  <input
                    type="text"
                    value={filterCustomText}
                    onChange={(e) => setFilterCustomText(e.target.value)}
                    placeholder="Buscar etiqueta personalizada"
                    className="filter-custom-input"
                  />
                )}
              </div>
            )}
          </div>
          <div className="messages-container">
            {selectedUser &&
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === sender_id ? 'user-message' : 'other-message'}`}
                >
                  <p className="message-sender">
                    <strong>{msg.sender_name}</strong> - <em>{msg.tipo}</em>
                  </p>
                  <p className="message-content">{msg.content}</p>
                  {/* Badge "Visto" / "No visto" */}
                  <div className={`message-status ${msg.seen ? 'seen' : 'unseen'}`}>
                    {msg.seen ? 'Visto' : 'No visto'}
                  </div>
                  <small className="message-timestamp">
                    {new Date(msg.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
          </div>
          {selectedUser && (
            <form onSubmit={handleSend} className="chat-input-container">
              <select
                value={messageTypeOption}
                onChange={(e) => setMessageTypeOption(e.target.value)}
                className="message-type-select"
              >
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="personal">Personal</option>
                <option value="Clase">Clase</option>
                <option value="personalizado">Personalizado</option>
              </select>
              {messageTypeOption === 'personalizado' && (
                <input
                  type="text"
                  value={customMessageType}
                  onChange={(e) => setCustomMessageType(e.target.value)}
                  placeholder="Etiqueta personalizada"
                  className="custom-type-input"
                />
              )}
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                required
                className="chat-input"
              />
              <button type="submit" className="chat-send-button">
                Enviar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
