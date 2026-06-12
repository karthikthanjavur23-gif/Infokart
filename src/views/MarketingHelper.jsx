import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Copy, ThumbsUp, Save, Megaphone, Trash2, History, Zap, MessageSquare, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const MarketingHelper = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to InfoKart AI Workspace! ⚡ I'm your enterprise intelligence assistant. I can draft high-converting templates, build automation chatbot pathways, analyze customer list churn metrics, or design complete marketing plans. What objective are we targeting?" }
  ]);
  const [wsStatus, setWsStatus] = useState({ connected: false, details: null });
  const [metaConfig, setMetaConfig] = useState({ appId: '', configId: '' });
  const chatEndRef = useRef(null);

  // Initialize Facebook SDK
  useEffect(() => {
    const initFB = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whatsapp/init-config`, { headers: getAuthHeaders() });
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
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`, { headers: getAuthHeaders() });
      const data = await res.json();
      setWsStatus(data);
    } catch (e) {
      console.error("Failed to fetch WhatsApp status");
    }
  };

  const handleLaunchSignup = () => {
    if (!metaConfig.appId || !metaConfig.configId) {
      return alert("Meta App ID or Configuration ID is missing. Please check your .env file on the server.");
    }
    
    const redirectUri = window.location.origin + "/settings";
    
    const extras = encodeURIComponent(JSON.stringify({
      version: "v4",
      sessionInfoVersion: "3",
      featureType: "whatsapp_business_app_onboarding"
    }));

    const signupUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${metaConfig.appId}&config_id=${metaConfig.configId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=whatsapp_business_management,whatsapp_business_messaging&extras=${extras}`;

    window.location.href = signupUrl;
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect WhatsApp?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
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
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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

  const handleSaveAsTemplate = async (content) => {
    const name = window.prompt("Enter a name for this template:");
    if (!name) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, category: 'Marketing' })
      });
      if (res.ok) alert("Template saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save template.");
    }
  };

  const workspaceSuggestions = [
    { label: "Find Sales Opportunities", query: "Analyze my CRM contacts and identify the top 5 sales opportunities based on activity logs." },
    { label: "Predict Churn", query: "Highlight contacts showing warning signs of churning, and draft a WhatsApp win-back template." },
    { label: "Create Marketing Plan", query: "Design a comprehensive customer engagement plan for the next quarter utilizing both WhatsApp and Instagram." },
    { label: "Create Bot Flow", query: "Outline visual node coordinates for a customer service chatbot with support handoff actions." }
  ];

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - var(--header-height) - 64px)', gap: '24px' }}>
      
      {/* Title Segment */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Workspace</h1>
          <p className="text-slate-500 text-xs mt-1">Supercharge your WhatsApp and Instagram marketing campaigns with Gemini AI</p>
        </div>
        <button 
          className="btn-secondary flex items-center gap-2 hover:bg-slate-50 border-slate-200" 
          onClick={() => setMessages([messages[0]])}
          style={{ height: '38px', borderRadius: '12px', padding: '0 16px' }}
        >
          <Trash2 size={14} /> Reset Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 flex-1 overflow-hidden">
        
        {/* Main ChatGPT layout card */}
        <div className="card flex flex-col bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden p-0" style={{ height: '100%' }}>
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }} className="custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '24px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }} className="animate-slide-up">
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '12px', 
                  background: msg.role === 'assistant' ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : '#ffffff', 
                  color: msg.role === 'assistant' ? 'white' : 'var(--color-primary)', 
                  border: msg.role === 'assistant' ? 'none' : '1px solid var(--color-border)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.role === 'assistant' ? <Sparkles size={16} /> : <Users size={16} />}
                </div>
                <div style={{ 
                  flex: 1, 
                  maxWidth: '75%',
                  backgroundColor: msg.role === 'assistant' ? '#ffffff' : 'var(--color-primary)', 
                  padding: '16px 20px', 
                  borderRadius: msg.role === 'assistant' ? '0 20px 20px 20px' : '20px 0 20px 20px', 
                  border: '1px solid',
                  borderColor: msg.role === 'assistant' ? 'var(--color-border)' : 'transparent', 
                  boxShadow: 'var(--shadow-sm)', 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.6',
                  color: msg.role === 'assistant' ? 'var(--color-text-main)' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  {msg.content}
                  
                  {msg.role === 'assistant' && idx !== 0 && (
                    <div className="mt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                      <button className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold" style={{ height: '32px', borderRadius: '10px' }} onClick={() => copyToClipboard(msg.content, idx)}>
                        {copySuccess === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} 
                        {copySuccess === idx ? 'Copied!' : 'Copy'}
                      </button>
                      <button className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold" style={{ height: '32px', borderRadius: '10px' }} onClick={() => handleSaveAsTemplate(msg.content)}><Save size={12} /> Save Template</button>
                      <button className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold border-none" style={{ height: '32px', borderRadius: '10px' }} onClick={() => navigate('/campaigns/create')}><Megaphone size={12} /> Launch Campaign</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }} className="animate-pulse">
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'white', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
                  <Sparkles size={16} />
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border)', padding: '16px 20px', borderRadius: '0 20px 20px 20px', boxShadow: 'var(--shadow-sm)', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500 }}>
                  Analyzing workspace datasets and drafting response...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ChatGPT/Vercel-style Interactive Composer Input */}
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border)', backgroundColor: 'white' }}>
            {/* Quick Suggestions Row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {workspaceSuggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(item.query)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50 text-[10px] font-bold text-slate-500 hover:text-purple-600 rounded-lg transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1" style={{ position: 'relative' }}>
                <textarea 
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Gemini to draft marketing strategies, find customer opportunities, or predict churn..." 
                  style={{ width: '100%', resize: 'none', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--color-border)', outline: 'none', margin: 0, minHeight: '64px', fontSize: '13px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="focus:ring-2 focus:ring-purple-100/50"
                />
              </div>
              <button 
                className="btn-primary flex items-center justify-center translate-y-[-2px] border-none" 
                style={{ width: '60px', height: '60px', borderRadius: '16px', flexShrink: 0 }} 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                <Send size={20} />
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
            border: wsStatus.connected ? '1px solid #c6f6d5' : '1px solid var(--color-border)'
          }}>
            <h3 className="flex items-center gap-3 mb-4 font-bold text-sm text-slate-800">
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: wsStatus.connected ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-soft)', color: wsStatus.connected ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                 <MessageSquare size={16} />
              </div>
              Meta Integration
            </h3>
            
            {wsStatus.connected ? (
              <div className="animate-fade-in">
                <div className="text-[9px] font-extrabold mb-1" style={{ color: 'var(--color-success)' }}>VERIFIED WABA ACCOUNT</div>
                <div className="font-bold text-base mb-1">{wsStatus.details?.display_phone_number}</div>
                <div className="text-muted text-[11px] mb-6 font-semibold">Status: <span className="font-bold text-emerald-500">Live (v22.0)</span></div>
                <button 
                  className="btn-secondary w-full py-2 text-xs font-bold" 
                  style={{ color: 'var(--color-danger)', borderColor: '#fed7d7', height: '38px', borderRadius: '12px' }}
                  onClick={handleDisconnect}
                >
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 mb-6 text-xs leading-relaxed font-semibold">Connect your WABA business phone line to activate broadcasts and AI-chatbot configurations.</p>
                <button 
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs border-none" 
                  style={{ backgroundColor: '#1877f2', height: '40px', borderRadius: '12px' }}
                  onClick={handleLaunchSignup}
                >
                  <Plus size={16} /> Connect Facebook
                </button>
              </div>
            )}
          </div>

          <div className="card flex-1 flex flex-col bg-white border border-slate-100 rounded-[24px]">
            <h3 className="flex items-center gap-3 mb-5 font-bold text-sm text-slate-800">
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                <Zap size={16} />
              </div>
              Power Prompts
            </h3>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ flex: 1 }}>
              {[
                { title: "Abandoned Cart Reminder", prompt: "Friendly reminder with 10% discount for carts left >24h." },
                { title: "Product Launch Announce", prompt: "Exciting emoji-rich announcement for a premium water bottle launch." },
                { title: "Review Request Trigger", prompt: "Polite review request on Google Maps with a direct click link." }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setPrompt(item.prompt)}
                  className="flex flex-col gap-1 p-3.5 border rounded-xl hover:border-purple-200 hover:bg-purple-50/20 cursor-pointer transition-all border-slate-50 bg-slate-50/50"
                >
                  <div className="font-bold text-xs text-slate-800">{item.title}</div>
                  <div className="text-slate-400 text-[10px] font-semibold truncate">{item.prompt}</div>
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
