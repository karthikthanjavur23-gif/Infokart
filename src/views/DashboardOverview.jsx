import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { 
  Users, CheckCircle2, MessageSquare, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Sparkles, Send, Layout, Shield, ExternalLink, Calendar, MessageCircle
} from 'lucide-react';

const AreaChart = () => {
  const points = [
    [0, 80], [40, 60], [80, 75], [120, 40], [160, 55], [200, 20], [240, 35], [280, 10], [320, 25], [360, 5], [400, 15]
  ];
  const pathData = `M 0 100 L ${points.map(p => p.join(' ')).join(' L ')} L 400 100 Z`;
  const lineData = `M ${points.map(p => p.join(' ')).join(' L ')}`;

  return (
    <div className="w-full h-full relative" style={{ minHeight: '220px' }}>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full" style={{ height: '180px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathData} fill="url(#gradient)" className="animate-fade-in" />
        <path d={lineData} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" className="animate-fade-in" />
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
        ))}
      </svg>
      <div className="flex justify-between items-center mt-3 pt-2 text-[11px] text-slate-400 font-medium" style={{ borderTop: '1px solid var(--color-border)' }}>
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
  const { user } = useAuth();
  
  const [stats, setStats] = useState([
    { label: 'Total Contacts', value: '...', icon: Users, color: '#7c3aed', trend: '+12%', points: [12, 14, 15, 18, 20, 22, 25], aiInsight: 'Customer growth is up 8% this week.' },
    { label: 'Delivery Rate', value: '98.4%', icon: CheckCircle2, color: '#10b981', trend: '+0.5%', points: [95, 96, 95.8, 97, 98.1, 98.4, 98.4], aiInsight: 'Excellent health status across WABA lines.' },
    { label: 'Chatbot Activity', value: '...', icon: MessageSquare, color: '#7c3aed', trend: '+24%', points: [100, 120, 150, 130, 180, 210, 240], aiInsight: 'AI handled 82% of responses automatically.' },
    { label: 'Avg. Open Rate', value: '64.2%', icon: TrendingUp, color: '#f59e0b', trend: '+8%', points: [58, 60, 59, 61, 62.4, 63.8, 64.2], aiInsight: 'Highest open rate observed on VIP group.' },
  ]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data && !data.error) {
          setStats([
            { label: 'Total Contacts', value: data.totalContacts || '0', icon: Users, color: '#7c3aed', trend: '+12%', points: [12, 14, 15, 18, 20, 22, data.totalContacts || 25], aiInsight: 'Customer database increased by 12%.' },
            { label: 'Delivery Rate', value: '98.4%', icon: CheckCircle2, color: '#10b981', trend: '+0.5%', points: [95, 96, 95.8, 97, 98.1, 98.4, 98.4], aiInsight: 'Excellent health status across WABA lines.' },
            { label: 'Chatbot Activity', value: data.botResponses || '0', icon: MessageSquare, color: '#7c3aed', trend: '+24%', points: [100, 120, 150, 130, 180, 210, data.botResponses || 240], aiInsight: 'AI handled 82% of replies automatically.' },
            { label: 'Avg. Open Rate', value: '64.2%', icon: TrendingUp, color: '#f59e0b', trend: '+8%', points: [58, 60, 59, 61, 62.4, 63.8, 64.2], aiInsight: 'Highest open rate observed on VIP group.' },
          ]);
        }

        const msgRes = await fetch(`${API_BASE_URL}/api/messages/recent`, { headers: getAuthHeaders() });
        const msgData = await msgRes.json();
        if (Array.isArray(msgData)) {
          setRecentMessages(msgData.slice(0, 5));
        }

        const campRes = await fetch(`${API_BASE_URL}/api/campaigns`, { headers: getAuthHeaders() });
        const campData = await campRes.json();
        if (Array.isArray(campData)) {
          setActiveCampaigns(campData.slice(0, 3));
        }
      } catch (e) {
        console.error("Dashboard overview query failed:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Luxury Hero Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-white border border-slate-100 rounded-[24px] shadow-sm gap-6">
        <div className="flex-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
            <Calendar size={12} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {greeting()}, {user?.name || 'Karthik'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">
            You currently have <strong className="text-slate-800">{activeCampaigns.filter(c => c.status === 'Active').length} campaigns active</strong> and a <strong className="text-emerald-600">98.4% delivery rate</strong>. Keep interactions high.
          </p>
        </div>

        {/* AI Recommendations panel */}
        <div 
          onClick={() => navigate('/campaigns/create')}
          className="flex-1 max-w-md bg-purple-50/50 border border-purple-100/60 p-5 rounded-[20px] cursor-pointer hover:bg-purple-50 transition-all flex gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider mb-1">AI Smart Recommendation</div>
            <div className="text-xs font-bold text-slate-800">Launch a WhatsApp re-engagement campaign for inactive contacts.</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1">Estimate: Boost read rates by 14% on Wednesdays.</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            style={{ minHeight: '160px' }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center" 
                style={{ backgroundColor: `${stat.color}10`, color: stat.color }}
              >
                <stat.icon size={18} />
              </div>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight">{stat.value}</h3>
                <span className={`text-[10px] font-bold flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-full w-fit ${
                  stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.trend}
                </span>
              </div>
              
              <div className="pb-1">
                <Sparkline points={stat.points} color={stat.color} />
              </div>
            </div>

            {/* AI insight footer */}
            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#7c3aed]" />
              <span>{stat.aiInsight}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Broadcast Analytics and Active campaigns) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Campaign Chart Card */}
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Broadcast Performance Timeline</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Timeline overview of delivery and conversion metrics</p>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> Reach
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Delivery
                </span>
              </div>
            </div>
            <AreaChart />
          </div>

          {/* Active Campaigns List */}
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Campaigns</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Ongoing marketing and notification workflows</p>
              </div>
              <button 
                onClick={() => navigate('/campaigns')} 
                className="text-xs font-bold text-[#7c3aed] hover:underline"
              >
                View all campaigns
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {activeCampaigns.map(camp => (
                <div key={camp.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50/80 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7c3aed] flex items-center justify-center">
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{camp.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Channel: {camp.channel} • Target: {camp.target}</p>
                    </div>
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
              {activeCampaigns.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 italic text-xs font-medium">
                  No active broadcasts. Launch a campaign to monitor progress.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (AI Insights & Realtime Feed) */}
        <div className="flex flex-col gap-8">
          
          {/* AI Insights Panel */}
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#7c3aed]" /> AI Advisor Insights
            </h3>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider mb-1">Campaign Optimization</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Template "summer_sale" has a 12% higher read rate on Wednesday morning. Consider shifting schedule.
                </p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider mb-1">CRM Lead Alert</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  3 new contacts reached "Support Handover" state in the last hour. Verify the Shared Team Inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Realtime Activity Feed */}
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Realtime Activity</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <div className="flex flex-col gap-4">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      msg.direction === 'outbound' ? 'bg-purple-50 text-[#7c3aed]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {msg.direction === 'outbound' ? <Send size={12} /> : <MessageSquare size={12} />}
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
                  <div className="text-center py-8 text-slate-400 italic text-[11px] font-medium">
                    Waiting for conversations...
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/inbox')}
              className="w-full mt-6 btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-2"
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
