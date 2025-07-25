import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

function Chat({ navigate, selectedPairner }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    if (selectedPairner) {
      setActiveConversation(selectedPairner);
      loadMessages(selectedPairner.id);
    }
  }, [selectedPairner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Mock conversations for now - replace with actual API call
      const mockConversations = [
        { id: 1, name: 'Sari', lastMessage: 'Looking forward to meeting you!', time: '2 hours ago', unread: 2 },
        { id: 2, name: 'Budi', lastMessage: 'Thank you for your interest', time: '1 day ago', unread: 0 },
        { id: 3, name: 'Nia', lastMessage: 'When would be a good time to chat?', time: '2 days ago', unread: 1 }
      ];
      setConversations(mockConversations);
      
      if (!selectedPairner && mockConversations.length > 0) {
        setActiveConversation(mockConversations[0]);
        loadMessages(mockConversations[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (pairnerId) => {
    try {
      // Mock messages for now - replace with actual API call
      const mockMessages = [
        { id: 1, message: 'Hi! I saw your profile and I think you might be a great fit for our family.', sender_type: 'user', created_at: '2024-01-15T10:00:00Z' },
        { id: 2, message: 'Hello! Thank you for reaching out. I would love to learn more about your family and your childcare needs.', sender_type: 'pairner', created_at: '2024-01-15T10:05:00Z' },
        { id: 3, message: 'We have a 6-year-old daughter who loves to draw and play games. Do you have experience with children that age?', sender_type: 'user', created_at: '2024-01-15T10:10:00Z' },
        { id: 4, message: 'Yes! I have lots of experience with children aged 5-8. I also love drawing and often help kids with art projects at the orphanage.', sender_type: 'pairner', created_at: '2024-01-15T10:15:00Z' },
        { id: 5, message: 'That sounds perfect! Would you be available for a video call this week to discuss further?', sender_type: 'user', created_at: '2024-01-15T10:20:00Z' }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const messageData = {
        id: Date.now(),
        message: newMessage,
        sender_type: 'user',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      // Simulate response
      setTimeout(() => {
        const responseMessage = {
          id: Date.now() + 1,
          message: "Thank you for your message! I'll get back to you soon.",
          sender_type: 'pairner',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, responseMessage]);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="chat-container fade-in">
      <div className="chat-main-header">
        <button className="back-button" onClick={() => navigate('home')}>
          ← Back
        </button>
        <h1>Messages</h1>
        <div className="header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('search')}>
            + New Chat
          </button>
        </div>
      </div>

      <div className="chat-layout">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Conversations</h2>
            <div className="conversation-count">{conversations.length} chats</div>
          </div>
          
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <div className="empty-icon">💬</div>
                <p>No conversations yet</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('search')}>
                  Find Au Pairs
                </button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveConversation(conversation);
                    loadMessages(conversation.id);
                  }}
                >
                  <div className="conversation-avatar">
                    <div className="avatar-circle-sm">
                      <span>👤</span>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="unread-badge">{conversation.unread}</div>
                    )}
                  </div>
                  
                  <div className="conversation-content">
                    <div className="conversation-header-row">
                      <h3 className="conversation-name">{conversation.name}</h3>
                      <span className="conversation-time">{conversation.time}</span>
                    </div>
                    <p className="conversation-preview">{conversation.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-area">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-partner-info">
                  <div className="avatar-circle">
                    <span>👤</span>
                  </div>
                  <div className="partner-details">
                    <h3>{activeConversation.name}</h3>
                    <span className="status online">● Online</span>
                  </div>
                </div>
                
                <div className="chat-actions">
                  <button className="action-btn" title="Video call">
                    📹
                  </button>
                  <button className="action-btn" title="Voice call">
                    📞
                  </button>
                  <button className="action-btn" title="More options">
                    ⋯
                  </button>
                </div>
              </div>

              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="date-divider">
                            <span>{formatDate(message.created_at)}</span>
                          </div>
                        )}
                        
                        <div className={`message ${message.sender_type === 'user' ? 'sent' : 'received'}`}>
                          <div className="message-bubble">
                            <p className="message-text">{message.message}</p>
                            <span className="message-time">{formatTime(message.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form className="message-input-form" onSubmit={sendMessage}>
                <div className="input-container">
                  <button type="button" className="attachment-btn" title="Attach file">
                    📎
                  </button>
                  
                  <textarea
                    className="message-input"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    rows="1"
                  />
                  
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? '⏳' : '📤'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="no-chat-illustration">
                <div className="no-chat-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;