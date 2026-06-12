import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { 
  Users, CheckCircle2, MessageSquare, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Sparkles, Send, Layout, Shield, ExternalLink
} from 'lucide-react';

const AreaChart = () => {
  const points = [
    [0, 80], [40, 60], [80, 75], [120, 40], [160, 55], [200, 20], [240, 35], [280, 10], [320, 25], [360, 5], [400, 15]
  ];
  const pathData = `M 0 100 L ${points.map(p => p.join(' ')).join(' L ')} L 400 100 Z`;
  const lineData = `M ${points.map(p => p.join(' ')).join(' L ')}`;

  return (
    <div className="w-full h-full relative" style={{ minHeight: '220px' }}>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-[180px]">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathData} fill="url(#gradient)" className="animate-fade-in" />
        <path d={lineData} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" className="animate-fade-in" />
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--color-border-soft)" strokeWidth="0.5" strokeDasharray="3 3" />
        ))}
      </svg>
      <div className="flex justify-between items-center mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400 font-medium">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
};

const Sparkline = ({ points, color = '#7c3aed' }) => {
  const width = 60;
  const height = 24;
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - minVal) / range) * height + 1;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height + 2} className="overflow-visible">
      <path
        d={`M ${coords.join(' L ')}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Total Contacts', value: '...', icon: Users, color: '#7c3aed', trend: '+12%', points: [12, 14, 15, 18, 20, 22, 25] },
    { label: 'Delivery Rate', value: '...', icon: CheckCircle2, color: '#10b981', trend: '+0.5%', points: [95, 96, 95.8, 97, 98.1, 98.4, 98.4] },
    { label: 'Chatbot Activity', value: '...', icon: MessageSquare, color: '#7c3aed', trend: '+24%', points: [100, 120, 150, 130, 180, 210, 240] },
    { label: 'Avg. Open Rate', value: '...', icon: TrendingUp, color: '#f59e0b', trend: '+8%', points: [58, 60, 59, 61, 62.4, 63.8, 64.2] },
  ]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data && !data.error) {
          setStats([
            { label: 'Total Contacts', value: data.totalContacts || '0', icon: Users, color: '#7c3aed', trend: '+12%', points: [12, 14, 15, 18, 20, 22, data.totalContacts || 25] },
            { label: 'Delivery Rate', value: '98.4%', icon: CheckCircle2, color: '#10b981', trend: '+0.5%', points: [95, 96, 95.8, 97, 98.1, 98.4, 98.4] },
            { label: 'Chatbot Activity', value: data.botResponses || '0', icon: MessageSquare, color: '#7c3aed', trend: '+24%', points: [100, 120, 150, 130, 180, 210, data.botResponses || 240] },
            { label: 'Avg. Open Rate', value: '64.2%', icon: TrendingUp, color: '#f59e0b', trend: '+8%', points: [58, 60, 59, 61, 62.4, 63.8, 64.2] },
          ]);
        }

        // Fetch recent messages
        const msgRes = await fetch(`${API_BASE_URL}/api/messages/recent`, { headers: getAuthHeaders() });
        const msgData = await msgRes.json();
        if (Array.isArray(msgData)) {
          setRecentMessages(msgData.slice(0, 5));
        }

        // Fetch campaigns for summary
        const campRes = await fetch(`${API_BASE_URL}/api/campaigns`, { headers: getAuthHeaders() });
        const campData = await campRes.json();
        if (Array.isArray(campData)) {
          setActiveCampaigns(campData.slice(0, 3));
        }
      } catch (e) {
        console.error("Dashboard overview query failed:", e);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Overview</h1>
          <p className="text-slate-500 text-xs mt-1">Real-time automation flow metrics and CRM activity logs</p>
        </div>
        <button 
          onClick={() => navigate('/campaigns')}
          className="btn-primary flex items-center gap-2 hover:bg-[#6d28d9] transition"
        >
          <Send size={14} /> New Campaign
        </button>
      </div>

      {/* KPI stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="card bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            style={{ minHeight: '130px' }}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-500 font-semibold">{stat.label}</span>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center" 
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                <stat.icon size={16} />
              </div>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
                <span className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full ${
                  stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.trend}
                </span>
              </div>
              
              {/* Sparkline mini-charts */}
              <div className="pb-1">
                <Sparkline points={stat.points} color={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main dashboard body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Area Chart and Campaigns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Campaign Chart Card */}
          <div className="card bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-900">Campaign Broadcast Performance</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> Inbound Reach
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Outbound Delivery
                </span>
              </div>
            </div>
            <AreaChart />
          </div>

          {/* Top Campaigns List */}
          <div className="card bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Active Campaigns</h3>
            <div className="flex flex-col gap-3">
              {activeCampaigns.map(camp => (
                <div key={camp.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{camp.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Channel: {camp.channel} • Target: {camp.target}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 block">{camp.sent} Sent</span>
                      <span className="text-[9px] text-emerald-500 font-semibold">{Math.round((camp.opened / (camp.sent || 1)) * 100) || 0}% opened</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                      camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic text-xs">No active broadcasts.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Live Feed & AI Insights) */}
        <div className="flex flex-col gap-6">
          
          {/* AI Insights Panel */}
          <div className="card bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-[#7c3aed]" /> AI Advisor Insights
            </h3>
            <div className="flex flex-col gap-3.5 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-white rounded-lg border border-purple-100/60 shadow-sm">
                <p className="font-bold text-[#7c3aed] mb-1">Campaign Optimization</p>
                <p className="text-slate-500 text-[11px]">
                  Template "summer_sale" has a 12% higher read rate on Wednesday morning. Consider shifting schedule.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100/60 shadow-sm">
                <p className="font-bold text-[#7c3aed] mb-1">CRM Lead Alert</p>
                <p className="text-slate-500 text-[11px]">
                  3 new contacts reached "Support Handover" state in the last hour. Verify the Shared Team Inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Live Activity Log */}
          <div className="card bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Realtime Activity</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <div className="flex flex-col gap-4">
                {recentMessages.map((msg, i) => (
                  <div key={msg.id} className="flex gap-3 items-center">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        msg.direction === 'outbound' ? 'bg-purple-50 text-[#7c3aed]' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {msg.direction === 'outbound' ? <Send size={12} /> : <MessageSquare size={12} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{msg.name || msg.phone_number}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{msg.content}</div>
                    </div>
                    <div className="text-[9px] text-slate-400 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {recentMessages.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic text-[11px]">Waiting for conversations...</div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/inbox')}
              className="w-full mt-6 btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-2 border-slate-200"
            >
              Open Team Inbox <ExternalLink size={12} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
