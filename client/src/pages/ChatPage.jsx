import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, lecturersAPI } from '../services/api';

const SOCKET_URL = '';
const ROOMS = [
  { id: 'general', label: 'General Room', desc: 'Everyone' },
  { id: 'postgraduate', label: 'Postgraduate', desc: 'MSc & PhD students' }
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [room, setRoom] = useState('general');
  const bottomRef = useRef(null);

  useEffect(() => {
    lecturersAPI.list().then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id))).catch(() => {});

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      setMessages((prev) => {
        if (chatWith) {
          if (!msg.isPrivate) return prev;
          const myId = user?.id;
          const otherId = msg.userId === myId ? msg.recipientId : msg.userId;
          if (otherId !== chatWith.id) return prev;
        } else {
          if (msg.isPrivate) return prev;
          if (msg.room && msg.room !== room) return prev;
        }
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
    });

    s.on('online-users', (ids) => setOnlineIds(ids));

    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('switch-room', room);
    }
  }, [room, socket, user]);

  useEffect(() => {
    if (chatWith) {
      messagesAPI.list({ params: { type: 'private', with: chatWith.id } })
        .then((res) => setMessages(res.data))
        .catch(() => {});
    } else {
      messagesAPI.list({ params: { room } })
        .then((res) => setMessages(res.data))
        .catch(() => {});
    }
  }, [chatWith, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (chatWith) {
      socket?.emit('private-message', {
        userId: user?.id,
        userName: user?.name,
        text: text.trim(),
        recipientId: chatWith.id,
        recipientName: chatWith.name
      });
    } else {
      socket?.emit('send-message', {
        userId: user?.id,
        userName: user?.name,
        text: text.trim(),
        room
      });
    }
    setText('');
  };

  const isOnline = (id) => onlineIds.includes(id);

  return (
    <Layout>
      <div className="page-header">
        <h1>Chat</h1>
        <p>{chatWith ? `Private: ${chatWith.name}` : room === 'postgraduate' ? 'Postgraduate Discussion' : 'General Discussion'}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: '520px' }}>
        <div style={{ width: '220px', flexShrink: 0, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', color: '#888' }}>Rooms</div>
          {ROOMS.map((r) => (
            <div
              key={r.id}
              onClick={() => { setChatWith(null); setRoom(r.id); }}
              style={{
                padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                background: !chatWith && room === r.id ? '#e8f4fd' : 'transparent',
                fontWeight: !chatWith && room === r.id ? 600 : 400
              }}
            >
              <div style={{ fontSize: '0.9rem' }}>{r.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#999' }}>{r.desc}</div>
            </div>
          ))}
          <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Lecturers</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {lecturers.map((lec) => (
              <div
                key={lec.id}
                onClick={() => setChatWith(lec)}
                style={{
                  padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                  background: chatWith?.id === lec.id ? '#e8f4fd' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    background: isOnline(lec.id) ? '#51cf66' : '#ccc', flexShrink: 0
                  }} />
                  <span style={{ fontSize: '0.9rem' }}>{lec.name}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#999', marginLeft: '1rem' }}>
                  {isOnline(lec.id) ? 'Online' : 'Offline'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-container" style={{ flex: 1, height: '100%' }}>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                {chatWith ? `No messages with ${chatWith.name} yet.` : 'No messages in this room yet.'}
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.userId === user?.id ? 'own' : 'other'}`}
                style={msg.isPrivate ? { borderLeft: '3px solid #ffd43b' } : {}}
              >
                <div className="msg-sender">
                  {msg.userName}
                  {msg.isPrivate && msg.recipientId === user?.id && (
                    <span style={{ fontSize: '0.65rem', color: '#f59f00', marginLeft: '0.3rem' }}>(private)</span>
                  )}
                </div>
                <div>{msg.text}</div>
                <div className="msg-time">{new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input-bar" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={chatWith ? `Message ${chatWith.name}...` : `Message ${room === 'postgraduate' ? 'postgraduate room' : 'everyone'}...`}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
