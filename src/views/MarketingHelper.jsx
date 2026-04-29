import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Copy, ThumbsUp, Save, Megaphone, Trash2, History, Zap, MessageSquare, Plus, Check } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const MarketingHelper = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to InfoKart AI! 👋 I'm your dedicated marketing assistant. I can help you draft high-converting WhatsApp templates, plan entire campaigns, or suggest social media strategies. What are we building today?" }
  ]);
  const [wsStatus, setWsStatus] = useState({ connected: false, details: null });
  const [metaConfig, setMetaConfig] = useState({ appId: '', configId: '' });
  const chatEndRef = useRef(null);

  // Initialize Facebook SDK
  useEffect(() => {
    const initFB = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whatsapp/init-config`);
        const config = await res.json();
        setMetaConfig(config);

        window.fbAsyncInit = function() {
          window.FB.init({
            appId: config.appId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v22.0'
          });
        };

        const loadSDK = (d, s, id) => {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://connect.facebook.net/en_US/sdk.js";
          fjs.parentNode.insertBefore(js, fjs);
        };
        loadSDK(document, 'script', 'facebook-jssdk');
      } catch (e) {
        console.error("Failed to load Meta config");
      }
    };

    initFB();
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
      const data = await res.json();
      setWsStatus(data);
    } catch (e) {
      console.error("Failed to fetch WhatsApp status");
    }
  };

  const handleLaunchSignup = () => {
    if (!window.FB) return alert("Facebook SDK not loaded yet.");
    if (!metaConfig.appId || !metaConfig.configId) {
      return alert("Meta App ID or Configuration ID is missing. Please check your .env file on the server.");
    }
    
    window.FB.login((response) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        completeSignup(code);
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      config_id: metaConfig.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {} }
    });
  };

  const completeSignup = async (code) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/embedded-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect WhatsApp?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsGenerating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops! I encountered an error. Please check your internet connection and try again." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const [copySuccess, setCopySuccess] = useState(null);
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - var(--header-height) - 64px)', gap: '24px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1>AI Marketing Workspace</h1>
          <p className="text-muted mt-1">Supercharge your WhatsApp and Instagram marketing with Gemini AI.</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={() => setMessages([messages[0]])}>
          <Trash2 size={16} /> Reset Chat
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flex: 1, overflow: 'hidden' }}>
        
        {/* Main Chat Area */}
        <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#fcfdfe', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: '20px', 
                marginBottom: '32px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }} className="animate-slide-up">
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: msg.role === 'assistant' ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : 'var(--color-text-main)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.role === 'assistant' ? <Sparkles size={20} /> : <Zap size={20} />}
                </div>
                <div style={{ 
                  flex: 1, 
                  maxWidth: '80%',
                  backgroundColor: msg.role === 'assistant' ? 'white' : 'var(--color-surface-soft)', 
                  padding: '20px 24px', 
                  borderRadius: msg.role === 'assistant' ? '0 24px 24px 24px' : '24px 0 24px 24px', 
                  border: '1px solid var(--color-border-soft)', 
                  boxShadow: msg.role === 'assistant' ? 'var(--shadow-md)' : 'none', 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.7',
                  color: 'var(--color-text-main)',
                  fontSize: '15px'
                }}>
                  {msg.content}
                  
                  {msg.role === 'assistant' && idx !== 0 && (
                    <div className="mt-6 flex flex-wrap gap-3" style={{ borderTop: '1px solid var(--color-border-soft)', paddingTop: '16px' }}>
                      <button className="btn-secondary flex items-baseline gap-2 py-1 px-3 text-xs font-bold" onClick={() => copyToClipboard(msg.content, idx)}>
                        {copySuccess === idx ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />} 
                        {copySuccess === idx ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="btn-secondary flex items-baseline gap-2 py-1 px-3 text-xs font-bold"><Save size={14} /> Template</button>
                      <button className="btn-primary flex items-baseline gap-2 py-1 px-3 text-xs font-bold" style={{ border: 'none' }}><Megaphone size={14} /> Campaign</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }} className="animate-pulse">
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div style={{ backgroundColor: 'white', padding: '16px 24px', borderRadius: '0 24px 24px 24px', border: '1px solid var(--color-border-soft)', boxShadow: 'var(--shadow-md)', color: 'var(--color-text-muted)', fontSize: '15px' }}>
                  Analyzing your request and crafting magic...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--color-border-soft)', backgroundColor: 'white' }}>
            <div className="flex gap-4 items-end">
              <div className="flex-1" style={{ position: 'relative' }}>
                <textarea 
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. Write a friendly WhatsApp blast for a 20% discount on new Arrivals..." 
                  style={{ width: '100%', resize: 'none', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--color-border)', outline: 'none', margin: 0, minHeight: '64px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
              </div>
              <button 
                className="btn-primary flex items-center justify-center translate-y-[-2px]" 
                style={{ width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0 }} 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Connection Status Card */}
          <div className="card" style={{ 
            padding: '24px', 
            background: wsStatus.connected ? 'linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)' : 'white',
            border: wsStatus.connected ? '1px solid #c6f6d5' : '1px solid var(--color-border-soft)'
          }}>
            <h3 className="flex items-center gap-3 mb-4">
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: wsStatus.connected ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-soft)', color: wsStatus.connected ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                 <MessageSquare size={18} />
              </div>
              Meta Integration
            </h3>
            
            {wsStatus.connected ? (
              <div className="animate-fade-in">
                <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-success)' }}>VERIFIED ACCOUNT</div>
                <div className="font-bold text-lg mb-1">{wsStatus.details?.display_phone_number}</div>
                <div className="text-muted text-xs mb-6">Status: <span className="font-bold text-success">Live (v22.0)</span></div>
                <button 
                  className="btn-secondary w-full py-2 text-sm font-bold" 
                  style={{ color: 'var(--color-danger)', borderColor: '#fed7d7' }}
                  onClick={handleDisconnect}
                >
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div>
                <p className="text-muted mb-6 text-sm">Connect your Meta Business Account to automate campaigns & replies.</p>
                <button 
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3" 
                  style={{ backgroundColor: '#1877f2' }}
                  onClick={handleLaunchSignup}
                >
                  <Plus size={18} /> Connect Facebook
                </button>
              </div>
            )}
          </div>

          <div className="card flex-1">
            <h3 className="flex items-center gap-3 mb-6">
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                <Zap size={18} />
              </div>
              Power Prompts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { title: "Abandoned Cart", prompt: "Friendly reminder with 10% discount for carts left >24h." },
                { title: "Product Launch", prompt: "Exciting emoji-rich announcement for a premium water bottle." },
                { title: "Review Request", prompt: "Polite review request on Google Maps with a direct link." }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setPrompt(item.prompt)}
                  className="flex flex-col gap-1 p-3 border rounded-xl hover:border-primary hover:bg-primary-light cursor-pointer transition-all border-slate-100"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div className="font-bold text-sm">{item.title}</div>
                  <div className="text-muted text-xs truncate">{item.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MarketingHelper;

