import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Phone, Mail, CheckCheck, Check, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';
import './Chat.css';

const ChatRealtime = ({ api }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      socket.emit('join:admin');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    // Listen for new messages
    socket.on('chat:new-message', (message) => {
      console.log('📨 New message received:', message);
      
      // Add to messages if viewing this customer
      if (selectedCustomer && message.customer_id === selectedCustomer.id) {
        setMessages(prev => [...prev, message]);
      }
      
      // Reload sessions to update unread counts
      loadChatSessions();
    });

    // Listen for messages read
    socket.on('chat:messages-read', ({ customerId, messageIds }) => {
      if (selectedCustomer && customerId === selectedCustomer.id) {
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        ));
      }
    });

    // Listen for unread count updates
    socket.on('chat:unread-count', ({ total }) => {
      setUnreadCount(total);
    });

    // Listen for session updates
    socket.on('chat:session-update', (session) => {
      setSessions(prev => {
        const index = prev.findIndex(s => s.customer_id === session.customer_id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = session;
          return updated;
        }
        return [session, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCustomer]);

  useEffect(() => {
    loadChatSessions();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.data.total);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadMessages = async (customerId) => {
    try {
      const response = await api.get(`/chat/messages/${customerId}`);
      if (response.data.success) {
        setMessages(response.data.data);
        
        // Mark messages as read
        await api.post(`/chat/mark-read/${customerId}`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectCustomer = async (session) => {
    setSelectedCustomer(session.customers);
    await loadMessages(session.customers.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;

    setLoading(true);
    try {
      const response = await api.post('/chat/send', {
        customerId: selectedCustomer.id,
        message: newMessage
      });

      if (response.data.success) {
        setNewMessage('');
        // Message will be added via Socket.IO event
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const getChannelBadge = (channel) => {
    const badges = {
      telegram: { color: '#0088cc', label: 'Telegram', icon: '✈️' },
      viber: { color: '#7360f2', label: 'Viber', icon: '💜' },
      messenger: { color: '#0084ff', label: 'Messenger', icon: '💬' }
    };
    const badge = badges[channel] || { color: '#666', label: channel, icon: '📱' };
    return (
      <span style={{
        background: badge.color,
        color: 'white',
        padding: '4px 10px',
        borderRadius: '14px',
        fontSize: '11px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: `0 2px 8px ${badge.color}40`
      }}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const filteredSessions = sessions.filter(session =>
    session.customers.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.customers.phone?.includes(searchQuery) ||
    session.customers.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-container">
      {/* Chat Sessions List */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div>
            <h3>
              <MessageCircle size={22} />
              Real-Time Chat
              {connected ? (
                <Wifi size={16} color="#10b981" style={{ marginLeft: '8px' }} />
              ) : (
                <WifiOff size={16} color="#ef4444" style={{ marginLeft: '8px' }} />
              )}
            </h3>
            <div className="subtitle">
              {connected ? '🟢 Connected' : '🔴 Disconnected'} - {sessions.length} active
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        
        {sessions.length > 0 && (
          <input
            type="text"
            className="chat-search"
            placeholder="Search chats... / ရှာဖွေရန်..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
        
        <div className="chat-sessions-list">
          {filteredSessions.length === 0 ? (
            <div className="empty-state">
              <Users size={64} color="#cbd5e1" />
              <p style={{ marginTop: '16px', fontSize: '15px', fontWeight: '500' }}>
                {searchQuery ? 'No chats found' : 'No active chats'}
              </p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                {searchQuery ? 'ရှာမတွေ့ပါ' : 'စကားပြောမှုမရှိသေးပါ'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`chat-session-item ${selectedCustomer?.id === session.customers.id ? 'active' : ''}`}
                onClick={() => handleSelectCustomer(session)}
              >
                <div className={`session-avatar ${session.is_active ? 'online' : ''}`}>
                  {session.customers.name.charAt(0).toUpperCase()}
                </div>
                <div className="session-info">
                  <div className="session-header">
                    <span className="session-name">{session.customers.name}</span>
                    {getChannelBadge(session.channel)}
                  </div>
                  <div className="session-meta">
                    <span className="session-time">{formatTime(session.last_message_at)}</span>
                    {session.unread_count > 0 && (
                      <span className="session-unread">{session.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="chat-main">
        {selectedCustomer ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedCustomer.name}</h3>
                  <div className="customer-details">
                    {selectedCustomer.phone && (
                      <span><Phone size={12} /> {selectedCustomer.phone}</span>
                    )}
                    {selectedCustomer.email && (
                      <span><Mail size={12} /> {selectedCustomer.email}</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="btn-icon"
                onClick={() => setSelectedCustomer(null)}
                title="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_type === 'admin' ? 'message-sent' : 'message-received'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {msg.sender_type === 'admin' && (
                        msg.is_read ? <CheckCheck size={14} /> : <Check size={14} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message... / မက်ဆေ့ခ်ျရိုက်ပါ..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading || !connected}
              />
              <button 
                type="submit" 
                className="btn-send"
                disabled={loading || !newMessage.trim() || !connected}
                title={loading ? 'Sending...' : !connected ? 'Disconnected' : 'Send message'}
              >
                {loading ? (
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    border: '2px solid white', 
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <MessageCircle size={80} color="#cbd5e1" />
            <h3>Select a chat to start messaging</h3>
            <p>Choose a customer from the list to view and send messages</p>
            <p style={{ fontSize: '13px', marginTop: '8px', color: '#9ca3af' }}>
              စကားပြောရန် ဖောက်သည်တစ်ဦးကို ရွေးချယ်ပါ
            </p>
            {!connected && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px 20px', 
                background: '#fef2f2', 
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                ⚠️ WebSocket disconnected. Reconnecting...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRealtime;
