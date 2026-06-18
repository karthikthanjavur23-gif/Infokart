import React, { useState, useEffect } from 'react';
import { Sparkles, Save, ShieldAlert, Cpu, HeartHandshake, Smile, RefreshCw, Send, HelpCircle, MessageSquare } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const AiAgent = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState({
    bot_name: 'Sparky',
    status: 'ACTIVE',
    ai_mode: 'BALANCED',
    ai_tone: 'FRIENDLY',
    system_prompt: '',
    greeting_message: '',
    model_name: 'gemini-1.5-flash',
    spark_api_key: '',
    spark_agent_id: ''
  });

  // Simulator States
  const [simQuery, setSimQuery] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState([
    { sender: 'bot', content: "Hello! I am your new WhatsApp AI employee. Type a message on the right to test how I respond using your Knowledge Base or Infokart AI configuration!" }
  ]);

  // Load configuration from local API
  const fetchAgentConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-agent`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data && !data.error) {
        setAgent({
          bot_name: data.bot_name || 'Sparky',
          status: data.status || 'ACTIVE',
          ai_mode: data.ai_mode || 'BALANCED',
          ai_tone: data.ai_tone || 'FRIENDLY',
          system_prompt: data.system_prompt || '',
          greeting_message: data.greeting_message || '',
          model_name: data.model_name || 'gemini-1.5-flash',
          spark_api_key: data.spark_api_key || '',
          spark_agent_id: data.spark_agent_id || ''
        });
      }
    } catch (e) {
      console.error("Failed to load AI agent settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentConfig();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-agent/update`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Infokart AI WhatsApp employee configuration saved!");
        if (data.agent) {
          setAgent(data.agent);
        }
      } else {
        alert("Failed to update AI Agent: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Error saving configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Chat Simulator Trigger
  const handleSimSend = async () => {
    if (!simQuery.trim()) return;
    const userMsg = { sender: 'user', content: simQuery };
    setSimMessages(prev => [...prev, userMsg]);
    setSimQuery('');
    setSimLoading(true);

    try {
      // Simulate WhatsApp Webhook trigger endpoint locally using public send loop
      const visitorId = "visitor_sim_session";
      const res = await fetch(`${API_BASE_URL}/api/public/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, content: userMsg.content })
      });
      if (res.ok) {
        // Fetch last messages to retrieve the response
        const messagesRes = await fetch(`${API_BASE_URL}/api/public/messages/${visitorId}`);
        const data = await messagesRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const lastMsg = data[data.length - 1];
          if (lastMsg.sender === 'bot') {
            setSimMessages(prev => [...prev, { sender: 'bot', content: lastMsg.content }]);
          } else {
            // Wait shortly if DB log is async
            setTimeout(async () => {
              const retryRes = await fetch(`${API_BASE_URL}/api/public/messages/${visitorId}`);
              const retryData = await retryRes.json();
              const finalMsg = retryData[retryData.length - 1];
              if (finalMsg && finalMsg.sender === 'bot') {
                setSimMessages(prev => [...prev, { sender: 'bot', content: finalMsg.content }]);
              }
            }, 800);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setSimMessages(prev => [...prev, { sender: 'bot', content: "Failed to query the simulator backend server." }]);
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 font-medium">
        <RefreshCw className="animate-spin text-purple-600 mr-2" size={18} />
        Loading AI agent settings...
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={24} /> AI Agent Employee
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Deploy and manage your permanent WhatsApp AI representative. Train them on Infokart AI or use local files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Configuration Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleUpdate} className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
            
            {/* Header toggle */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Employment Status</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Toggle whether the AI employee responds to WhatsApp customers.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {agent.status === 'ACTIVE' ? 'Working' : 'Paused'}
                </span>
                <select
                  value={agent.status}
                  onChange={e => setAgent({ ...agent, status: e.target.value })}
                  className="w-28 text-xs font-semibold py-1.5 px-3 border border-slate-200 rounded-xl cursor-pointer"
                  style={{ height: '36px', marginTop: 0 }}
                >
                  <option value="ACTIVE">Hire (Active)</option>
                  <option value="INACTIVE">Pause (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Core configuration fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sparky"
                  value={agent.bot_name}
                  onChange={e => setAgent({ ...agent, bot_name: e.target.value })}
                  style={{ height: '40px', marginTop: 0 }}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tone of Voice</label>
                <select
                  value={agent.ai_tone}
                  onChange={e => setAgent({ ...agent, ai_tone: e.target.value })}
                  style={{ height: '40px', marginTop: 0 }}
                >
                  <option value="FRIENDLY">Friendly & Helpful</option>
                  <option value="PROFESSIONAL">Formal & Professional</option>
                  <option value="SALES">Persuasive (Sales-oriented)</option>
                  <option value="SUPPORT">Patient (Support-oriented)</option>
                </select>
              </div>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Instructions & Persona</label>
              <textarea
                rows={4}
                placeholder="e.g. You are a senior support employee at MMR. Always prompt to collect user email if they ask about pricing details..."
                value={agent.system_prompt}
                onChange={e => setAgent({ ...agent, system_prompt: e.target.value })}
                style={{ marginTop: 0, padding: '12px 14px' }}
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Greeting Message (sent on thread start)</label>
              <input
                type="text"
                placeholder="e.g. Hello! I am the Infokart AI assistant. How can I help you today?"
                value={agent.greeting_message}
                onChange={e => setAgent({ ...agent, greeting_message: e.target.value })}
                style={{ height: '40px', marginTop: 0 }}
              />
            </div>

            {/* Infokart AI Chat configuration portal */}
            <div className="bg-purple-50/40 border border-purple-100/50 p-5 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="text-purple-600" size={16} /> Connect to Infokart AI Agent
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Input credentials below to route WhatsApp queries to your external Infokart AI account. Leave blank to use local Knowledge Base.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[#7c3aed] uppercase tracking-wider">Infokart AI API Key</label>
                  <input
                    type="password"
                    placeholder="Enter Infokart AI API Key"
                    value={agent.spark_api_key}
                    onChange={e => setAgent({ ...agent, spark_api_key: e.target.value })}
                    className="border-purple-200 bg-white"
                    style={{ height: '38px', marginTop: 0 }}
                  />
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[#7c3aed] uppercase tracking-wider">Infokart AI Agent ID</label>
                  <input
                    type="text"
                    placeholder="Enter Infokart AI Agent ID"
                    value={agent.spark_agent_id}
                    onChange={e => setAgent({ ...agent, spark_agent_id: e.target.value })}
                    className="border-purple-200 bg-white"
                    style={{ height: '38px', marginTop: 0 }}
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border-none mt-2"
            >
              <Save size={14} /> {saving ? 'Saving Configurations...' : 'Save Agent Configurations'}
            </button>

          </form>
        </div>

        {/* Right Side: Simulator Chat Drawer */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between" style={{ minHeight: '520px' }}>
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Smile size={14} className="text-purple-600" /> AI Employee Sandbox Simulator
              </span>
              <button 
                onClick={() => setSimMessages([simMessages[0]])}
                className="text-[9px] font-bold text-purple-600 hover:underline"
              >
                Clear Chats
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
              {simMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                  style={{ display: 'flex', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold shrink-0 ${
                    msg.sender === 'user' ? 'bg-slate-100 text-slate-700' : 'bg-purple-600 text-white'
                  }`}>
                    {msg.sender === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`text-xs p-3 rounded-2xl leading-normal font-medium ${
                    msg.sender === 'user' ? 'bg-[#7c3aed] text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {simLoading && (
                <div className="flex gap-2 self-start animate-pulse">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">AI</div>
                  <div className="text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 font-medium rounded-tl-none">
                    AI Employee is typing...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 items-center">
            <input
              type="text"
              placeholder="Ask AI employee a question..."
              value={simQuery}
              onChange={e => setSimQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSimSend();
              }}
              className="text-xs bg-slate-50 border-slate-200"
              style={{ height: '38px', marginTop: 0, borderRadius: '12px' }}
            />
            <button
              onClick={handleSimSend}
              disabled={simLoading || !simQuery.trim()}
              className="btn-primary w-10 h-10 shrink-0 p-0 flex items-center justify-center border-none rounded-xl"
              style={{ height: '38px', width: '38px' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiAgent;
