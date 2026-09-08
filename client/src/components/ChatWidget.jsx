import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, X, Send, ChevronDown, Reply, Edit3, Trash2, Search, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, lecturersAPI } from '../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = '';
const ROOMS = [
  { id: 'general', label: 'General' },
  { id: 'postgraduate', label: 'Postgraduate' }
];

const truncate = (t, n = 80) => {
  const s = String(t || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
};

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('general');
  const [chatWith, setChatWith] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [onlineIds, setOnlineIds] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [unread, setUnread] = useState(0);
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
    lecturersAPI.list()
      .then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id)))
      .catch(() => {});
    lecturersAPI.admins()
      .then((res) => setAdmins(res.data.filter((a) => a.id !== user?.id)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      setMessages((prev) => {
        if (!belongsToThread(msg)) return prev;
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      if (!open) setUnread((u) => u + 1);
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
    const base = { userId: user?.id, userName: user?.name, text: text.trim() };
    if (replyTo) {
      base.replyToId = replyTo.id;
      base.replyUserName = replyTo.userName;
      base.replyText = replyTo.text;
    }
    if (chatWith) {
      socket.emit('private-message', { ...base, recipientId: chatWith.id, recipientName: chatWith.name });
    } else {
      socket.emit('send-message', { ...base, room });
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

  const switchToRoom = (r) => {
    setChatWith(null);
    setRoom(r);
    setShowSidebar(false);
    setReplyTo(null);
    cancelEdit();
  };

  const switchToLecturer = (lec) => {
    setChatWith(lec);
    setShowSidebar(false);
    setReplyTo(null);
    cancelEdit();
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
                    onClick={() => switchToRoom(r.id)}
                  >
                    {r.label}
                  </div>
                ))}
              </div>
              <div className="cw-sidebar-section">
                <div className="cw-sidebar-label">Administration</div>
                {admins.length === 0 && <div className="cw-search-empty">No admin online</div>}
                {admins.map((adm) => (
                  <div
                    key={adm.id}
                    className={`cw-sidebar-item${chatWith?.id === adm.id ? ' active' : ''}`}
                    onClick={() => switchToLecturer(adm)}
                  >
                    <span className={`cw-dot${isOnline(adm.id) ? ' online' : ''}`} />
                    {adm.name}
                    <Shield size={11} className="cw-admin-tag" />
                  </div>
                ))}
              </div>
              <div className="cw-sidebar-section">
                <div className="cw-sidebar-label">Lecturers</div>
                <div className="cw-search">
                  <Search size={13} className="cw-search-icon" />
                  <input
                    value={lecturerSearch}
                    onChange={(e) => setLecturerSearch(e.target.value)}
                    placeholder="Search lecturers..."
                  />
                  {lecturerSearch && (
                    <button className="cw-search-clear" onClick={() => setLecturerSearch('')} aria-label="Clear search">
                      <X size={12} />
                    </button>
                  )}
                </div>
                {filteredLecturers.length === 0 && (
                  <div className="cw-search-empty">No lecturers found</div>
                )}
                {filteredLecturers.map((lec) => (
                  <div
                    key={lec.id}
                    className={`cw-sidebar-item${chatWith?.id === lec.id ? ' active' : ''}`}
                    onClick={() => switchToLecturer(lec)}
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
            {messages.map((msg) => {
              const own = msg.userId === user?.id;
              const isEditing = editingId === msg.id;
              return (
                <div key={msg.id} className={`cw-msg${own ? ' own' : ' other'}`}>
                  <div className="cw-msg-sender">{msg.userName}</div>
                  {msg.replyToId && !isEditing && (
                    <div className="cw-reply-preview">
                      <Reply size={10} /> {truncate(msg.replyUserName)}: {truncate(msg.replyText)}
                    </div>
                  )}
                  {isEditing ? (
                    <form className="cw-edit-form" onSubmit={submitEdit}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      />
                      <div className="cw-edit-actions">
                        <button type="submit" className="cw-save"><Check size={12} /> Save</button>
                        <button type="button" className="cw-cancel" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="cw-msg-text">{msg.text}</div>
                  )}
                  <div className="cw-msg-meta">
                    <span className="cw-msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.edited ? ' · edited' : ''}
                    </span>
                    <span className="cw-msg-actions">
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

          <div className="cw-input-zone">
            {replyTo && (
              <div className="cw-reply-chip">
                <Reply size={11} />
                <span>Replying to <b>{replyTo.userName}</b>: {truncate(replyTo.text, 50)}</span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={12} /></button>
              </div>
            )}
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
        </div>
      )}
    </>
  );
}