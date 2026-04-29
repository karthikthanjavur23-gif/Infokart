import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, LayoutTemplate, Workflow, Settings, MessageCircle, Send, X } from 'lucide-react';
import { sendWhatsAppMessage } from '../api/whatsapp';
import { API_BASE_URL } from '../api/config';

const WhatsAppChatbot = () => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [greetingEnabled, setGreetingEnabled] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState({ success: false, message: '' });
  
  // New: Bot Options state
  const [botOptions, setBotOptions] = useState([
    { keyword: 'CATALOG', reply: 'Hi there! Here is our latest product catalog. What category are you interested in?' },
    { keyword: 'HOURS', reply: 'We are open Mon-Fri, 9 AM to 6 PM. How can we help you today?' }
  ]);
  const [newOption, setNewOption] = useState({ keyword: '', reply: '' });

  useEffect(() => {
    // Fetch configs
    fetch(`${API_BASE_URL}/api/bot/config/whatsapp`)
      .then(r => r.json())
      .then(data => {
        setAutoReplyEnabled(!!data.autoReplyEnabled);
        setGreetingEnabled(!!data.greetingEnabled);
      })
      .catch(console.error);

    // Fetch bot options
    fetch(`${API_BASE_URL}/api/bot/options/whatsapp`)
      .then(r => r.json())
      .then(data => setBotOptions(data))
      .catch(console.error);
  }, []);

  const handleSaveOptions = async (updatedOptions) => {
    try {
      await fetch(`${API_BASE_URL}/api/bot/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp', options: updatedOptions })
      });
    } catch (e) {
      console.error("Failed to save bot options", e);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/bot/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp', key: 'autoReplyEnabled', value: autoReplyEnabled })
      });
      await fetch(`${API_BASE_URL}/api/bot/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp', key: 'greetingEnabled', value: greetingEnabled })
      });
      alert('Saved Successfully!');
    } catch (e) { console.error(e); }
  };


  const handleTestSend = async () => {
    if (!testNumber) {
      setSendResult({ success: false, message: 'Please enter a phone number' });
      return;
    }
    setIsSending(true);
    setSendResult({ success: false, message: '' });
    
    try {
      // Find matching bot option
      const matchingOption = botOptions.find(opt => testNumber.toUpperCase().includes(opt.keyword));
      const messageToSend = matchingOption ? matchingOption.reply : "Hi there! Welcome to InfoKart. Type 'CATALOG' to see our products.";
      
      await sendWhatsAppMessage(testNumber, messageToSend);
      setSendResult({ success: true, message: `Bot replied with: "${messageToSend}"` });
    } catch (error) {
      setSendResult({ success: false, message: error.message || 'Failed to send' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-2"><MessageCircle size={28} style={{ color: '#25D366' }} /> WhatsApp Chatbot Automation</h1>
        <button className="btn-primary" style={{ backgroundColor: '#25D366' }} onClick={handleSave}>Save Changes</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '40px' }}>
        
        {/* Settings Panel */}
        <div className="flex flex-col gap-10">
          <div className="card">
            <h3 className="mb-8 flex items-center gap-3 font-black"><Settings size={22} className="text-primary" /> Core Automation</h3>
            
            <div className="flex justify-between items-center mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
              <div>
                <div className="font-bold text-main">Auto-Reply Logic</div>
                <p className="text-muted text-[11px] mt-1 leading-relaxed">Respond immediately to first-time customer messages.</p>
              </div>
              <div style={{ cursor: 'pointer', transition: 'transform 0.2s' }} className="hover:scale-110" onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}>
                {autoReplyEnabled ? <ToggleRight size={40} className="text-success" /> : <ToggleLeft size={40} className="text-muted" />}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-main">Session Greeting</div>
                <p className="text-muted text-[11px] mt-1 leading-relaxed">Welcome active sessions with a custom greeting.</p>
              </div>
              <div style={{ cursor: 'pointer', transition: 'transform 0.2s' }} className="hover:scale-110" onClick={() => setGreetingEnabled(!greetingEnabled)}>
                {greetingEnabled ? <ToggleRight size={40} className="text-success" /> : <ToggleLeft size={40} className="text-muted" />}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-6 font-black flex items-center gap-2">Live Debugger</h3>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Target Phone Number..." 
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                style={{ fontSize: '14px', padding: '14px 20px' }}
              />
              <button 
                onClick={handleTestSend}
                disabled={isSending}
                className="btn-primary flex justify-center items-center gap-3 py-4 shadow-xl shadow-success/10" 
                style={{ backgroundColor: '#25D366', border: 'none', opacity: isSending ? 0.7 : 1 }}
              >
                {isSending ? 'Simulating...' : 'Send Test Prompt'} <Send size={18} />
              </button>
              {sendResult.message && (
                <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center' }} className={sendResult.success ? 'text-success font-bold bg-success/5 p-3 rounded-xl border border-success/20 animate-fade-in' : 'text-danger font-bold bg-danger/5 p-3 rounded-xl border border-danger/20 animate-fade-in'}>
                  {sendResult.message}
                </div>
              )}
            </div>
          </div>

          <div className="card bg-slate-50/50">
            <h3 className="mb-6 font-black">AI Blueprints</h3>
            <div className="flex flex-col gap-3">
              <button className="btn-secondary flex justify-between items-center px-6 py-4 hover:bg-white transition-all shadow-none hover:shadow-md" style={{ width: '100%', fontSize: '13px' }}>
                <span className="font-bold text-main">Lead Qualification</span>
                <LayoutTemplate size={18} className="text-muted" />
              </button>
              <button className="btn-secondary flex justify-between items-center px-6 py-4 hover:bg-white transition-all shadow-none hover:shadow-md" style={{ width: '100%', fontSize: '13px' }}>
                <span className="font-bold text-main">Order Tracker Pro</span>
                <LayoutTemplate size={18} className="text-muted" />
              </button>
              <button className="btn-secondary flex justify-between items-center px-6 py-4 hover:bg-white transition-all shadow-none hover:shadow-md" style={{ width: '100%', fontSize: '13px' }}>
                <span className="font-bold text-main">Concierge Support</span>
                <LayoutTemplate size={18} className="text-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Builder Canvas / Bot Option Creator */}
        <div className="flex flex-col gap-10">
          <div className="card shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Workflow size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Conversation Builder</h3>
                <p className="text-muted text-xs">Map custom keywords to automated agent responses</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="form-group">
                <label className="label">Customer Intent / Keyword</label>
                <input 
                  type="text" 
                  placeholder="e.g. PRICING" 
                  value={newOption.keyword}
                  onChange={e => setNewOption({ ...newOption, keyword: e.target.value.toUpperCase() })}
                  style={{ fontSize: '15px', padding: '16px 20px', borderRadius: '16px' }}
                />
              </div>
              <div className="form-group">
                <label className="label">Bot Intelligence Reply</label>
                <textarea 
                  placeholder="What should the bot say back..." 
                  value={newOption.reply}
                  onChange={e => setNewOption({ ...newOption, reply: e.target.value })}
                  rows={4}
                  style={{ fontSize: '15px', padding: '16px 20px', borderRadius: '16px' }}
                />
              </div>
              <button 
                className="btn-primary w-full py-4 text-sm font-black tracking-widest uppercase shadow-xl shadow-primary/20 mt-4" 
                onClick={() => {
                  if (newOption.keyword && newOption.reply) {
                    setBotOptions([...botOptions, newOption]);
                    setNewOption({ keyword: '', reply: '' });
                  }
                }}
                disabled={!newOption.keyword || !newOption.reply}
              >
                Register Interaction Option
              </button>
            </div>
          </div>

          <div className="card bg-slate-50/10 border-dashed border-2">
             <div className="flex items-center justify-between mb-8">
               <h3 className="font-black flex items-center gap-3">Deployment Log <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{botOptions.length}</span></h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-all">Export JSON</button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
               {botOptions.map((opt, i) => (
                 <div key={i} className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all animate-slide-up group">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-widest">{opt.keyword}</span>
                     <button className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/5 opacity-0 group-hover:opacity-100 transition-all" onClick={() => {
                       const updated = botOptions.filter((_, idx) => idx !== i);
                       setBotOptions(updated);
                       handleSaveOptions(updated);
                     }}>
                       <X size={16} />
                     </button>
                   </div>
                   <p className="text-[13px] leading-relaxed text-main font-medium italic">"{opt.reply}"</p>
                 </div>
               ))}
               {botOptions.length === 0 && <div className="text-muted text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200 font-medium text-sm italic">No interaction behaviors established yet.</div>}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppChatbot;
