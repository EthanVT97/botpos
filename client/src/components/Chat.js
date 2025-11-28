import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Phone, Mail, CheckCheck, Check } from 'lucide-react';
import './ChatModern.css';

const Chat = ({ api }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadChatSessions();
    loadUnreadCount();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadChatSessions();
      loadUnreadCount();
      if (selectedCustomer) {
        loadMessages(selectedCustomer.id);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedCustomer]);

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
        loadChatSessions();
        loadUnreadCount();
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
    if (!newMessage.trim() || !selectedCustomer || loading) return;

    setLoading(true);
    try {
      const response = await api.post('/chat/send', {
        customerId: selectedCustomer.id,
        message: newMessage
      });

      if (response.data.success) {
        setNewMessage('');
        await loadMessages(selectedCustomer.id);
        await loadChatSessions();
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
            <span style={{ fontSize: '12px', color: '#667781' }}>
              {sessions.length} active
            </span>
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
                    <div className="message-text">
                      <p>{msg.message}</p>
                    </div>
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
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="btn-send"
                  disabled={loading || !newMessage.trim()}
                  title={loading ? 'Sending...' : 'Send message'}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
