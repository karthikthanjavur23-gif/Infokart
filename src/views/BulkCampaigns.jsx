import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, MessageCircle, Megaphone, Sparkles, Filter, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const BulkCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`, { headers: getAuthHeaders() });
      const campData = await campRes.json();
      if (Array.isArray(campData)) {
        setCampaigns(campData);
      }
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
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header Segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Megaphone size={28} className="text-primary" /> Campaign Broadcasts
          </h1>
          <p className="text-slate-500 text-xs mt-1">Monitor, sync, and launch marketing templates directly to segmented cohorts.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            className="btn-secondary flex-1 sm:flex-initial flex items-center gap-2 border-slate-200" 
            onClick={() => navigate('/campaigns/create')}
          >
            <Sparkles size={14} /> AI Planner
          </button>
          <button 
            className="btn-primary flex-1 sm:flex-initial flex items-center gap-2 transition" 
            onClick={() => navigate('/campaigns/create')}
          >
            <Plus size={14} /> New Campaign
          </button>
        </div>
      </div>

      {/* Modern KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">Total Campaigns</div>
          <div className="text-3xl font-extrabold text-slate-800">{campaigns.length}</div>
        </div>
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">Active Broadcasts</div>
          <div className="text-3xl font-extrabold text-[#7c3aed]">{campaigns.filter(c => c.status === 'Active').length}</div>
        </div>
        <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">Draft Mode</div>
          <div className="text-3xl font-extrabold text-slate-500">{campaigns.filter(c => c.status === 'Draft').length}</div>
        </div>
      </div>

      {/* Filter and search actions card */}
      <div className="card bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            className="pl-9 pr-4 py-2 text-xs border-slate-200 rounded-xl bg-white w-full"
            style={{ height: '38px', marginTop: 0 }}
          />
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2" style={{ height: '38px', borderRadius: '12px', padding: '0 16px' }}>
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card bg-white border border-slate-100 rounded-[24px] p-0 overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-xs text-slate-600">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-bold text-slate-500">Campaign</th>
              <th className="p-4 font-bold text-slate-500">Channel</th>
              <th className="p-4 font-bold text-slate-500">Status</th>
              <th className="p-4 font-bold text-slate-500">Audience</th>
              <th className="p-4 font-bold text-slate-500">Progress</th>
              <th className="p-4 font-bold text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp) => (
              <tr 
                key={camp.id} 
                onClick={() => navigate(`/campaigns/${camp.id}`)}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <td className="p-4 font-bold text-slate-800">
                  <div className="font-bold text-[13px] text-slate-800">{camp.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(camp.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    {camp.channel === 'WhatsApp' ? <MessageCircle size={14} className="text-emerald-500" /> : <Zap size={14} className="text-purple-500" />}
                    {camp.channel}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`badge ${
                    camp.status === 'Active' ? 'badge-success' : 
                    camp.status === 'Completed' ? 'badge-primary' : 
                    'badge-muted'
                  }`}>
                    {camp.status}
                  </span>
                </td>
                <td className="p-4 font-semibold text-slate-600">
                  <div className="font-bold text-slate-700">{camp.target.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">recipients</div>
                </td>
                <td className="p-4">
                   <div style={{ width: '120px' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500">{Math.round((camp.sent / camp.target * 100) || 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-primary" style={{ width: `${(camp.sent / camp.target * 100) || 0}%`, transition: 'width 1s ease-in-out' }} />
                      </div>
                   </div>
                </td>
                <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2 justify-end">
                    {camp.status === 'Draft' && (
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0 12px', height: '32px', borderRadius: '10px' }}
                        title="Launch Campaign"
                        onClick={async () => { 
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/campaigns/${camp.id}/send`, { 
                              method: 'POST',
                              headers: getAuthHeaders()
                            });
                            if (res.ok) fetchData();
                          } catch (err) { console.error(err); }
                        }}
                      >
                        <Zap size={12} />
                      </button>
                    )}
                    <button className="btn-secondary" style={{ padding: '0 10px', height: '32px', borderRadius: '10px' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="p-16 text-center text-slate-400 italic font-medium">
                  No campaigns found. Start by creating your first broadcast!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkCampaigns;
