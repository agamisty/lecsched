import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Reply, Edit3, Trash2, Search, Check, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, lecturersAPI } from '../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = '';
const ROOMS = [
  { id: 'general', label: 'General Room', desc: 'Everyone' },
  { id: 'postgraduate', label: 'Postgraduate', desc: 'MSc & PhD students' }
];

const truncate = (t, n = 80) => {
  const s = String(t || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [onlineIds, setOnlineIds] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [room, setRoom] = useState('general');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);

  const belongsToThread = (msg) => {
    if (chatWith) {
      if (!msg.isPrivate) return false;
      const otherId = msg.userId === user?.id ? msg.recipientId : msg.userId;
      return otherId === chatWith.id;
    }
    if (msg.isPrivate) return false;
    if (msg.room && msg.room !== room) return false;
    return true;
  };

  useEffect(() => {
    lecturersAPI.list().then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id))).catch(() => {});
    lecturersAPI.admins().then((res) => setAdmins(res.data.filter((a) => a.id !== user?.id))).catch(() => {});

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      setMessages((prev) => {
        if (!belongsToThread(msg)) return prev;
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
    });

    s.on('message-updated', (updated) => {
      setMessages((prev) => {
        if (!belongsToThread(updated)) return prev;
        return prev.map((m) => (m.id === updated.id ? updated : m));
      });
    });

    s.on('message-deleted', ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    s.on('online-users', (ids) => setOnlineIds(ids));

    return () => s.disconnect();
  }, [user, chatWith, room]);

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
    setReplyTo(null);
    setEditingId(null);
    setEditText('');
  }, [chatWith, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const base = { userId: user?.id, userName: user?.name, text: text.trim() };
    if (replyTo) {
      base.replyToId = replyTo.id;
      base.replyUserName = replyTo.userName;
      base.replyText = replyTo.text;
    }

    if (chatWith) {
      socket?.emit('private-message', { ...base, recipientId: chatWith.id, recipientName: chatWith.name });
    } else {
      socket?.emit('send-message', { ...base, room });
    }
    setText('');
    setReplyTo(null);
  };

  const startReply = (msg) => {
    setEditingId(null);
    setReplyTo({ id: msg.id, userName: msg.userName, text: msg.text });
  };

  const startEdit = (msg) => {
    setReplyTo(null);
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || editingId == null) return;
    try {
      const res = await messagesAPI.edit(editingId, { text: editText.trim() });
      setMessages((prev) => prev.map((m) => (m.id === res.data.id ? res.data : m)));
      toast.success('Message updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not edit message');
    }
    cancelEdit();
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesAPI.remove(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      toast.success('Message deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete message');
    }
  };

  const isOnline = (id) => onlineIds.includes(id);

  const q = lecturerSearch.trim().toLowerCase();
  const filteredLecturers = q
    ? lecturers.filter((l) =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.department || '').toLowerCase().includes(q) ||
        (l.departments || []).join(' ').toLowerCase().includes(q)
      )
    : lecturers;

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
          {admins.length > 0 && (
            <>
              <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Administration</div>
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  onClick={() => setChatWith(adm)}
                  style={{
                    padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                    background: chatWith?.id === adm.id ? '#e8f4fd' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                      background: isOnline(adm.id) ? '#51cf66' : '#ccc', flexShrink: 0
                    }} />
                    <span style={{ fontSize: '0.9rem' }}>{adm.name}</span>
                    <span style={{
                      fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: '#e7f5ff', color: '#1971c2', borderRadius: 4, padding: '0.1rem 0.35rem'
                    }}>
                      Admin
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#999', marginLeft: '1rem' }}>
                    {isOnline(adm.id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              ))}
            </>
          )}
          <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Lecturers</div>
          <div className="chat-search">
            <Search size={13} className="chat-search-icon" />
            <input
              value={lecturerSearch}
              onChange={(e) => setLecturerSearch(e.target.value)}
              placeholder="Search lecturers..."
            />
            {lecturerSearch && (
              <button className="chat-search-clear" onClick={() => setLecturerSearch('')} aria-label="Clear search">
                <X size={12} />
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredLecturers.length === 0 && (
              <div className="chat-search-empty">No lecturers found</div>
            )}
            {filteredLecturers.map((lec) => (
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
            {messages.map((msg) => {
              const own = msg.userId === user?.id;
              const isEditing = editingId === msg.id;
              return (
                <div key={msg.id} className={`chat-msg ${own ? 'own' : 'other'}`}
                  style={msg.isPrivate ? { borderLeft: '3px solid #ffd43b' } : {}}
                >
                  <div className="msg-sender">
                    {msg.userName}
                    {msg.isPrivate && msg.recipientId === user?.id && (
                      <span style={{ fontSize: '0.65rem', color: '#f59f00', marginLeft: '0.3rem' }}>(private)</span>
                    )}
                  </div>
                  {msg.replyToId && !isEditing && (
                    <div className="chat-reply-preview">
                      <Reply size={10} /> {truncate(msg.replyUserName)}: {truncate(msg.replyText)}
                    </div>
                  )}
                  {isEditing ? (
                    <form className="chat-edit-form" onSubmit={submitEdit}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      />
                      <div className="chat-edit-actions">
                        <button type="submit" className="btn btn-sm btn-primary"><Check size={12} /> Save</button>
                        <button type="button" className="btn btn-sm" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                  <div className="chat-msg-meta">
                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                      {msg.edited ? ' · edited' : ''}
                    </span>
                    <span className="chat-msg-actions">
                      <button aria-label="Reply" onClick={() => startReply(msg)} title="Reply"><Reply size={12} /></button>
                      {own && (
                        <>
                          <button aria-label="Edit" onClick={() => startEdit(msg)} title="Edit"><Edit3 size={12} /></button>
                          <button className="danger" aria-label="Delete" onClick={() => handleDelete(msg)} title="Delete"><Trash2 size={12} /></button>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-zone">
            {replyTo && (
              <div className="chat-reply-chip">
                <Reply size={11} />
                <span>Replying to <b>{replyTo.userName}</b>: {truncate(replyTo.text, 50)}</span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={12} /></button>
              </div>
            )}
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
      </div>
    </Layout>
  );
}