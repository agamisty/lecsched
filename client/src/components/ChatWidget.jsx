import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, lecturersAPI } from '../services/api';

const SOCKET_URL = '';
const ROOMS = [
  { id: 'general', label: 'General' },
  { id: 'postgraduate', label: 'Postgraduate' }
];

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('general');
  const [chatWith, setChatWith] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    lecturersAPI.list()
      .then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      setMessages((prev) => {
        if (chatWith) {
          if (!msg.isPrivate) return prev;
          const otherId = msg.userId === user?.id ? msg.recipientId : msg.userId;
          if (otherId !== chatWith.id) return prev;
        } else {
          if (msg.isPrivate) return prev;
          if (msg.room && msg.room !== room) return prev;
        }
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      if (!open) setUnread((u) => u + 1);
    });

    s.on('online-users', (ids) => setOnlineIds(ids));

    return () => s.disconnect();
  }, [user, chatWith, room, open]);

  useEffect(() => {
    if (socket && user?.id) socket.emit('switch-room', room);
  }, [room, socket, user]);

  useEffect(() => {
    if (!socket) return;
    const apiCall = chatWith
      ? messagesAPI.list({ params: { type: 'private', with: chatWith.id } })
      : messagesAPI.list({ params: { room } });
    apiCall.then((res) => setMessages(res.data)).catch(() => {});
  }, [chatWith, room, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    if (chatWith) {
      socket.emit('private-message', {
        userId: user?.id, userName: user?.name,
        text: text.trim(), recipientId: chatWith.id, recipientName: chatWith.name
      });
    } else {
      socket.emit('send-message', {
        userId: user?.id, userName: user?.name,
        text: text.trim(), room
      });
    }
    setText('');
  };

  const isOnline = (id) => onlineIds.includes(id);

  return (
    <>
      <button
        className="cw-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && <span className="cw-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="cw-panel">
          <div className="cw-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="cw-sidebar-toggle"
                onClick={() => setShowSidebar((s) => !s)}
                aria-label="Toggle contacts"
              >
                <ChevronDown size={16} style={{ transform: showSidebar ? 'rotate(90deg)' : 'rotate(-90deg)', transition: '0.2s' }} />
              </button>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {chatWith ? chatWith.name : room === 'postgraduate' ? 'Postgraduate' : 'General'}
              </span>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          {showSidebar && (
            <div className="cw-sidebar">
              <div className="cw-sidebar-section">
                <div className="cw-sidebar-label">Rooms</div>
                {ROOMS.map((r) => (
                  <div
                    key={r.id}
                    className={`cw-sidebar-item${!chatWith && room === r.id ? ' active' : ''}`}
                    onClick={() => { setChatWith(null); setRoom(r.id); setShowSidebar(false); }}
                  >
                    {r.label}
                  </div>
                ))}
              </div>
              <div className="cw-sidebar-section">
                <div className="cw-sidebar-label">Lecturers</div>
                {lecturers.map((lec) => (
                  <div
                    key={lec.id}
                    className={`cw-sidebar-item${chatWith?.id === lec.id ? ' active' : ''}`}
                    onClick={() => { setChatWith(lec); setShowSidebar(false); }}
                  >
                    <span className={`cw-dot${isOnline(lec.id) ? ' online' : ''}`} />
                    {lec.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cw-messages">
            {messages.length === 0 && (
              <div className="cw-empty">
                {chatWith ? `No messages with ${chatWith.name} yet.` : 'No messages yet.'}
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`cw-msg${msg.userId === user?.id ? ' own' : ' other'}`}>
                <div className="cw-msg-sender">{msg.userName}</div>
                <div>{msg.text}</div>
                <div className="cw-msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className="cw-input" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={chatWith ? `Message ${chatWith.name}...` : 'Type a message...'}
            />
            <button type="submit" className="cw-send" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
