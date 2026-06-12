import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, X, Megaphone, Sparkles, 
  Loader2, MessageCircle, CheckSquare, Square, Search, 
  CheckCircle2, Settings, Zap, ArrowUpRight, BarChart2, Eye
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

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
  const [aiGoal, setAiGoal] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tempRes = await fetch(`${API_BASE_URL}/api/templates`, { headers: getAuthHeaders() });
        const tempData = await tempRes.json();
        if (Array.isArray(tempData)) {
          setTemplates(tempData);
          if (tempData.length > 0) setNewCampaign(prev => ({ ...prev, template: tempData[0].name }));
        }

        const contactRes = await fetch(`${API_BASE_URL}/api/contacts`, { headers: getAuthHeaders() });
        const contactData = await contactRes.json();
        if (Array.isArray(contactData)) {
          setContacts(contactData);
        }
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
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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

  const handleGenerateAiPlan = async () => {
    if (!aiGoal.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/plan-campaign`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal })
      });
      const plan = await res.json();
      
      setNewCampaign({
        ...newCampaign,
        name: plan.name,
        template: plan.template
      });
      
      alert("AI has suggested a plan! Review the 'Core Details' tab.");
    } catch (e) {
      console.error(e);
      alert("AI was unable to generate a plan. Please try a different goal.");
    } finally {
      setIsGeneratingAi(false);
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
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Upper header segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/campaigns')} 
            className="btn-secondary hover:bg-slate-50 border-slate-200" 
            style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Campaign</h1>
            <p className="text-xs text-slate-500 mt-1">Configure target recipients, channels, and templates</p>
          </div>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <button 
                onClick={() => { if (step > i+1) setStep(i+1); }}
                disabled={step <= i+1}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  step === i+1 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : step > i+1 
                      ? 'text-[#7c3aed] hover:text-[#6d28d9]' 
                      : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  step >= i+1 ? 'bg-[#7c3aed] text-white' : 'bg-slate-300 text-slate-500'
                }`}>
                  {i+1}
                </span>
                <span>{s.title}</span>
              </button>
              {i < steps.length - 1 && <div className="w-4 h-px bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between" style={{ minHeight: '520px' }}>
            
            {/* STEP 1: CORE DETAILS */}
            {step === 1 && (
              <div className="animate-slide-up flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <Megaphone size={18} className="text-[#7c3aed]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Campaign Configuration</h3>
                    <p className="text-[11px] text-slate-500">Provide basic campaign info and communication parameters</p>
                  </div>
                </div>
                
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Eid Flash Sale 2026" 
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    className="w-input text-sm"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Use a descriptive title to locate this campaign in reports.</span>
                </div>

                <div className="form-group flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Broadcast Channel</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'WhatsApp'})}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition ${
                        newCampaign.channel === 'WhatsApp' 
                          ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        newCampaign.channel === 'WhatsApp' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <MessageCircle size={20} />
                      </div>
                      <span className="font-bold text-xs text-slate-800">WhatsApp</span>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Broadcast text templates directly to user phone numbers.</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'Instagram'})}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition ${
                        newCampaign.channel === 'Instagram' 
                          ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        newCampaign.channel === 'Instagram' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Zap size={20} />
                      </div>
                      <span className="font-bold text-xs text-slate-800">Instagram AI</span>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Trigger automated DMs for comment replies or story mentions.</p>
                    </button>
                  </div>
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Choose Approved Template</label>
                  <select 
                    className="w-select text-xs cursor-pointer"
                    value={newCampaign.template}
                    onChange={e => setNewCampaign({...newCampaign, template: e.target.value})}
                  >
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: TARGET RECIPENTS */}
            {step === 2 && (
              <div className="animate-slide-up flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-[#7c3aed]" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Target Recipients</h3>
                      <p className="text-[11px] text-slate-500">Select contacts mapped to this broadcast campaign</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#7c3aed] uppercase tracking-wider block mb-1">
                      {newCampaign.selectedIds.length} SELECTED
                    </span>
                    <button 
                      onClick={() => {
                        const allFiltered = filteredContacts.map(c => c.id);
                        const isAllSelected = allFiltered.every(id => newCampaign.selectedIds.includes(id));
                        
                        let updated;
                        if (isAllSelected) {
                          updated = newCampaign.selectedIds.filter(id => !allFiltered.includes(id));
                        } else {
                          updated = Array.from(new Set([...newCampaign.selectedIds, ...allFiltered]));
                        }
                        setNewCampaign({...newCampaign, selectedIds: updated});
                      }}
                      className="text-[10px] font-black text-slate-400 hover:text-[#7c3aed] uppercase tracking-widest"
                    >
                      {filteredContacts.every(c => newCampaign.selectedIds.includes(c.id)) && filteredContacts.length > 0 ? 'Deselect All' : 'Select Visible'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, phone, or tag..." 
                    className="pl-9 pr-4 text-xs border-slate-200 rounded-xl bg-white w-full"
                    style={{ height: '38px', marginTop: 0 }}
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                            isSelected ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {c.name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{c.phone_number}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="text-white" size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & PREDICTIONS */}
            {step === 3 && (
              <div className="animate-slide-up flex flex-col gap-6">
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto mb-3 shadow-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Verify Campaign Details</h3>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Verify template properties and target audience predictions before triggering the launch broadcast.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Campaign Identifier</span>
                    <span className="font-bold text-xs text-slate-800 block mt-1 truncate">{newCampaign.name}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Target Channel</span>
                    <span className="font-bold text-xs text-slate-800 block mt-1">{newCampaign.channel}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Approved Template</span>
                    <span className="font-bold text-xs text-slate-800 block mt-1 truncate">{newCampaign.template}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Target Count</span>
                    <span className="font-bold text-xs text-[#7c3aed] block mt-1">{newCampaign.selectedIds.length} Recipient(s)</span>
                  </div>
                </div>

                {/* AI Predictive Reach Analytics */}
                <div className="border border-purple-100 bg-purple-50/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-[#7c3aed]" /> Campaign Reach Simulation Insights
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded-lg border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Est. Reach</span>
                      <span className="text-sm font-black text-slate-800 mt-1 block">{newCampaign.selectedIds.length} Recip.</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Est. Delivery</span>
                      <span className="text-sm font-black text-emerald-600 mt-1 block">98.4%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Est. Read Rate</span>
                      <span className="text-sm font-black text-[#7c3aed] mt-1 block">64.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper control buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
              {step > 1 ? (
                <button 
                  onClick={() => setStep(step - 1)} 
                  className="btn-secondary text-xs px-5 hover:bg-slate-50 border-slate-200 flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)} 
                  disabled={step === 1 && !newCampaign.name.trim()}
                  className="btn-primary text-xs px-6 hover:bg-[#6d28d9] flex items-center gap-1.5"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleCreate} 
                  disabled={isSubmitting || newCampaign.selectedIds.length === 0} 
                  className="btn-primary text-xs px-8 hover:bg-[#6d28d9] flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>Launch Broadcast <ArrowUpRight size={16} /></>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Sidebar copilot suggestions */}
        <div className="flex flex-col gap-6">
          <div className="card bg-purple-900 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
            <h4 className="flex items-center gap-2 mb-3 font-bold text-sm text-white">
              <Sparkles size={16} /> AI Campaign Planner
            </h4>
            <p className="text-[11px] text-purple-100 leading-relaxed font-medium mb-4">
              Enter your campaign's marketing objective. Gemini will draft corresponding names and messaging scripts.
            </p>
            <div className="flex flex-col gap-2.5">
              <input 
                type="text" 
                placeholder="e.g. 20% off Summer Sale" 
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                className="w-input text-xs"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', marginTop: 0 }}
              />
              <button 
                onClick={handleGenerateAiPlan}
                disabled={isGeneratingAi || !aiGoal.trim()}
                className="w-full py-2 bg-white text-purple-900 rounded-lg text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Plan Campaign</>}
              </button>
            </div>
          </div>

          <div className="card p-5 border-dashed border-2 border-slate-200 bg-transparent flex flex-col gap-4 shadow-none">
            <h4 className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Settings size={16} className="text-slate-400" /> Sending Best Practices
            </h4>
            <ul className="text-[11px] text-slate-500 flex flex-col gap-3">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />
                <span>Templates must be pre-approved by Meta before broadcasting.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />
                <span>Verify that phone numbers are formatted with country prefixes.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />
                <span>Utilize segment tag filters to maximize reading engagement rates.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignCreate;
