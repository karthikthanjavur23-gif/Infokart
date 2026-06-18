import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, AlertCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalConversations: 0,
    botResolved: 0,
    humanEscalated: 0,
    aiResponses: 0,
    resolutionRate: 0
  });

  const [metricsTimeline, setMetricsTimeline] = useState([
    { label: 'Mon', inbound: 42, outbound: 38 },
    { label: 'Tue', inbound: 55, outbound: 48 },
    { label: 'Wed', inbound: 68, outbound: 62 },
    { label: 'Thu', inbound: 80, outbound: 74 },
    { label: 'Fri', inbound: 95, outbound: 89 },
    { label: 'Sat', inbound: 45, outbound: 40 },
    { label: 'Sun', inbound: 38, outbound: 35 }
  ]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-agent/analytics`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 font-medium">
        <RefreshCw className="animate-spin text-purple-600 mr-2" size={18} />
        Loading AI Agent Analytics...
      </div>
    );
  }

  // Calculate coordinates for a custom SVG Area/Line Chart for premium look
  const maxVal = 100;
  const height = 140;
  const width = 600;
  const padding = 20;

  const pointsInbound = metricsTimeline.map((item, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (metricsTimeline.length - 1);
    const y = height - padding - (item.inbound / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pointsOutbound = metricsTimeline.map((item, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (metricsTimeline.length - 1);
    const y = height - padding - (item.outbound / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-purple-600" size={24} /> AI Agent Analytics
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Monitor your WhatsApp AI Agent resolution rate, messages, and escalation efficiency.
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: AI Resolution Rate */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ShieldCheck className="text-purple-600" size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+4.2%</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Resolution Rate</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{data.resolutionRate}%</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Percentage of chats resolved without human handover.</p>
          </div>
        </div>

        {/* Card 2: Total Chats Managed */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MessageSquare className="text-blue-600" size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Conversations</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{data.totalConversations}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Total chat sessions initiated on your connected channels.</p>
          </div>
        </div>

        {/* Card 3: AI Output Responses */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <TrendingUp className="text-indigo-600" size={20} />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">AI replies</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Agent Messages</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{data.aiResponses}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Total responses formulated and sent by the Infokart AI engine.</p>
          </div>
        </div>

        {/* Card 4: Human Escalations */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 rounded-xl">
              <AlertCircle className="text-amber-600" size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Handover</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Human Handovers</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{data.humanEscalated}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Conversations where the AI was paused for human takeover.</p>
          </div>
        </div>
      </div>

      {/* Analytics Graph & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Line Chart */}
        <div className="lg:col-span-2 card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Message Volume (Last 7 Days)</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Compares total inbound queries against automated AI outbound responses.</p>
          </div>

          {/* SVG Line Chart */}
          <div className="my-6">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />

              {/* Area background (Inbound) */}
              <polygon
                points={`${padding},${height - padding} ${pointsInbound} ${width - padding},${height - padding}`}
                fill="url(#gradInbound)"
                opacity="0.1"
              />

              {/* Line paths */}
              <polyline fill="none" stroke="#a78bfa" strokeWidth="3" points={pointsInbound} strokeLinecap="round" strokeLinejoin="round" />
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3" points={pointsOutbound} strokeLinecap="round" />

              {/* Dots on points */}
              {metricsTimeline.map((item, idx) => {
                const x = padding + (idx * (width - padding * 2)) / (metricsTimeline.length - 1);
                const y = height - padding - (item.inbound / maxVal) * (height - padding * 2);
                return (
                  <circle key={`in-${idx}`} cx={x} cy={y} r="4" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="gradInbound" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Labels & Legends */}
          <div className="flex justify-between items-center border-t border-slate-50 pt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-[10px] text-slate-500 font-semibold">Inbound Queries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-[10px] text-slate-500 font-semibold">AI Outbound</span>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400">
              {metricsTimeline.map((item, idx) => (
                <span key={idx}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Speed / Performance metrics */}
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Operational Speeds</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Average operational speed telemetry for response engines.</p>
          </div>

          <div className="flex flex-col gap-6 my-4">
            {/* Speed Item 1: Infokart AI API response */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Infokart AI API Latency</span>
                <span className="font-extrabold text-purple-600">820 ms</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>

            {/* Speed Item 2: Local Gemini model */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Gemini 1.5 (Local Fallback)</span>
                <span className="font-extrabold text-blue-600">1.4 s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Speed Item 3: DB Knowledge context retrieval */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">SQLite Context Matcher</span>
                <span className="font-extrabold text-emerald-600">12 ms</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 flex gap-2.5 items-center">
            <Clock className="text-purple-600 shrink-0" size={16} />
            <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Infokart AI routes messages instantly, reducing lead response times by <strong className="text-purple-600">92%</strong> compared to manual handling.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
