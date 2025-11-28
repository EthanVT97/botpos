import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, X, Users, Phone, Mail, CheckCheck, Check,
  Wifi, WifiOff, Paperclip, Search, Tag, FileText, Download,
  Plus, Trash2, MessageSquare, Clock, Image, File, Smile
} from 'lucide-react';
import io from 'socket.io-client';
import { sanitizeHTML } from '../utils/sanitize';
import './ChatModern.css';

const ChatEnhanced = ({ api }) => {
  // State management
  const [sessions, setSessions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingCustomers, setTypingCustomers] = useState(new Set());
  
  // New features state
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [tags, setTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    console.log('🔌 Connecting to WebSocket:', baseUrl);
    
    const socket = io(baseUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      path: '/socket.io/',
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false,
      autoConnect: true,
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      socket.emit('join:admin');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('chat:new-message', (message) => {
      if (selectedCustomer && message.customer_id === selectedCustomer.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      fetchSessions();
    });

    socket.on('chat:typing', ({ customerId, isTyping }) => {
      setTypingCustomers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(customerId);
        } else {
          newSet.delete(customerId);
        }
        return newSet;
      });
    });

    socket.on('chat:messages-read', ({ customerId }) => {
      if (selectedCustomer && customerId === selectedCustomer.id) {
        setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
      }
    });

    socket.on('chat:unread-count', ({ total }) => {
      setUnreadCount(total);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCustomer]);

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
    fetchTemplates();
    fetchTags();
  }, []);

  // Fetch messages when customer selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.id);
      fetchNotes(selectedCustomer.id);
      markAsRead(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setSessions(response.data.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMessages = async (customerId, search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/chat/messages/${customerId}?search=${encodeURIComponent(search)}`
        : `/chat/messages/${customerId}`;
      const response = await api.get(url);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/chat/templates');
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchNotes = async (customerId) => {
    try {
      const response = await api.get(`/chat/notes/${customerId}`);
      setNotes(response.data.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/chat/tags');
      setTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    if (loading || uploading) return;

    try {
      setLoading(true);
      
      if (selectedFile) {
        await sendMessageWithAttachment();
      } else {
        const response = await api.post('/chat/send', {
          customerId: selectedCustomer.id,
          message: newMessage
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to send message');
        }
      }
      
      setNewMessage('');
      setSelectedFile(null);
      await fetchMessages(selectedCustomer.id);
      await fetchSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error || error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendMessageWithAttachment = async () => {
    setUploading(true);
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.error || 'Failed to upload file');
      }
      
      const fileData = uploadResponse.data.data;
      
      // Send message with attachment
      const response = await api.post('/chat/send-with-attachment', {
        customerId: selectedCustomer.id,
        message: newMessage || 'Sent an attachment',
        attachmentUrl: fileData.url,
        attachmentType: fileData.type,
        attachmentName: fileData.name,
        attachmentSize: fileData.size
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error; // Re-throw to be caught by sendMessage
    } finally {
      setUploading(false);
    }
  };

  const markAsRead = async (customerId) => {
    try {
      await api.post(`/chat/mark-read/${customerId}`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleTyping = () => {
    if (!selectedCustomer) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    api.post(`/chat/typing/${selectedCustomer.id}`, { isTyping: true });
    
    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      api.post(`/chat/typing/${selectedCustomer.id}`, { isTyping: false });
    }, 3000);
  };

  const applyTemplate = async (template) => {
    setNewMessage(template.content);
    setShowTemplates(false);
    
    // Increment usage count
    await api.post(`/chat/templates/${template.id}/use`);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await api.post('/chat/notes', {
        customerId: selectedCustomer.id,
        note: newNote
      });
      setNewNote('');
      fetchNotes(selectedCustomer.id);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await api.delete(`/chat/notes/${noteId}`);
      fetchNotes(selectedCustomer.id);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const addTagToSession = async (tagId) => {
    try {
      await api.post(`/chat/sessions/${selectedCustomer.id}/tags`, { tagId });
      fetchSessions();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTagFromSession = async (tagId) => {
    try {
      await api.delete(`/chat/sessions/${selectedCustomer.id}/tags/${tagId}`);
      fetchSessions();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const exportConversation = async (format = 'xlsx') => {
    try {
      const response = await api.get(`/chat/export/${selectedCustomer.id}?format=${format}`, {
        responseType: format === 'xlsx' ? 'blob' : 'json'
      });
      
      if (format === 'xlsx') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `chat-${selectedCustomer.customers.name}-${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        console.log('Exported data:', response.data);
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  };

  const searchMessages = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/chat/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.customers?.phone?.includes(searchQuery)
  );

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
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

        <div className="chat-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-sessions">
          {filteredSessions.length === 0 ? (
            <div className="chat-empty-state" style={{ padding: '40px 20px' }}>
              <Users size={48} />
              <p style={{ marginTop: '12px' }}>No conversations yet</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.customer_id}
                className={`chat-session ${selectedCustomer?.id === session.customer_id ? 'active' : ''}`}
                onClick={() => setSelectedCustomer({ id: session.customer_id, ...session })}
              >
                <div className="session-avatar">
                  {session.customers?.name?.charAt(0).toUpperCase() || <Users size={20} />}
                </div>
                <div className="session-info">
                  <div className="session-name">
                    {session.customers?.name || 'Unknown'}
                    {typingCustomers.has(session.customer_id) && (
                      <span className="typing-indicator">typing...</span>
                    )}
                  </div>
                  <div className="session-channel">{session.channel}</div>
                  {session.tags && session.tags.length > 0 && (
                    <div className="session-tags">
                      {session.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="tag-badge"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {session.unread_count > 0 && (
                  <div className="session-unread">{session.unread_count}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedCustomer ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <h4>{selectedCustomer.customers?.name || 'Unknown'}</h4>
                <div className="chat-header-details">
                  {selectedCustomer.customers?.phone && (
                    <span><Phone size={14} /> {selectedCustomer.customers.phone}</span>
                  )}
                  {selectedCustomer.customers?.email && (
                    <span><Mail size={14} /> {selectedCustomer.customers.email}</span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                <button
                  className="btn-icon"
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search in conversation"
                >
                  <Search size={18} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setShowNotes(!showNotes)}
                  title="Customer notes"
                >
                  <FileText size={18} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setShowTags(!showTags)}
                  title="Manage tags"
                >
                  <Tag size={18} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => exportConversation('xlsx')}
                  title="Export conversation"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="chat-search-bar">
                <input
                  type="text"
                  placeholder="Search in messages..."
                  value={messageSearch}
                  onChange={(e) => {
                    setMessageSearch(e.target.value);
                    fetchMessages(selectedCustomer.id, e.target.value);
                  }}
                />
              </div>
            )}

            {/* Notes Panel */}
            {showNotes && (
              <div className="chat-notes-panel">
                <h5>Customer Notes</h5>
                <div className="notes-list">
                  {notes.map(note => (
                    <div key={note.id} className="note-item">
                      <p>{note.note}</p>
                      <div className="note-meta">
                        <small>{new Date(note.created_at).toLocaleString()}</small>
                        <button onClick={() => deleteNote(note.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="note-input">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  />
                  <button onClick={addNote}><Plus size={16} /></button>
                </div>
              </div>
            )}

            {/* Tags Panel */}
            {showTags && (
              <div className="chat-tags-panel">
                <h5>Conversation Tags</h5>
                <div className="tags-list">
                  {tags.map(tag => {
                    const isSelected = selectedCustomer.tags?.some(t => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        className={`tag-button ${isSelected ? 'selected' : ''}`}
                        style={{ borderColor: tag.color }}
                        onClick={() => isSelected ? removeTagFromSession(tag.id) : addTagToSession(tag.id)}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="chat-messages">
              {loading ? (
                <div className="chat-loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <MessageCircle size={48} />
                  <p style={{ marginTop: '12px' }}>No messages yet</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <div
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(msg.message) }}
                      />
                      {msg.attachment_url && (
                        <div className="message-attachment">
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                            {msg.attachment_type?.startsWith('image/') ? (
                              <><Image size={14} /> {msg.attachment_name}</>
                            ) : (
                              <><File size={14} /> {msg.attachment_name}</>
                            )}
                          </a>
                        </div>
                      )}
                      <div className="message-meta">
                        <span className="message-time">
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {msg.sender_type === 'admin' && (
                          msg.is_read ? <CheckCheck size={16} /> : <Check size={16} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              {selectedFile && (
                <div className="selected-file">
                  <Paperclip size={14} />
                  <span>{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {/* Templates Dropdown */}
              {showTemplates && templates.length > 0 && (
                <div className="templates-dropdown">
                  <h5>Quick Replies</h5>
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="template-item"
                      onClick={() => applyTemplate(template)}
                    >
                      <strong>{template.name}</strong>
                      <p>{template.content}</p>
                      {template.shortcut && <span className="shortcut">{template.shortcut}</span>}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="chat-input">
                <button
                  className="btn-icon"
                  onClick={() => setShowTemplates(!showTemplates)}
                  title="Quick replies"
                >
                  <MessageSquare size={20} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  disabled={uploading}
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  disabled={uploading || loading}
                />
                <button
                  className="btn-send"
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || uploading || loading}
                  title={uploading ? 'Uploading...' : loading ? 'Sending...' : 'Send message'}
                >
                  {uploading || loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <MessageCircle size={64} />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatEnhanced;
