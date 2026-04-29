import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Megaphone, Calendar, Users, Target, 
  CheckCircle2, AlertCircle, BarChart3, Mail, MessageCircle, MoreVertical, Loader2, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaignData = async () => {
    try {
      const campRes = await fetch(`${API_BASE_URL}/api/campaigns/${id}`);
      const campData = await campRes.json();
      setCampaign(campData);

      const contactRes = await fetch(`${API_BASE_URL}/api/campaigns/${id}/contacts`);
      const contactData = await contactRes.json();
      setContacts(contactData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  // Poll for updates if campaign is Active
  useEffect(() => {
    let interval;
    if (campaign && campaign.status === 'Active') {
      interval = setInterval(fetchCampaignData, 2000);
    }
    return () => clearInterval(interval);
  }, [campaign?.status]);

  const handleLaunch = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchCampaignData();
      } else {
        alert(data.error || "Failed to launch campaign");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-16 text-center text-muted animate-fade-in">Loading campaign reports...</div>;
  if (!campaign) return <div className="p-16 text-center text-danger animate-fade-in">Campaign not found.</div>;

  const stats = [
    { label: 'Total Targeted', value: campaign.target, icon: Users, color: 'var(--color-primary)' },
    { label: 'Successfully Sent', value: campaign.sent || 0, icon: CheckCircle2, color: 'var(--color-success)' },
    { label: 'Opened / Read', value: campaign.opened || 0, icon: BarChart3, color: 'var(--color-warning)' },
    { label: 'Status', value: campaign.status, icon: Target, color: campaign.status === 'Active' ? 'var(--color-success)' : campaign.status === 'Completed' ? 'var(--color-primary)' : 'var(--color-text-muted)' }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/campaigns')} className="btn-secondary" style={{ padding: '10px' }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="flex items-center gap-4">
              {campaign.name} 
              <span className={`badge ${
                campaign.status === 'Active' ? 'badge-success' : 
                campaign.status === 'Completed' ? 'badge-primary' : 
                'badge-muted'
              }`}>
                {campaign.status}
              </span>
            </h1>
            <div className="text-sm text-muted flex items-center gap-6 mt-2">
              <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(campaign.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><Target size={14} /> {campaign.channel} broadcast</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {campaign.status === 'Draft' && (
            <button className="btn-primary flex items-center gap-2" onClick={handleLaunch}>
              <Zap size={18} /> Launch Campaign
            </button>
          )}
          {campaign.status === 'Active' && (
            <button className="btn-secondary flex items-center gap-2" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              <Loader2 size={18} className="animate-spin" /> Broadcasting...
            </button>
          )}
          <button className="btn-secondary">Export Report</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        {stats.map((s, i) => (
          <div key={i} className="card flex flex-col items-center text-center gap-3">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ backgroundColor: `${s.color}10`, color: s.color }}>
                <s.icon size={24} />
             </div>
             <div>
                <div className="text-[11px] text-muted font-bold uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-2xl font-black">{s.value}</div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recipients Table */}
        <div className="lg:col-span-2">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold flex items-center gap-2">Targeted Recipients <span className="text-xs font-normal text-muted bg-white px-2 py-0.5 rounded-full">{contacts.length}</span></h3>
               <button className="btn-secondary text-xs" style={{ padding: '6px 12px' }}>Refresh</button>
            </div>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
               <thead className="bg-slate-50/50 text-[11px] uppercase font-bold text-muted border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Contact Name</th>
                    <th className="px-8 py-5">Phone Number</th>
                    <th className="px-8 py-5">Delivery Status</th>
                    <th className="px-8 py-5">Activity</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {contacts.map((c, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                       <td className="px-8 py-6 font-semibold text-main">{c.name}</td>
                       <td className="px-8 py-6 text-muted font-medium">{c.phone_number}</td>
                       <td className="px-8 py-6">
                          <span className={`badge ${
                            c.campaign_status === 'Sent' ? 'badge-success' : 
                            c.campaign_status === 'Failed' ? 'badge-danger' : 
                            'badge-muted'
                          }`}>
                             {c.campaign_status || 'Pending'}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-xs text-muted">--</td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr><td colSpan="4" className="p-16 text-center text-muted italic">No specific contacts were recorded for this campaign.</td></tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>

        {/* Campaign Info Sidebar */}
        <div className="flex flex-col gap-8">
           <div className="card">
              <h3 className="card-title mb-6 flex items-center gap-2 text-primary font-bold"><MessageCircle size={20} /> Message Context</h3>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm leading-relaxed text-main italic">
                "{campaign.template || 'No template selected'}"
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 italic text-[11px] text-muted flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Variable placeholders like {'{'}{'{'}name{'}'}{'}'} are automatically mapped to contact data during broadcast.</span>
              </div>
           </div>

           <div className="card">
              <h3 className="card-title mb-6 flex items-center gap-2 font-bold"><BarChart3 size={20} /> Analytics Estimate</h3>
              <div className="flex flex-col gap-6">
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                       <span className="text-muted uppercase tracking-wider">Est. Delivery Rate</span>
                       <span className="text-success">98.2%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-success" style={{ width: '98.2%' }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                       <span className="text-muted uppercase tracking-wider">Est. Open Rate</span>
                       <span className="text-warning">64.5%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-warning" style={{ width: '64.5%' }} />
                    </div>
                 </div>
              </div>
              <div className="mt-8">
                <button className="btn-secondary w-full text-xs font-bold py-3">View Full Insights</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
