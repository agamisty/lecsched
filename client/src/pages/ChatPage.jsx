import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Reply, Edit3, Trash2, Search, Check, X, ChevronLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
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
  const { setTotalUnread } = useChat();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [onlineIds, setOnlineIds] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [room, setRoom] = useState('general');
  const [typingName, setTypingName] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingAt = useRef(0);
  const chatWithRef = useRef(chatWith);
  const roomRef = useRef(room);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [contactsOpen, setContactsOpen] = useState(true);

  useEffect(() => {
    chatWithRef.current = chatWith;
    roomRef.current = room;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const belongsToThread = (msg) => {
    const cw = chatWithRef.current;
    const r = roomRef.current;
    if (cw) {
      if (!msg.isPrivate) return false;
      const otherId = msg.userId === user?.id ? msg.recipientId : msg.userId;
      return otherId === cw.id;
    }
    if (msg.isPrivate) return false;
    if (msg.room && msg.room !== r) return false;
    return true;
  };

  const belongsToTyping = (p) => {
    const cw = chatWithRef.current;
    const r = roomRef.current;
    if (p.isPrivate) return cw?.id === p.userId;
    return !cw && p.room === r;
  };

  useEffect(() => {
    lecturersAPI.list().then((res) => setLecturers(res.data.filter((l) => l.id !== user?.id))).catch(() => {});
    lecturersAPI.admins().then((res) => setAdmins(res.data.filter((a) => a.id !== user?.id))).catch(() => {});
    messagesAPI.conversations().then((res) => setConversations(res.data)).catch(() => {});

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => s.emit('join', { userId: user?.id, room: 'general' }));

    s.on('new-message', (msg) => {
      if (msg.isPrivate) {
        const otherId = msg.userId === user?.id ? msg.recipientId : msg.userId;
        if (otherId) {
          const otherName = msg.userId === user?.id ? msg.recipientName : msg.userName;
          setConversations((prev) => [
            { otherId, otherName: otherName || 'Unknown', lastFromMe: msg.userId === user?.id, lastText: msg.text, lastAt: msg.createdAt },
            ...prev.filter((c) => c.otherId !== otherId),
          ]);
        }
        if (msg.recipientId === user?.id && chatWithRef.current?.id !== msg.userId) {
          setUnreadMap((prev) => ({ ...prev, [msg.userId]: (prev[msg.userId] || 0) + 1 }));
          toast(`${otherName || msg.userName}: ${truncate(msg.text, 40)}`);
        }
      }
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

    s.on('online-users', (ids) => setOnlineIds(ids));

    return () => {
      clearTimeout(typingTimer.current);
      s.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('switch-room', room);
    }
  }, [room, socket, user]);

  useEffect(() => {
    setReplyTo(null);
    setEditingId(null);
    setEditText('');
    setTypingName(null);
  }, [chatWith, room]);

  useEffect(() => {
    setTotalUnread(Object.keys(unreadMap).filter((k) => unreadMap[k] > 0).length);
  }, [unreadMap, setTotalUnread]);

  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      if (document.hidden) return;
      messagesAPI.conversations().then((res) => setConversations(res.data)).catch(() => {});
      const apiCall = chatWith
        ? messagesAPI.list({ params: { type: 'private', with: chatWith.id } })
        : messagesAPI.list({ params: { room } });
      apiCall.then((res) => setMessages(res.data)).catch(() => {});
      if (chatWith) {
        messagesAPI.markRead({ with: chatWith.id }).then(() => {
          setUnreadMap((prev) => {
            if (!(chatWith.id in prev)) return prev;
            const n = { ...prev };
            delete n[chatWith.id];
            return n;
          });
        }).catch(() => {});
      }
    };
    refresh();
    const t = setInterval(refresh, 700);
    return () => clearInterval(t);
  }, [chatWith, room, user]);

  useEffect(() => {
    if (!user?.id) return;
    const refreshUnread = () => {
      if (document.hidden) return;
      messagesAPI.unread().then((res) => {
        const senders = res.data.senders || [];
        setUnreadMap((prev) => {
          const next = {};
          for (const s of senders) next[s.userId] = s.count;
          return next;
        });
      }).catch(() => {});
    };
    refreshUnread();
    const t = setInterval(refreshUnread, 1200);
    return () => clearInterval(t);
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const isOnline = (id) => onlineIds.includes(id);

  const openChat = (contact) => {
    setChatWith(contact);
    messagesAPI.markRead({ with: contact.id }).catch(() => {});
    setUnreadMap((prev) => { const n = { ...prev }; delete n[contact.id]; return n; });
    if (isMobile) setContactsOpen(false);
  };

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

      <div className="chat-body">
        <div className={`chat-sidebar${isMobile && !contactsOpen ? ' hidden' : ''}`}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', color: '#888' }}>Rooms</div>
          {ROOMS.map((r) => (
            <div
              key={r.id}
              onClick={() => { setChatWith(null); setRoom(r.id); if (isMobile) setContactsOpen(false); }}
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
          {conversations.length > 0 && (
            <>
              <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Conversations</div>
              {conversations.map((c) => {
                const unreadCount = unreadMap[c.otherId] || 0;
                const active = chatWith?.id === c.otherId;
                return (
                  <div
                    key={c.otherId}
                    onClick={() => openChat({ id: c.otherId, name: c.otherName })}
                    style={{
                      padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                      background: active ? '#e8f4fd' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}>{c.otherName}</span>
                      {unreadCount > 0 && (
                        <span className="chat-convo-badge">{unreadCount}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#999', marginLeft: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.lastFromMe ? `You: ${truncate(c.lastText, 30)}` : truncate(c.lastText, 34)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {admins.length > 0 && (
            <>
              <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Administration</div>
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  onClick={() => openChat(adm)}
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
                  onClick={() => openChat(lec)}
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

        <div className={`chat-container chat-main${isMobile && contactsOpen ? ' hidden' : ''}`}>
          {isMobile && !contactsOpen && (
            <div className="chat-mobile-bar">
              <button type="button" className="chat-mobile-back" onClick={() => setContactsOpen(true)}>
                <ChevronLeft size={14} /> Contacts
              </button>
              <span className="chat-mobile-title">{chatWith ? chatWith.name : room === 'postgraduate' ? 'Postgraduate' : 'General'}</span>
            </div>
          )}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                {chatWith ? `No messages with ${chatWith.name} yet.` : 'No messages in this room yet.'}
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
                <div key={msg.id} className={`chat-msg ${own ? 'own' : 'other'} ${fromAdmin ? 'admin' : 'lecturer'}`}
                  style={msg.isPrivate ? { borderLeft: '3px solid #ffd43b' } : {}}
                >
                  <div className="msg-sender">
                    {msg.userName}
                    <span className={`chat-role-tag ${fromAdmin ? 'admin' : 'lecturer'}`}>{fromAdmin ? 'Admin' : 'Lecturer'}</span>
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
            {typingName && <div className="chat-typing">{typingName} is typing…</div>}
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
                onChange={(e) => { setText(e.target.value); emitTyping(e.target.value); }}
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