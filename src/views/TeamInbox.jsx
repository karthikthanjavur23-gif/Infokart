import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Sparkles, Loader2, Search, Filter, MoreVertical, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const TeamInbox = () => {
  const [inbox, setInbox] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);

  // Fetch all inbox threads
  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox`);
      const data = await res.json();
      setInbox(data);
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch thread messages
  const fetchMessages = async (phone) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${phone}`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.phone_number);
      const interval = setInterval(() => fetchMessages(selectedContact.phone_number), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestReply = async () => {
    if (!selectedContact) return;
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: selectedContact.phone_number })
      });
      const data = await res.json();
      setReplyText(data.response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selectedContact) return;
    try {
      await fetch(`${API_BASE_URL}/api/messages/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedContact.phone_number, message: replyText })
      });
      setReplyText('');
      fetchMessages(selectedContact.phone_number);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInbox = inbox.filter(t => t.phone_number.includes(searchQuery));

  return (
    <div className="flex animate-fade-in" style={{ height: 'calc(100vh - var(--header-height) - 64px)', gap: '24px' }}>
      
      {/* Sidebar Threads */}
      <div className="card flex flex-col" style={{ width: '360px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-soft)' }}>
          <div className="flex justify-between items-center mb-6">
            <h2>Shared Inbox</h2>
            <button className="text-muted"><Filter size={18} /></button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', margin: 0, borderRadius: '12px' }}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
          {filteredInbox.map((thread, index) => (
            <div 
              key={`${thread.phone_number}-${index}`} 
              onClick={() => setSelectedContact(thread)}
              style={{ 
                padding: '14px', 
                borderRadius: '14px', 
                cursor: 'pointer',
                backgroundColor: selectedContact?.phone_number === thread.phone_number ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                gap: '12px',
                marginBottom: '4px'
              }}
              onMouseEnter={(e) => { if (selectedContact?.phone_number !== thread.phone_number) e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)'; }}
              onMouseLeave={(e) => { if (selectedContact?.phone_number !== thread.phone_number) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                {thread.phone_number.slice(-1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold" style={{ fontSize: '15px' }}>{thread.phone_number}</div>
                  <div className="text-xs text-muted">2m</div>
                </div>
                <div className="text-muted text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {thread.sender === 'user' ? '' : 'You: '} {thread.content}
                </div>
              </div>
            </div>
          ))}
          {filteredInbox.length === 0 && ( searchQuery ? <div className="text-muted text-center mt-8">No results found</div> : <div className="text-muted text-center mt-8 p-4">Select a channel to view incoming messages</div> )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card flex flex-1 flex-col" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {selectedContact ? (
          <>
            <div className="glass" style={{ padding: '18px 28px', borderBottom: '1px solid var(--color-border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {selectedContact.phone_number.slice(-1)}
                </div>
                <div>
                  <div className="font-bold" style={{ fontSize: '16px' }}>{selectedContact.phone_number}</div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                    <span className="text-xs text-muted font-medium">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" style={{ padding: '10px', borderRadius: '12px' }}><Phone size={18} /></button>
                <button className="btn-secondary" style={{ padding: '10px', borderRadius: '12px' }}><MoreVertical size={18} /></button>
              </div>
            </div>
            
            {/* Messages */}
            <div style={{ flex: 1, padding: '32px', backgroundColor: '#fcfdfe', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg) => {
                const isMine = msg.direction === 'outbound';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }} className="animate-slide-up">
                    <div style={{ 
                      maxWidth: '65%', 
                      padding: '14px 18px', 
                      borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                      backgroundColor: isMine ? 'var(--color-primary)' : 'white',
                      color: isMine ? 'white' : 'var(--color-text-main)',
                      boxShadow: isMine ? '0 10px 15px -3px rgba(0, 191, 165, 0.2)' : 'var(--shadow-sm)',
                      border: isMine ? 'none' : '1px solid var(--color-border-soft)'
                    }}>
                      <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{msg.content}</div>
                      <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.7, textAlign: 'right' }}>
                        12:45 PM
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--color-border-soft)', backgroundColor: 'white' }}>
              <div className="flex gap-4 items-center scale-up">
                <button 
                  className="btn-secondary flex items-center justify-center" 
                  onClick={handleSuggestReply} 
                  disabled={isSuggesting}
                  style={{ borderRadius: '14px', width: '52px', height: '52px', padding: 0, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', border: 'none' }}
                >
                  {isSuggesting ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                   <input 
                    type="text" 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Type a message to ${selectedContact.phone_number}...`} 
                    style={{ flex: 1, height: '52px', padding: '0 24px', borderRadius: '16px', border: '1px solid var(--color-border)', outline: 'none', margin: 0 }}
                  />
                </div>
                <button 
                  className="btn-primary flex items-center justify-center" 
                  onClick={handleSend} 
                  style={{ borderRadius: '14px', width: '52px', height: '52px', padding: 0 }}
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ padding: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <MessageCircle size={48} />
            </div>
            <div className="text-muted font-semibold">Select a conversation to start messaging</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamInbox;

