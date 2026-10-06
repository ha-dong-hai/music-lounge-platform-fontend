import { useState, useRef, useEffect } from 'react';
import { Send, Users } from 'lucide-react';
import dayjs from 'dayjs';
import './ChatBox.css';

export default function ChatBox({ messages, onSendMessage, viewerCount, isLive }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && isLive) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <span>Live Chat</span>
        {viewerCount !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444' }}>
            <Users size={16} />
            {viewerCount}
          </span>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">Welcome to the chat room!</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="chat-author">{msg.senderName}</span>
              <span className="chat-text">{msg.content}</span>
              <span className="chat-timestamp">{dayjs(msg.sentAt).format('HH:mm')}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isLive ? "Send a message..." : "Stream is offline"}
          disabled={!isLive}
          maxLength={200}
        />
        <button type="submit" className="btn-send" disabled={!isLive || !inputText.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
