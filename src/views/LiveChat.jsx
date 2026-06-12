import React, { useState, useEffect, useRef } from 'react';
import { Send, Laptop, MessageSquare, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const LiveChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const chatEndRef = useRef(null);

  // Initialize a unique visitor ID
  useEffect(() => {
    let id = localStorage.getItem('infokart_livechat_visitor_id');
    if (!id) {
      id = 'visitor_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('infokart_livechat_visitor_id', id);
    }
    setVisitorId(id);
  }, []);

  const fetchMessages = async () => {
    if (!visitorId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/messages/${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to load customer messages", e);
    }
  };

  useEffect(() => {
    if (visitorId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [visitorId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !visitorId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, content: inputText })
      });

      if (res.ok) {
        setInputText('');
        fetchMessages();
      }
    } catch (e) {
      console.error("Failed to send customer message", e);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Widget container */}
      <div style={{
        width: '400px',
        height: '640px',
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header bar */}
        <div style={{
          backgroundColor: '#3b82f6',
          padding: '24px 20px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Laptop size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>InfoKart Support Chat</div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>We typically reply in under an hour</div>
          </div>
        </div>

        {/* Messages Feed */}
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: '#f8fafc',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          
          <div style={{
            alignSelf: 'center',
            backgroundColor: '#e2e8f0',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            color: '#475569',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Live Chat Session Started
          </div>

          {messages.map((msg) => {
            const isMe = msg.direction === 'inbound'; // inbound from widget perspective is me sending
            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 14px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isMe ? '#3b82f6' : 'white',
                  color: isMe ? 'white' : '#1e293b',
                  fontSize: '13.5px',
                  lineHeight: '1.4',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                  border: isMe ? 'none' : '1px solid #e2e8f0'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: 'white',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              height: '40px',
              padding: '0 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              outline: 'none',
              fontSize: '13px',
              margin: 0
            }}
          />
          <button
            onClick={handleSend}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              padding: 0
            }}
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveChat;
