import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, MessageCircle, Megaphone, Sparkles, Filter, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

const BulkCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`);
      const campData = await campRes.json();
      setCampaigns(campData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="flex items-center gap-3"><Megaphone size={32} className="text-primary" /> Campaigns Overview</h1>
          <p className="text-muted text-sm mt-1">Manage and monitor all your broadcast activities from a single dashboard.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary flex items-center gap-2" onClick={() => navigate('/campaigns/create')}>
            <Sparkles size={18} /> AI Assistant
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/campaigns/create')}>
            <Plus size={18} /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Total Campaigns</div>
          <div className="text-3xl font-bold">{campaigns.length}</div>
        </div>
        <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Active Now</div>
          <div className="text-3xl font-bold">{campaigns.filter(c => c.status === 'Active').length}</div>
        </div>
        <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Pending Sync</div>
          <div className="text-3xl font-bold">{campaigns.filter(c => c.status === 'Draft').length}</div>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex justify-between items-center">
          <div style={{ position: 'relative', width: '360px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              style={{ width: '100%', padding: '12px 16px 12px 48px', margin: 0 }}
            />
          </div>
          <div className="flex gap-4">
            <button className="btn-secondary flex items-center gap-2"><Filter size={18} /> Filter</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-soft)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign</th>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channel</th>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience</th>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</th>
              <th style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp) => (
              <tr 
                key={camp.id} 
                onClick={() => navigate(`/campaigns/${camp.id}`)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--color-border-soft)' }}
              >
                <td style={{ padding: '24px 32px' }}>
                  <div className="font-bold text-[15px] text-main">{camp.name}</div>
                  <div className="text-xs text-muted mt-1">{new Date(camp.created_at).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {camp.channel === 'WhatsApp' ? <MessageCircle size={16} className="text-success" /> : <Zap size={16} className="text-primary" />}
                    {camp.channel}
                  </span>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <span className={`badge ${
                    camp.status === 'Active' ? 'badge-success' : 
                    camp.status === 'Completed' ? 'badge-primary' : 
                    'badge-muted'
                  }`}>
                    {camp.status}
                  </span>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <div className="font-semibold text-main">{camp.target.toLocaleString()}</div>
                  <div className="text-xs text-muted mt-1">recipients</div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                   <div style={{ width: '140px' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-muted">{Math.round((camp.sent / camp.target * 100) || 0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-primary" style={{ width: `${(camp.sent / camp.target * 100) || 0}%`, transition: 'width 1s ease-in-out' }} />
                      </div>
                   </div>
                </td>
                <td style={{ padding: '24px 32px' }}>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {camp.status === 'Draft' && (
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px' }}
                        title="Launch Campaign"
                        onClick={async () => { 
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/campaigns/${camp.id}/send`, { method: 'POST' });
                            if (res.ok) fetchData();
                          } catch (err) { console.error(err); }
                        }}
                      >
                        <Zap size={16} />
                      </button>
                    )}
                    <button className="btn-secondary" style={{ padding: '8px' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && !loading && (
              <tr><td colSpan="6" className="p-16 text-center text-muted italic">No campaigns found. Start by creating your first broadcast!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkCampaigns;
