import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { Users, Filter, CheckCircle2, MessageSquare, TrendingUp, ArrowUpRight } from 'lucide-react';

const AreaChart = () => {
  // Simple SVG Area Chart logic
  const points = [
    [0, 80], [40, 60], [80, 75], [120, 40], [160, 55], [200, 20], [240, 35], [280, 10], [320, 25], [360, 5], [400, 15]
  ];
  const pathData = `M 0 100 L ${points.map(p => p.join(' ')).join(' L ')} L 400 100 Z`;
  const lineData = `M ${points.map(p => p.join(' ')).join(' L ')}`;

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathData} fill="url(#gradient)" className="animate-fade-in" />
        <path d={lineData} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" className="animate-fade-in" />
        
        {/* Grid lines */}
        {[25, 50, 75].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--color-border-soft)" strokeWidth="0.5" />)}
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex justify-between items-end pointer-events-none px-2 pb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <span key={day} className="text-xs text-muted font-medium">{day}</span>
        ))}
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState([
    { label: 'Total Contacts', value: '...', icon: Users, color: 'var(--color-primary)', trend: '+12%' },
    { label: 'Delivery Rate', value: '...', icon: CheckCircle2, color: 'var(--color-success)', trend: '+0.5%' },
    { label: 'Chatbot Activity', value: '...', icon: MessageSquare, color: 'var(--color-primary)', trend: '+24%' },
    { label: 'Avg. Open Rate', value: '...', icon: TrendingUp, color: 'var(--color-warning)', trend: '+8%' },
  ]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`, { headers: getAuthHeaders() });
        const data = await res.json();
        setStats([
          { label: 'Total Contacts', value: data.totalContacts, icon: Users, color: 'var(--color-primary)', trend: '+12%' },
          { label: 'Delivery Rate', value: '98.4%', icon: CheckCircle2, color: 'var(--color-success)', trend: '+0.5%' },
          { label: 'Chatbot Activity', value: data.botResponses, icon: MessageSquare, color: 'var(--color-primary)', trend: '+24%' },
          { label: 'Avg. Open Rate', value: '64.2%', icon: TrendingUp, color: 'var(--color-warning)', trend: '+8%' },
        ]);

        const msgRes = await fetch(`${API_BASE_URL}/api/messages/recent`, { headers: getAuthHeaders() });
        const msgData = await msgRes.json();
        setRecentMessages(msgData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="mb-1">Dashboard Overview</h1>
          <p className="text-muted">Welcome back, Karthik! Here's what's happening today.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <TrendingUp size={18} /> View Reports
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, position: 'relative', overflow: 'hidden' }}>
            <div className="flex justify-between items-start mb-4">
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={22} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                {stat.trend} <ArrowUpRight size={12} />
              </div>
            </div>
            <div>
              <div className="text-muted font-semibold text-sm mb-1">{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>{stat.value}</div>
            </div>
            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
              <stat.icon size={80} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2>Campaign Performance</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-muted">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} /> Reach
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-muted">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }} /> Target
              </span>
            </div>
          </div>
          <AreaChart />
        </div>
        
        <div className="card">
          <h2 className="mb-6">Real-time Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {recentMessages.map((msg, i) => (
              <div key={msg.id} className="flex gap-4 items-center animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: msg.direction === 'outbound' ? 'var(--color-primary-light)' : 'var(--color-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: msg.direction === 'outbound' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {msg.direction === 'outbound' ? <ArrowUpRight size={18} /> : <MessageSquare size={18} />}
                  </div>
                  {msg.direction === 'inbound' && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)', border: '2px solid white' }} />}
                </div>
                <div className="flex-1 min-width-0">
                  <div className="text-sm font-bold truncate">{msg.name || msg.phone_number}</div>
                  <div className="text-xs text-muted truncate">{msg.content}</div>
                </div>
                <div className="text-[10px] text-muted whitespace-nowrap">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {recentMessages.length === 0 && <div className="text-center py-10 text-muted italic text-xs">Waiting for new messages...</div>}
          </div>
          <button className="w-full mt-6 btn-secondary py-2 text-sm font-bold" onClick={() => navigate('/inbox')}>View Shared Inbox</button>
        </div>
      </div>
    </div>
  );
};

// Quick fix for missing icon
const MegaphoneActivity = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 6h2"/><path d="M12 2v2"/><path d="m14 4 1-1"/><path d="m16 8 2-2"/><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="m5 12 2-2 4 4 6-6"/></svg>;

export default DashboardOverview;

