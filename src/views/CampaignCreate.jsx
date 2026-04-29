import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, X, Megaphone, Sparkles, 
  Loader2, MessageCircle, CheckSquare, Square, Search, 
  CheckCircle2, Settings, Zap 
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const CampaignCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    channel: 'WhatsApp', 
    template: '',
    selectedIds: location.state?.selectedIds || []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tempRes = await fetch(`${API_BASE_URL}/api/templates`);
        const tempData = await tempRes.json();
        setTemplates(tempData);
        if (tempData.length > 0) setNewCampaign(prev => ({ ...prev, template: tempData[0].name }));

        const contactRes = await fetch(`${API_BASE_URL}/api/contacts`);
        const contactData = await contactRes.json();
        setContacts(contactData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaign.name,
          channel: newCampaign.channel,
          template: newCampaign.template,
          contactIds: newCampaign.selectedIds
        })
      });
      if (res.ok) {
        navigate('/campaigns');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
    c.phone_number.includes(contactSearch)
  );

  const steps = [
    { title: 'Core Details', icon: Megaphone },
    { title: 'Target Audience', icon: CheckSquare },
    { title: 'Review & Launch', icon: Zap }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/campaigns')} className="btn-secondary" style={{ padding: '10px' }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Create Campaign</h1>
            <p className="text-sm text-muted">Set up your audience and message strategy</p>
          </div>
        </div>
        <div className="flex items-center">
           {steps.map((s, i) => (
             <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-2" style={{ width: '80px' }}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-bold transition-all ${
                    step > i+1 ? 'bg-success text-white shadow-lg shadow-success/20' : 
                    step === i+1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 
                    'bg-white text-muted border border-slate-200'
                  }`}>
                    {step > i+1 ? <CheckCircle2 size={20} /> : i+1}
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider font-bold text-center ${step === i+1 ? 'text-primary' : 'text-muted'}`}>
                    {s.title.split(' ')[0]}
                  </span>
                </div>
               {i < steps.length - 1 && <div className={`mx-2 w-16 h-0.5 rounded-full ${step > i+1 ? 'bg-success' : 'bg-slate-100'}`} />}
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="card" style={{ minHeight: '650px', display: 'flex', flexDirection: 'column', padding: 'var(--space-xl)' }}>
            
            {step === 1 && (
              <div className="animate-slide-up">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Campaign Essentials</h3>
                    <p className="text-muted text-xs">Define your basic campaign parameters</p>
                  </div>
                </div>
                
                <div className="form-group mb-12">
                  <label className="label">Campaign Nomenclature</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Eid Flash Sale 2026" 
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    style={{ fontSize: '18px', padding: '18px 24px', borderRadius: '18px' }}
                  />
                  <p className="text-muted text-[11px] mt-2 italic px-2">Give your campaign a name that helps you identify it in the reports.</p>
                </div>

                <div className="form-group mb-12">
                  <label className="label">Primary Communication Channel</label>
                  <div className="grid grid-cols-2 gap-8 mt-6">
                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'WhatsApp'})}
                      className={`p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center w-full appearance-none bg-transparent ${
                        newCampaign.channel === 'WhatsApp' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${newCampaign.channel === 'WhatsApp' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-muted'}`}>
                        <MessageCircle size={30} />
                      </div>
                      <div className="font-black text-lg">WhatsApp</div>
                      <div className="text-[11px] text-muted leading-relaxed mt-2">Broadcast personalized messages to your customer phone numbers.</div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'Instagram'})}
                      className={`p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center w-full appearance-none bg-transparent ${
                        newCampaign.channel === 'Instagram' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${newCampaign.channel === 'Instagram' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-muted'}`}>
                        <Zap size={30} />
                      </div>
                      <div className="font-black text-lg">Instagram</div>
                      <div className="text-[11px] text-muted leading-relaxed mt-2">Leverage Direct Messages to engage your story viewers and followers.</div>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Select Message Template</label>
                  <select 
                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--color-border)', fontSize: '16px', marginTop: '8px', cursor: 'pointer' }}
                    value={newCampaign.template}
                    onChange={e => setNewCampaign({...newCampaign, template: e.target.value})}
                  >
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <CheckSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Target Audience</h3>
                      <p className="text-muted text-[10px] font-medium">Select the contacts for this broadcast</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{newCampaign.selectedIds.length} Selected</div>
                    <button 
                      onClick={() => {
                        const allFilteredIds = filteredContacts.map(c => c.id);
                        const allAlreadySelected = allFilteredIds.every(id => newCampaign.selectedIds.includes(id));
                        
                        let nextSelected;
                        if (allAlreadySelected) {
                          // Deselect all filtered
                          nextSelected = newCampaign.selectedIds.filter(id => !allFilteredIds.includes(id));
                        } else {
                          // Select all filtered (union)
                          nextSelected = Array.from(new Set([...newCampaign.selectedIds, ...allFilteredIds]));
                        }
                        setNewCampaign({...newCampaign, selectedIds: nextSelected});
                      }}
                      className="text-[10px] font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
                    >
                      {filteredContacts.every(c => newCampaign.selectedIds.includes(c.id)) && filteredContacts.length > 0 ? 'Deselect All' : 'Select All Visible'}
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by name, tags, or phone number..." 
                    style={{ paddingLeft: '48px', margin: 0, borderRadius: '14px', height: '52px' }}
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                  {filteredContacts.map(c => {
                    const isSelected = newCampaign.selectedIds.includes(c.id);
                    return (
                      <div 
                        key={c.id}
                        onClick={() => {
                          const next = isSelected 
                            ? newCampaign.selectedIds.filter(id => id !== c.id)
                            : [...newCampaign.selectedIds, c.id];
                          setNewCampaign({...newCampaign, selectedIds: next});
                        }}
                        className={`group flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                            isSelected ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-100 text-muted'
                          }`}>
                            {c.name[0]}
                          </div>
                          <div>
                            <div className={`font-black text-sm transition-colors ${isSelected ? 'text-primary' : 'text-main'}`}>{c.name}</div>
                            <div className="text-xs text-muted font-medium mt-0.5">{c.phone_number}</div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary border-primary' : 'border-slate-200 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <CheckCircle2 className="text-white" size={16} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredContacts.length === 0 && (
                    <div className="py-12 text-center text-muted italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No matching contacts found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-slide-up text-center py-12 px-8">
                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 transition-all duration-500 shadow-2xl ${
                  newCampaign.channel === 'WhatsApp' ? 'bg-success/10 text-success shadow-success/20' : 'bg-primary/10 text-primary shadow-primary/20'
                }`}>
                  {newCampaign.channel === 'WhatsApp' ? <MessageCircle size={48} /> : <Zap size={48} />}
                </div>
                <h3 className="text-3xl font-black mb-3">Campaign Ready!</h3>
                <p className="text-muted max-w-sm mx-auto mb-12 font-medium leading-relaxed">You've specified your audience and channel. Review the details below and launch your broadcast.</p>
                
                <div className="grid grid-cols-2 gap-6 text-left max-w-lg mx-auto mb-12">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted mb-2">Campaign Name</div>
                    <div className="font-black text-sm truncate text-main">{newCampaign.name}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted mb-2">Broadcast Channel</div>
                    <div className="font-black text-sm text-main flex items-center gap-2">
                       {newCampaign.channel === 'WhatsApp' ? <MessageCircle size={14} /> : <Zap size={14} />}
                       {newCampaign.channel}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted mb-2">Message Template</div>
                    <div className="font-black text-sm truncate text-main">{newCampaign.template}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-[10px] uppercase font-black tracking-widest text-muted mb-2">Target Recipients</div>
                    <div className="font-black text-sm text-primary">{newCampaign.selectedIds.length} Verified Contacts</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-10 flex justify-between">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="btn-secondary px-8 flex items-center gap-2">
                  <ChevronLeft size={20} /> Back
                </button>
              ) : <div />}
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)} 
                  className="btn-primary px-10 flex items-center gap-2"
                  disabled={step === 1 && !newCampaign.name}
                >
                  Continue <ChevronRight size={20} />
                </button>
              ) : (
                <button onClick={handleCreate} disabled={isSubmitting} className="btn-primary px-12 flex items-center gap-2">
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Finalize & Create</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="flex flex-col gap-10">
          <div className="card bg-primary-dark text-white p-10 rounded-[32px] shadow-xl relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
             
             <h4 className="flex items-center gap-3 mb-6 font-bold text-lg"><Sparkles size={22} /> AI Strategy Tip</h4>
             <p className="text-sm opacity-90 leading-relaxed font-medium">
                "Personalized templates with customer names tend to have **3x higher click-through rates**. Our engine automatically populates <strong>{'{'}{'{'}name{'}'}{'}'}</strong> if included in your template."
             </p>
          </div>
          <div className="card p-10 border-dashed border-2 border-slate-200 bg-transparent flex flex-col gap-6 shadow-none">
             <h4 className="flex items-center gap-3 text-main font-bold"><Settings size={22} className="text-muted" /> Best Practices</h4>
             <ul className="text-xs text-muted flex flex-col gap-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Verify all phone numbers include relevant country codes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Segment your audience for 40% better conversion.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Test layouts to ensure optimal mobile rendering.</span>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCreate;
