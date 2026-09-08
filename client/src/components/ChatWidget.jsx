import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, ChevronDown, Reply, Edit3, Trash2, Search, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
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
  const { setTotalUnread } = useChat();
  const location = useLocation();
  const onChatPage = location.pathname === '/chat';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('general');
  const [chatWith, setChatWith] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [onlineIds, setOnlineIds] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [unread, setUnread] = useState(0);
  const [typingName, setTypingName] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingAt = useRef(0);

  const unreadTotal = unread + Object.values(unreadMap).reduce((a, b) => a + b, 0);

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

  const belongsToTyping = (p) => {
    if (p.isPrivate) return chatWith?.id === p.userId;
    return !chatWith && p.room === room;
  };

  useEffect(() => {
    lecturersAPI.list()
      .then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id)))
      .catch(() => {});
    lecturersAPI.admins()
      .then((res) => setAdmins(res.data.filter((a) => a.id !== user?.id)))
      .catch(() => {});
    messagesAPI.conversations()
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      if (onChatPage) return;
      if (msg.isPrivate) {
        const otherId = msg.userId === user?.id ? msg.recipientId : msg.userId;
        if (otherId) {
          const otherName = msg.userId === user?.id ? msg.recipientName : msg.userName;
          setConversations((prev) => [
            { otherId, otherName: otherName || 'Unknown', lastFromMe: msg.userId === user?.id, lastText: msg.text, lastAt: msg.createdAt },
            ...prev.filter((c) => c.otherId !== otherId),
          ]);
        }
        if (msg.recipientId === user?.id && chatWith?.id !== msg.userId) {
          const otherName = msg.userId === user?.id ? msg.recipientName : msg.userName;
          setUnreadMap((prev) => ({ ...prev, [msg.userId]: (prev[msg.userId] || 0) + 1 }));
          toast(`${otherName || 'Unknown'}: ${truncate(msg.text, 40)}`);
        }
      } else if (!open) {
        setUnread((u) => u + 1);
      }
      setMessages((prev) => {
        if (!belongsToThread(msg)) return prev;
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
    });

    s.on('user-typing', (p) => {
      if (!belongsToTyping(p)) return;
      setTypingName(p.name || 'Someone');
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 3000);
    });

    s.on('user-stop-typing', (p) => {
      if (!belongsToTyping(p)) return;
      setTypingName(null);
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

    return () => {
      clearTimeout(typingTimer.current);
      s.disconnect();
    };
  }, [user, chatWith, room, open, onChatPage]);

  useEffect(() => {
    if (socket && user?.id) socket.emit('switch-room', room);
  }, [room, socket, user]);

  useEffect(() => {
    if (onChatPage) return;
    setTotalUnread(unreadTotal);
  }, [unreadTotal, onChatPage, setTotalUnread]);

  useEffect(() => {
    if (!socket || !open) return;
    const refresh = () => {
      if (document.hidden) return;
      messagesAPI.conversations().then((res) => setConversations(res.data)).catch(() => {});
      const apiCall = chatWith
        ? messagesAPI.list({ params: { type: 'private', with: chatWith.id } })
        : messagesAPI.list({ params: { room } });
      apiCall.then((res) => setMessages(res.data)).catch(() => {});
    };
    refresh();
    const t = setInterval(refresh, 700);
    return () => clearInterval(t);
  }, [chatWith, room, socket, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const emitTyping = (t) => {
    if (!socket) return;
    if (t.trim()) {
      const now = Date.now();
      if (now - lastTypingAt.current > 1500) {
        lastTypingAt.current = now;
        socket.emit('typing', { to: chatWith?.id != null ? chatWith.id : null, room: chatWith ? undefined : room, isPrivate: !!chatWith, name: user?.name });
      }
    } else {
      socket.emit('stop-typing', { to: chatWith?.id != null ? chatWith.id : null, room: chatWith ? undefined : room, isPrivate: !!chatWith });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user?.id) return;
    const body = { text: text.trim() };
    if (replyTo) {
      body.replyToId = replyTo.id;
      body.replyUserName = replyTo.userName;
      body.replyText = replyTo.text;
    }
    if (chatWith) {
      body.recipientId = chatWith.id;
      body.recipientName = chatWith.name;
    } else {
      body.room = room;
    }
    setText('');
    setReplyTo(null);
    emitTyping('');

    const preview = {
      id: -Date.now(),
      userId: user.id,
      userName: user.name,
      senderRole: user.role,
      text: body.text,
      recipientId: body.recipientId || null,
      recipientName: body.recipientName || null,
      isPrivate: !!body.recipientId,
      room: body.recipientId ? 'private' : (body.room || 'general'),
      replyToId: body.replyToId || null,
      replyUserName: body.replyUserName || null,
      replyText: body.replyText || null,
      edited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, preview]);
    if (preview.isPrivate) {
      setConversations((prev) => [
        { otherId: preview.recipientId, otherName: preview.recipientName || 'Unknown', lastFromMe: true, lastText: preview.text, lastAt: preview.createdAt },
        ...prev.filter((c) => c.otherId !== preview.recipientId),
      ]);
    }

    try {
      const saved = (await messagesAPI.send(body)).data;
      setMessages((prev) => {
        const withoutPreview = prev.filter((m) => m.id !== preview.id);
        if (withoutPreview.some((m) => m.id === saved.id)) return withoutPreview;
        return [...withoutPreview, saved];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== preview.id));
      toast.error(err.response?.data?.error || 'Could not send message');
    }
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
    setUnread(0);
    setTypingName(null);
  };

  const switchToLecturer = (lec) => {
    setChatWith(lec);
    setShowSidebar(false);
    setReplyTo(null);
    cancelEdit();
    setTypingName(null);
    setUnreadMap((prev) => { const n = { ...prev }; delete n[lec.id]; return n; });
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

  if (onChatPage) return <></>;

  return (
    <>
      <button
        className="cw-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadTotal > 0 && <span className="cw-badge">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
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
              {conversations.length > 0 && (
                <div className="cw-sidebar-section">
                  <div className="cw-sidebar-label">Conversations</div>
                  {conversations.map((c) => {
                    const unreadCount = unreadMap[c.otherId] || 0;
                    return (
                      <div
                        key={c.otherId}
                        className={`cw-sidebar-item${chatWith?.id === c.otherId ? ' active' : ''}`}
                        onClick={() => switchToLecturer({ id: c.otherId, name: c.otherName })}
                      >
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.otherName}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.lastFromMe ? `You: ${truncate(c.lastText, 24)}` : truncate(c.lastText, 28)}
                          </span>
                        </span>
                        {unreadCount > 0 && <span className="cw-convo-badge">{unreadCount}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
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
              const fromAdmin = msg.senderRole
                ? msg.senderRole === 'admin'
                : msg.userId === user?.id
                  ? user.role === 'admin'
                  : admins.some((a) => a.id === msg.userId);
              const isEditing = editingId === msg.id;
              return (
                <div key={msg.id} className={`cw-msg${own ? ' own' : ' other'} ${fromAdmin ? 'admin' : 'lecturer'}`}>
                  <div className="cw-msg-sender">
                    {msg.userName}
                    <span className={`cw-role-tag ${fromAdmin ? 'admin' : 'lecturer'}`}>{fromAdmin ? 'Admin' : 'Lecturer'}</span>
                  </div>
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
            {typingName && <div className="cw-typing">{typingName} is typing…</div>}
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
                onChange={(e) => { setText(e.target.value); emitTyping(e.target.value); }}
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