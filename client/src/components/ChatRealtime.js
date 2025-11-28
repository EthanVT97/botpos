import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Phone, Mail, CheckCheck, Check, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';
import { sanitizeHTML } from '../utils/sanitize';
import './ChatModern.css';

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
    // Get the base URL without /api suffix
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    console.log('🔌 Connecting to WebSocket:', baseUrl);
    
    const socket = io(baseUrl, {
      // Try polling first for better stability, then upgrade to WebSocket
      transports: ['polling', 'websocket'],
      // Reconnection settings
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      // Timeout settings
      timeout: 20000,
      // Path for Socket.IO
      path: '/socket.io/',
      // Upgrade settings
      upgrade: true,
      rememberUpgrade: true,
      // Force new connection
      forceNew: false,
      // Auto-connect
      autoConnect: true,
      // Query params for debugging
      query: {
        client: 'chat-realtime',
        timestamp: Date.now()
      },
      // Additional options for production
      withCredentials: true,
      extraHeaders: {
        'X-Client-Type': 'chat'
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('📡 Transport:', socket.io.engine.transport.name);
      console.log('🌐 URL:', baseUrl);
      setConnected(true);
      socket.emit('join:admin');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
      
      // Auto-reconnect on certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        socket.connect();
      }
    });

    // Handle ping from server (heartbeat)
    socket.on('ping', () => {
      console.log('💓 Heartbeat ping received');
      socket.emit('pong');
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      console.error('Error details:', {
        type: error.type,
        description: error.description,
        context: error.context
      });
      setConnected(false);
    });

    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      socket.emit('join:admin');
      // Reload data after reconnection
      loadChatSessions();
      loadUnreadCount();
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
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
  }, []);

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
    if (!newMessage.trim() || !selectedCustomer || loading || !connected) return;

    setLoading(true);
    try {
      const response = await api.post('/chat/send', {
        customerId: selectedCustomer.id,
        message: newMessage
      });

      if (response.data.success) {
        setNewMessage('');
        // Message will be added via Socket.IO event
        await loadMessages(selectedCustomer.id);
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error || error.message || 'Failed to send message');
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
          <h3>
            <MessageCircle size={20} />
            Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </h3>
          <div className="connection-status">
            {connected ? (
              <Wifi size={16} className="text-success" title="Connected" />
            ) : (
              <WifiOff size={16} className="text-danger" title="Disconnected" />
            )}
          </div>
        </div>
        
        {sessions.length > 0 && (
          <div className="chat-search">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        
        <div className="chat-sessions">
          {filteredSessions.length === 0 ? (
            <div className="chat-empty-state" style={{ padding: '40px 20px' }}>
              <Users size={48} />
              <p style={{ marginTop: '12px' }}>
                {searchQuery ? 'No chats found' : 'No active chats'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`chat-session ${selectedCustomer?.id === session.customers.id ? 'active' : ''}`}
                onClick={() => handleSelectCustomer(session)}
              >
                <div className="session-avatar">
                  {session.customers.name.charAt(0).toUpperCase()}
                </div>
                <div className="session-info">
                  <div className="session-name">
                    {session.customers.name}
                    {getChannelBadge(session.channel)}
                  </div>
                  <div className="session-channel">
                    {formatTime(session.last_message_at)}
                  </div>
                </div>
                {session.unread_count > 0 && (
                  <div className="session-unread">{session.unread_count}</div>
                )}
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
                <div className="session-avatar">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{selectedCustomer.name}</h4>
                  <div className="chat-header-details">
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
                  className={`chat-message ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHTML(msg.message, {
                          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
                          ALLOWED_ATTR: []
                        })
                      }}
                    />
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                      {msg.sender_type === 'admin' && (
                        msg.is_read ? <CheckCheck size={16} /> : <Check size={16} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <form className="chat-input" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
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
                    <div className="loading-spinner" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
            </div>
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
