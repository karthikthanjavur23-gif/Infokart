import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, X, Megaphone, Sparkles, 
  Loader2, MessageCircle, CheckSquare, Square, Search, 
  CheckCircle2, Settings, Zap, ArrowUpRight, BarChart2, Eye, Award, Gift, BellRing, Clipboard, MessageSquare
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
  
  // Custom Campaign Goal Selection
  const [selectedGoal, setSelectedGoal] = useState('Promotion'); // Promotion, Festival, Offer, Launch, Reminder, Survey
  
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    channel: 'WhatsApp', 
    template: '',
    selectedIds: location.state?.selectedIds || []
  });
  const [aiGoal, setAiGoal] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Default campaign segments rule mockup
  const [segmentRules, setSegmentRules] = useState([
    { field: 'Segment Tag', operator: 'CONTAINS', value: 'VIP' },
    { field: 'Last Active', operator: 'LESS_THAN', value: '30 days' }
  ]);

  const goalsList = [
    { id: 'Promotion', label: 'Promotion', desc: 'Drive conversion blasts', icon: Megaphone },
    { id: 'Festival', label: 'Festival / Holiday', desc: 'Send greetings & gifts', icon: Gift },
    { id: 'Offer', label: 'Special Offer', desc: 'Push flash discounts', icon: Zap },
    { id: 'Launch', label: 'Product Launch', desc: 'Announce new arrivals', icon: Award },
    { id: 'Reminder', label: 'Reminder Alert', desc: 'Notify expiring dates', icon: BellRing },
    { id: 'Survey', label: 'Feedback Survey', desc: 'Gather client insights', icon: Clipboard }
  ];

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

  // Update default campaign name when goal changes
  const handleGoalSelect = (goalId) => {
    setSelectedGoal(goalId);
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    setNewCampaign(prev => ({
      ...prev,
      name: `${goalId} Campaign - ${dateStr}`
    }));
  };

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
      
      alert("AI has suggested a plan! Review the details in step 1.");
    } catch (e) {
      console.error(e);
      alert("AI was unable to generate a plan. Please try a different goal.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
    (c.phone_number || '').includes(contactSearch)
  );

  const steps = [
    { title: 'Core Details', icon: Megaphone },
    { title: 'Target Audience', icon: CheckSquare },
    { title: 'Review & Launch', icon: Zap }
  ];

  // Get active template body
  const getSelectedTemplateBody = () => {
    const temp = templates.find(t => t.name === newCampaign.template);
    return temp ? temp.content : "No message template body configured.";
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Upper Header segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/campaigns')} 
            className="btn-secondary hover:bg-slate-50 border-slate-200" 
            style={{ padding: '8px', display: 'flex', alignItems: 'center', height: '40px', width: '40px', justifyContent: 'center' }}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Wizard Form Card */}
        <div className="lg:col-span-2">
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between" style={{ minHeight: '560px' }}>
            
            {/* STEP 1: CHOOSE GOAL & CONFIGURE */}
            {step === 1 && (
              <div className="animate-slide-up flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone size={16} className="text-[#7c3aed]" /> Campaign Parameters
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Select campaign objective, channel, and target templates.</p>
                </div>
                
                {/* Visual Goal Choice Cards */}
                <div className="form-group flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Choose Campaign Goal</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-1">
                    {goalsList.map(g => {
                      const Icon = g.icon;
                      const isSelected = selectedGoal === g.id;
                      return (
                        <button 
                          key={g.id}
                          type="button"
                          onClick={() => handleGoalSelect(g.id)}
                          className={`p-4 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition ${
                            isSelected 
                              ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                            isSelected ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-slate-50 text-slate-500'
                          }`}>
                            <Icon size={16} />
                          </div>
                          <span className="font-bold text-xs text-slate-800">{g.label}</span>
                          <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{g.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Special Offer Blast - Jun 2026" 
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    className="w-input text-sm"
                    style={{ height: '42px', marginTop: 0 }}
                  />
                </div>

                <div className="form-group flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Broadcast Channel</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'WhatsApp'})}
                      className={`p-4 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition ${
                        newCampaign.channel === 'WhatsApp' 
                          ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        newCampaign.channel === 'WhatsApp' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <MessageCircle size={16} />
                      </div>
                      <span className="font-bold text-xs text-slate-800">WhatsApp Business</span>
                      <p className="text-[9px] text-slate-400 mt-1">Direct message templates to customer contacts</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setNewCampaign({...newCampaign, channel: 'Instagram'})}
                      className={`p-4 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition ${
                        newCampaign.channel === 'Instagram' 
                          ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        newCampaign.channel === 'Instagram' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <Sparkles size={16} />
                      </div>
                      <span className="font-bold text-xs text-slate-800">Instagram AI Agent</span>
                      <p className="text-[9px] text-slate-400 mt-1">DM triggers for comments or tags</p>
                    </button>
                  </div>
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Choose Approved Template</label>
                  <select 
                    className="w-select text-xs cursor-pointer"
                    value={newCampaign.template}
                    onChange={e => setNewCampaign({...newCampaign, template: e.target.value})}
                    style={{ height: '42px', marginTop: 0 }}
                  >
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: SEGMENT TARGET AUDIENCE */}
            {step === 2 && (
              <div className="animate-slide-up flex flex-col gap-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-[#7c3aed]" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Target Segment Audience</h3>
                      <p className="text-[11px] text-slate-500">Configure visual query logic rules and select matching contacts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider block mb-1">
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
                      {filteredContacts.every(c => newCampaign.selectedIds.includes(c.id)) && filteredContacts.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                    </button>
                  </div>
                </div>

                {/* Attio-Style Visual Segment Builder */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visual Logic Rule Builder</span>
                  <div className="flex flex-col gap-2">
                    {segmentRules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[9px] font-bold px-2 py-1 bg-white border border-slate-100 rounded text-slate-500">AND</span>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <select className="text-[11px]" style={{ height: '32px', padding: '0 8px', marginTop: 0 }} value={rule.field} onChange={() => {}}>
                            <option>Segment Tag</option>
                            <option>Last Active</option>
                            <option>Registration Date</option>
                          </select>
                          <select className="text-[11px]" style={{ height: '32px', padding: '0 8px', marginTop: 0 }} value={rule.operator} onChange={() => {}}>
                            <option>CONTAINS</option>
                            <option>LESS_THAN</option>
                            <option>EQUALS</option>
                          </select>
                          <input type="text" className="text-[11px]" style={{ height: '32px', padding: '0 8px', marginTop: 0 }} value={rule.value} onChange={() => {}} />
                        </div>
                        <button className="p-1 text-slate-400 hover:text-rose-500 rounded" onClick={() => setSegmentRules(segmentRules.filter((_, i) => i !== idx))}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setSegmentRules([...segmentRules, { field: 'Segment Tag', operator: 'CONTAINS', value: 'Lead' }])}
                      className="text-[10px] font-bold text-[#7c3aed] hover:underline self-start flex items-center gap-1 mt-1.5"
                    >
                      <Plus size={10} /> Add segment rule
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search visible contacts list..." 
                    className="pl-9 pr-4 text-xs border-slate-200 rounded-xl bg-white w-full"
                    style={{ height: '38px', marginTop: 0 }}
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
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
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] transition ${
                            isSelected ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {c.name ? c.name[0] : '?'}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">{c.name || 'Anonymous'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{c.phone_number}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          isSelected ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="text-white" size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & PREDICITIVE ANALYSIS */}
            {step === 3 && (
              <div className="animate-slide-up flex flex-col gap-6">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Launch Simulation Audit</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto leading-relaxed">
                    Review campaign details and simulated AI predictions before releasing campaign templates.
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
                    <span className="text-[9px] uppercase font-bold text-slate-400">Audience Segment Size</span>
                    <span className="font-bold text-xs text-[#7c3aed] block mt-1">{newCampaign.selectedIds.length} Contact(s)</span>
                  </div>
                </div>

                {/* AI Predictive Reach Analytics */}
                <div className="border border-purple-100 bg-purple-50/20 p-4 rounded-[20px]">
                  <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-[#7c3aed]" /> Simulated Audience Reach Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-3 rounded-xl border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Est. Reach</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">{newCampaign.selectedIds.length} users</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Delivery Rate</span>
                      <span className="text-xs font-bold text-emerald-600 mt-1 block">98.4%</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-purple-100/60 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Est. Read Rate</span>
                      <span className="text-xs font-bold text-[#7c3aed] mt-1 block">64.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper control buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between">
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
                  style={{ border: 'none' }}
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

        {/* Sidebar copilot and mobile preview */}
        <div className="flex flex-col gap-6">
          {/* STEP 3 MOBILE PREVIEW / SYSTEM BEST PRACTICES */}
          {step === 3 ? (
            <div className="card p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Template Preview</span>
              {/* iPhone bezel simulation */}
              <div 
                className="w-full max-w-[260px] bg-slate-900 p-3 rounded-[32px] shadow-xl border border-slate-800"
                style={{ height: '340px' }}
              >
                <div className="w-full h-full bg-slate-100 rounded-[24px] overflow-hidden flex flex-col p-2.5 relative">
                  {/* Top notch */}
                  <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-2 shrink-0" />
                  
                  {/* Chat interface preview */}
                  <div className="flex-1 overflow-y-auto flex flex-col justify-end">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-[11px] leading-relaxed border border-slate-200/60 max-w-[90%]">
                      <div className="text-[9px] font-bold text-purple-600 uppercase mb-1">WhatsApp Template</div>
                      {getSelectedTemplateBody()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-slate-900 text-white p-5 rounded-[24px] shadow-md relative overflow-hidden">
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
                  className="w-full py-2 bg-white text-purple-900 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Plan Campaign</>}
                </button>
              </div>
            </div>
          )}

          <div className="card p-5 border-dashed border-2 border-slate-200 bg-transparent flex flex-col gap-4 shadow-none rounded-[24px]">
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
