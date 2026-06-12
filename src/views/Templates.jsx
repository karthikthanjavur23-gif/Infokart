import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutTemplate, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Smartphone, 
  Sparkles, 
  Wand2, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Phone, 
  Send, 
  Info,
  Layers,
  Globe,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const Templates = () => {
  const navigate = useNavigate();
  
  // View states
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'edit'
  const [currentEditingId, setCurrentEditingId] = useState(null);
  
  // Lists & loading
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  // Filters state
  const [statusTab, setStatusTab] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('MARKETING');
  const [formLanguage, setFormLanguage] = useState('en_US');
  const [formHeaderType, setFormHeaderType] = useState('NONE');
  const [formHeaderContent, setFormHeaderContent] = useState('');
  const [formBodyContent, setFormBodyContent] = useState('');
  const [formFooterContent, setFormFooterContent] = useState('');
  const [formButtons, setFormButtons] = useState([]); // Array of { type, text, phone_number, url }
  
  // AI Copilot state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProgressText, setAiProgressText] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: '' });
  
  // Preview variable mock inputs (users can fill these to test the template preview)
  const [previewVariables, setPreviewVariables] = useState({});

  // Show toast utility
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Fetch templates listing
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const queryParts = [];
      if (statusTab !== 'ALL') queryParts.push(`status=${statusTab}`);
      if (categoryFilter !== 'ALL') queryParts.push(`category=${categoryFilter}`);
      if (languageFilter !== 'ALL') queryParts.push(`language=${languageFilter}`);
      if (searchQuery) queryParts.push(`search=${encodeURIComponent(searchQuery)}`);
      
      const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
      const res = await fetch(`${API_BASE_URL}/api/templates${queryString}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to fetch templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [statusTab, categoryFilter, languageFilter]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchTemplates();
    }
  };

  // Sync templates status from Meta
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Synchronized ${data.count || 0} templates with Meta WABA!`);
        fetchTemplates();
      } else {
        showToast(data.error || 'Failed to sync templates', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error synchronizing templates', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete template
  const handleDelete = async (id, name, metaId) => {
    const confirmMessage = metaId 
      ? `Are you sure you want to delete template "${name}"? This will ALSO request deletion from Meta Cloud WABA globally.`
      : `Are you sure you want to delete local draft "${name}"?`;
      
    if (!window.confirm(confirmMessage)) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Template deleted successfully');
        fetchTemplates();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete template', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error deleting template', 'error');
    }
  };

  // Switch to Create Mode
  const handleOpenCreate = () => {
    setFormName('');
    setFormCategory('MARKETING');
    setFormLanguage('en_US');
    setFormHeaderType('NONE');
    setFormHeaderContent('');
    setFormBodyContent('');
    setFormFooterContent('');
    setFormButtons([]);
    setCurrentEditingId(null);
    setViewMode('create');
  };

  // Switch to Edit Mode
  const handleOpenEdit = (template) => {
    setFormName(template.template_name);
    setFormCategory(template.category);
    setFormLanguage(template.language);
    setFormHeaderType(template.header_type || 'NONE');
    setFormHeaderContent(template.header_content || '');
    setFormBodyContent(template.body_content);
    setFormFooterContent(template.footer_content || '');
    
    let parsedButtons = [];
    if (template.buttons_json) {
      try {
        parsedButtons = typeof template.buttons_json === 'string' 
          ? JSON.parse(template.buttons_json) 
          : template.buttons_json;
      } catch (e) {
        console.error("Error parsing buttons_json", e);
      }
    }
    setFormButtons(parsedButtons);
    setCurrentEditingId(template.id);
    setViewMode('edit');
  };

  // Duplicate template config to new creation form
  const handleDuplicate = (template) => {
    setFormName(`${template.template_name}_copy`);
    setFormCategory(template.category);
    setFormLanguage(template.language);
    setFormHeaderType(template.header_type || 'NONE');
    setFormHeaderContent(template.header_content || '');
    setFormBodyContent(template.body_content);
    setFormFooterContent(template.footer_content || '');
    
    let parsedButtons = [];
    if (template.buttons_json) {
      try {
        parsedButtons = typeof template.buttons_json === 'string' 
          ? JSON.parse(template.buttons_json) 
          : template.buttons_json;
      } catch (e) {
        console.error(e);
      }
    }
    setFormButtons(parsedButtons);
    setCurrentEditingId(null);
    setViewMode('create');
    showToast('Template configuration duplicated! Customize name to save.');
  };

  // Save template draft locally
  const handleSaveDraft = async () => {
    if (!formName || !formBodyContent) {
      showToast('Please fill in Template Name and Body Content', 'error');
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(formName)) {
      showToast('Template name must contain lowercase letters, numbers, and underscores only.', 'error');
      return;
    }

    setIsSubmittingForm(true);
    const payload = {
      template_name: formName,
      category: formCategory,
      language: formLanguage,
      header_type: formHeaderType,
      header_content: formHeaderContent,
      body_content: formBodyContent,
      footer_content: formFooterContent,
      buttons_json: formButtons
    };

    try {
      const url = currentEditingId 
        ? `${API_BASE_URL}/api/templates/${currentEditingId}` 
        : `${API_BASE_URL}/api/templates/create`;
      const method = currentEditingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Template draft saved successfully!');
        setViewMode('list');
        fetchTemplates();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving template draft', 'error');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Submit template to Meta WABA
  const handleSubmitToMeta = async () => {
    if (!formName || !formBodyContent) {
      showToast('Please fill in Template Name and Body Content', 'error');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(formName)) {
      showToast('Template name must contain lowercase letters, numbers, and underscores only.', 'error');
      return;
    }

    setIsSubmittingForm(true);
    const payload = {
      template_name: formName,
      category: formCategory,
      language: formLanguage,
      header_type: formHeaderType,
      header_content: formHeaderContent,
      body_content: formBodyContent,
      footer_content: formFooterContent,
      buttons_json: formButtons
    };

    try {
      // 1. First save draft locally
      const saveUrl = currentEditingId 
        ? `${API_BASE_URL}/api/templates/${currentEditingId}` 
        : `${API_BASE_URL}/api/templates/create`;
      const saveMethod = currentEditingId ? 'PUT' : 'POST';

      const saveRes = await fetch(saveUrl, {
        method: saveMethod,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        showToast(err.error || 'Failed to save draft locally first', 'error');
        setIsSubmittingForm(false);
        return;
      }

      const saveData = await saveRes.json();
      const templateId = currentEditingId || saveData.id;

      // 2. Submit to Meta API
      const submitRes = await fetch(`${API_BASE_URL}/api/templates/submit`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId })
      });

      const submitData = await submitRes.json();
      if (submitRes.ok) {
        showToast(
          submitData.status === 'APPROVED' 
            ? 'Template auto-approved successfully (Simulation mode)!' 
            : 'Template submitted to Meta. Awaiting review (PENDING).'
        );
        setViewMode('list');
        fetchTemplates();
      } else {
        showToast(submitData.error || 'Meta Cloud API rejected the template', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error submitting template to Meta', 'error');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Submit template directly from Listing row
  const handleDirectSubmit = async (templateId) => {
    try {
      showToast('Submitting template to Meta...', 'info');
      const res = await fetch(`${API_BASE_URL}/api/templates/submit`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.status === 'APPROVED' 
            ? 'Template auto-approved (Simulation mode)!' 
            : 'Submitted successfully. Status is now PENDING.'
        );
        fetchTemplates();
      } else {
        showToast(data.error || 'Meta API rejected submission', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to submit template', 'error');
    }
  };

  // AI Copilot generation request
  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingAi(true);
    setAiProgressText('🧠 Analysing campaign requirements...');
    
    try {
      setTimeout(() => setAiProgressText('✍️ Copywriting template text copy...'), 800);
      setTimeout(() => setAiProgressText('🔗 Formatting variables and call-to-actions...'), 1600);
      
      const res = await fetch(`${API_BASE_URL}/api/templates/generate-ai`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Pre-populate creation form fields
        setFormName(data.template_name || 'ai_generated_template');
        setFormCategory(data.category || 'MARKETING');
        setFormLanguage('en_US');
        setFormHeaderType(data.header_type || 'NONE');
        setFormHeaderContent(data.header_content || '');
        setFormBodyContent(data.body_content || '');
        setFormFooterContent(data.footer_content || '');
        setFormButtons(data.buttons_json || []);
        
        // Switch to editor
        setCurrentEditingId(null);
        setViewMode('create');
        setIsAiModalOpen(false);
        setAiPrompt('');
        showToast('AI template generated and loaded successfully!');
      } else {
        showToast(data.error || 'AI Helper was unable to format a template', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate template via AI', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Add variable in body textarea
  const handleAddVariable = () => {
    // Find how many {{number}} are currently in formBodyContent
    const matches = formBodyContent.match(/\{\{(\d+)\}\}/g) || [];
    const nextNum = matches.length + 1;
    setFormBodyContent(prev => prev + ` {{${nextNum}}}`);
  };

  // Button builder management
  const handleAddButton = () => {
    if (formButtons.length >= 3) {
      showToast('Meta Cloud API supports a maximum of 3 template buttons', 'warning');
      return;
    }
    setFormButtons([...formButtons, { type: 'QUICK_REPLY', text: 'Click Here', url: '', phone_number: '' }]);
  };

  const handleRemoveButton = (index) => {
    const updated = formButtons.filter((_, i) => i !== index);
    setFormButtons(updated);
  };

  const handleUpdateButton = (index, key, value) => {
    const updated = [...formButtons];
    updated[index][key] = value;
    setFormButtons(updated);
  };

  // Render variables in preview helper
  const getRenderedBody = () => {
    if (!formBodyContent) return 'Your message content will appear here...';
    
    let rendered = formBodyContent;
    // Extract variables {{1}}, {{2}} etc.
    const matches = formBodyContent.match(/\{\{(\d+)\}\}/g) || [];
    
    matches.forEach(match => {
      const varNum = match.replace(/[\{\}]/g, '');
      const userVal = previewVariables[varNum] || `[Variable ${varNum}]`;
      rendered = rendered.replace(match, `||VAR_${varNum}||${userVal}||ENDVAR||`);
    });

    const parts = rendered.split(/(\|\|VAR_\d+\|\|.*?\|\|ENDVAR\|\|)/);
    return parts.map((part, idx) => {
      if (part.startsWith('||VAR_')) {
        const cleanVal = part.replace(/\|\|VAR_\d+\|\|/, '').replace(/\|\|ENDVAR\|\|/, '');
        return (
          <span 
            key={idx} 
            style={{ 
              background: 'rgba(124, 58, 237, 0.15)', 
              color: 'var(--color-primary-dark)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontWeight: '600',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}
          >
            {cleanVal}
          </span>
        );
      }
      return part;
    });
  };

  // Helper stats variables
  const countStats = {
    APPROVED: templates.filter(t => t.status === 'APPROVED').length,
    PENDING: templates.filter(t => t.status === 'PENDING').length,
    DRAFT: templates.filter(t => t.status === 'DRAFT').length,
    REJECTED: templates.filter(t => t.status === 'REJECTED').length,
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh' }}>
      
      {/* Toast Alert */}
      {toast.message && (
        <div 
          className="glass animate-fade-in" 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '16px 24px',
            borderRadius: '12px',
            borderLeft: `4px solid ${toast.type === 'error' ? 'var(--color-danger)' : toast.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'}`,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'white',
            color: 'var(--color-text-main)',
            fontWeight: '600'
          }}
        >
          {toast.type === 'error' ? <AlertCircle className="text-danger" size={20} /> : <CheckCircle style={{ color: 'var(--color-primary)' }} size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* VIEW 1: TEMPLATE LISTING */}
      {viewMode === 'list' && (
        <div className="animate-fade-in">
          {/* Header Dashboard section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="flex items-center gap-2"><LayoutTemplate size={28} /> Message Templates</h1>
              <p className="text-muted text-sm mt-1">Create, preview, and synchronize WhatsApp templates directly with Meta Cloud API.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                className="btn-secondary flex items-center gap-2" 
                onClick={() => setIsAiModalOpen(true)}
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary-dark)' }}
              >
                <Sparkles size={18} /> AI Copilot
              </button>
              
              <button className="btn-primary flex items-center gap-2" onClick={handleOpenCreate}>
                <Plus size={18} /> Create Template
              </button>
            </div>
          </div>

          {/* Quick Statistics Row */}
          <div className="grid mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary-dark)', padding: '10px', borderRadius: '8px' }}>
                <CheckCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>{countStats.APPROVED}</div>
                <div className="text-muted text-xs font-bold uppercase tracking-wider">Approved Templates</div>
              </div>
            </div>
            <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', padding: '10px', borderRadius: '8px' }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>{countStats.PENDING}</div>
                <div className="text-muted text-xs font-bold uppercase tracking-wider">Awaiting Review</div>
              </div>
            </div>
            <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)', color: 'var(--color-text-muted)', padding: '10px', borderRadius: '8px' }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>{countStats.DRAFT}</div>
                <div className="text-muted text-xs font-bold uppercase tracking-wider">Local Drafts</div>
              </div>
            </div>
            <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)', padding: '10px', borderRadius: '8px' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>{countStats.REJECTED}</div>
                <div className="text-muted text-xs font-bold uppercase tracking-wider">Rejected by Meta</div>
              </div>
            </div>
          </div>

          {/* Filters & Control bar */}
          <div className="card mb-6" style={{ padding: '16px', borderRadius: '16px' }}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              
              {/* Status Tabs Navigation */}
              <div className="flex gap-2" style={{ backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', overflowX: 'auto' }}>
                {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      transition: 'all 0.2s',
                      backgroundColor: statusTab === tab ? 'white' : 'transparent',
                      color: statusTab === tab ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                      boxShadow: statusTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    {tab === 'ALL' ? 'All Templates' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Advanced Filters & Search */}
              <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    style={{
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      borderRadius: '10px',
                      margin: 0
                    }}
                  />
                  {searchQuery && (
                    <X 
                      size={14} 
                      onClick={() => { setSearchQuery(''); setTimeout(fetchTemplates, 0); }} 
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--color-text-light)' }} 
                    />
                  )}
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ width: '140px', padding: '8px 12px', borderRadius: '10px', margin: 0 }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>

                {/* Language Dropdown */}
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  style={{ width: '130px', padding: '8px 12px', borderRadius: '10px', margin: 0 }}
                >
                  <option value="ALL">All Languages</option>
                  <option value="en_US">English (US)</option>
                  <option value="hi_IN">Hindi (IN)</option>
                  <option value="es_ES">Spanish (ES)</option>
                  <option value="pt_BR">Portuguese (BR)</option>
                </select>

                {/* Sync Button */}
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{ padding: '8px 16px', borderRadius: '10px' }}
                >
                  {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Sync Status
                </button>
              </div>

            </div>
          </div>

          {/* Templates Grid Grid list */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: '260px', opacity: 0.6, animation: 'pulse 1.5s infinite' }}>
                  <div style={{ height: '20px', width: '40%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }} />
                  <div style={{ height: '32px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '100px', background: '#e2e8f0', borderRadius: '8px' }} />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="card text-center" style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LayoutTemplate size={48} style={{ color: 'var(--color-text-light)', marginBottom: '16px' }} />
              <h3>No templates found</h3>
              <p className="text-muted text-sm mt-1" style={{ maxWidth: '380px', margin: '0 auto' }}>
                There are no message templates matching your active filters. Click the button below to create one or generate it with AI.
              </p>
              <button className="btn-primary flex items-center gap-2 mt-6" onClick={handleOpenCreate}>
                <Plus size={16} /> Create Template
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {templates.map((template) => {
                let parsedButtons = [];
                if (template.buttons_json) {
                  try {
                    parsedButtons = typeof template.buttons_json === 'string' 
                      ? JSON.parse(template.buttons_json) 
                      : template.buttons_json;
                  } catch(e){}
                }

                return (
                  <div key={template.id} className="card flex flex-col group animate-slide-up" style={{ padding: '24px', minHeight: '280px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid var(--color-border-soft)' }}>
                    
                    {/* Top Row Badges & Statuses */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className="badge badge-primary">{template.category}</span>
                        <span className="badge badge-muted flex items-center gap-1"><Globe size={10} /> {template.language}</span>
                      </div>
                      
                      {/* Status indicator badge */}
                      {template.status === 'APPROVED' && <span className="badge badge-success flex items-center gap-1"><CheckCircle size={10} /> APPROVED</span>}
                      {template.status === 'PENDING' && <span className="badge badge-warning flex items-center gap-1"><Clock size={10} /> PENDING</span>}
                      {template.status === 'REJECTED' && <span className="badge badge-danger flex items-center gap-1"><AlertTriangle size={10} /> REJECTED</span>}
                      {template.status === 'DRAFT' && <span className="badge badge-muted flex items-center gap-1" style={{ backgroundColor: '#f1f5f9' }}><Info size={10} /> DRAFT</span>}
                      {!['APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].includes(template.status) && <span className="badge badge-muted">{template.status}</span>}
                    </div>

                    {/* Template Name */}
                    <h3 className="font-bold text-main mb-2 tracking-tight" style={{ fontSize: '16px', fontFamily: 'monospace', color: '#0f172a' }}>
                       {template.template_name}
                    </h3>

                    {/* Component Info Markers */}
                    <div className="flex gap-2 mb-3" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {template.header_type && template.header_type !== 'NONE' && (
                        <span style={{ backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          Header: {template.header_type}
                        </span>
                      )}
                      {parsedButtons.length > 0 && (
                        <span style={{ backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          Buttons: {parsedButtons.length}
                        </span>
                      )}
                    </div>

                    {/* Message Preview Body Content */}
                    <div style={{
                      backgroundColor: 'var(--color-background)',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      color: 'var(--color-text-main)',
                      border: '1px solid var(--color-border-soft)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      marginBottom: '16px'
                    }}>
                      {template.body_content}
                    </div>

                    {/* Action buttons (always visible / hover trigger) */}
                    <div className="flex justify-between items-center" style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border-soft)' }}>
                      
                      {/* Left actions: Submit if DRAFT */}
                      <div>
                        {template.status === 'DRAFT' ? (
                          <button 
                            onClick={() => handleDirectSubmit(template.id)}
                            className="flex items-center gap-1 text-xs font-bold"
                            style={{ color: 'var(--color-primary-dark)', cursor: 'pointer' }}
                            title="Submit to Meta Cloud WABA for Approval"
                          >
                            <Send size={14} /> Submit to Meta
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                            ID: {template.meta_template_id ? template.meta_template_id.substring(0, 10) + '...' : 'Local'}
                          </span>
                        )}
                      </div>

                      {/* Right actions: Edit, Copy, Delete */}
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDuplicate(template)} 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-text-muted)' }}
                          className="hover-bg-slate-100"
                          title="Duplicate/Copy"
                        >
                          <Copy size={14} />
                        </button>
                        
                        {(template.status === 'DRAFT' || template.status === 'REJECTED') ? (
                          <button 
                            onClick={() => handleOpenEdit(template)} 
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-text-muted)' }}
                            className="hover-bg-slate-100"
                            title="Edit Template"
                          >
                            <LayoutTemplate size={14} />
                          </button>
                        ) : (
                          <button 
                            disabled 
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-text-light)', cursor: 'not-allowed' }}
                            title="Approved/Pending templates cannot be edited. Duplicate instead."
                          >
                            <LayoutTemplate size={14} style={{ opacity: 0.5 }} />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDelete(template.id, template.template_name, template.meta_template_id)} 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-danger)' }}
                          className="hover-bg-danger-10"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TEMPLATE CREATION / EDIT WORKSPACE SPLIT VIEW */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Configuration Form */}
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            
            {/* Header section with back btn */}
            <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewMode('list')} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--color-text-main)' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                    {viewMode === 'create' ? 'Create WhatsApp Template' : 'Edit WhatsApp Template'}
                  </h2>
                  <p className="text-muted text-xs">Setup components to match Meta's structure.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSaveDraft}
                  disabled={isSubmittingForm}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitToMeta}
                  disabled={isSubmittingForm}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSubmittingForm ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit to Meta
                </button>
              </div>
            </div>

            {/* Template Information Form elements */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="label">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. order_delivery"
                  value={formName}
                  onChange={(e) => {
                    const cleanVal = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setFormName(cleanVal);
                  }}
                  disabled={viewMode === 'edit'}
                  style={{ fontFamily: 'monospace' }}
                  required
                />
                <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>
                  Lowercase, numbers, underscores only.
                </span>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{ height: '45px' }}
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div>
                <label className="label">Language</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  style={{ height: '45px' }}
                >
                  <option value="en_US">English (en_US)</option>
                  <option value="hi_IN">Hindi (hi_IN)</option>
                  <option value="es_ES">Spanish (es_ES)</option>
                  <option value="pt_BR">Portuguese (pt_BR)</option>
                  <option value="fr_FR">French (fr_FR)</option>
                  <option value="de_DE">German (de_DE)</option>
                </select>
              </div>
            </div>

            {/* 1. Header Builder */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-soft)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
                Template Header <span className="text-muted font-normal">(Optional)</span>
              </h3>
              
              <div className="grid" style={{ gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'start' }}>
                <select
                  value={formHeaderType}
                  onChange={(e) => {
                    setFormHeaderType(e.target.value);
                    setFormHeaderContent('');
                  }}
                  style={{ marginTop: 0 }}
                >
                  <option value="NONE">None</option>
                  <option value="TEXT">Text Header</option>
                  <option value="IMAGE">Image Media</option>
                  <option value="VIDEO">Video Media</option>
                  <option value="DOCUMENT">Document Media</option>
                </select>

                {formHeaderType === 'TEXT' && (
                  <div>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Welcome Deal!"
                      value={formHeaderContent}
                      onChange={(e) => setFormHeaderContent(e.target.value)}
                      style={{ marginTop: 0 }}
                    />
                    <div className="flex justify-between mt-1 text-[11px] text-muted">
                      <span>Bold header line at top. Supports 1 variable.</span>
                      <span>{formHeaderContent.length}/60</span>
                    </div>
                  </div>
                )}

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formHeaderType) && (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={formHeaderContent}
                      onChange={(e) => setFormHeaderContent(e.target.value)}
                      style={{ marginTop: 0 }}
                    />
                    <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>
                      Provide an sample URL of the media asset. This will render in preview.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Body Text Builder */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-soft)', marginBottom: '20px' }}>
              <div className="flex justify-between items-center mb-3">
                <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</span>
                  Template Body Message
                </h3>
                
                <button
                  type="button"
                  onClick={handleAddVariable}
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--color-primary-dark)',
                    backgroundColor: 'white',
                    border: '1px solid var(--color-border)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Variable
                </button>
              </div>

              <textarea
                rows={5}
                placeholder="Hi {{1}}, thank you for buying from our shop. Get {{2}}% off your next purchase using code {{3}}!"
                value={formBodyContent}
                onChange={(e) => setFormBodyContent(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />

              <div className="flex justify-between items-center mt-2 text-[11px] text-muted">
                <span>Variables must be structured as numeric tags like {'{{1}}'}, {'{{2}}'}, etc.</span>
                <span>{formBodyContent.length} characters</span>
              </div>
            </div>

            {/* 3. Footer Builder */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-soft)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</span>
                Template Footer <span className="text-muted font-normal">(Optional)</span>
              </h3>

              <div>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Reply STOP to opt out"
                  value={formFooterContent}
                  onChange={(e) => setFormFooterContent(e.target.value)}
                  style={{ marginTop: 0 }}
                />
                <div className="flex justify-between mt-1 text-[11px] text-muted">
                  <span>Small gray helper text at bottom of bubble.</span>
                  <span>{formFooterContent.length}/60</span>
                </div>
              </div>
            </div>

            {/* 4. Interactive Button Builder */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-soft)' }}>
              <div className="flex justify-between items-center mb-3">
                <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>4</span>
                  Template Interactive Buttons <span className="text-muted font-normal">(Optional)</span>
                </h3>
                
                {formButtons.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-dark)',
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Button
                  </button>
                )}
              </div>

              {formButtons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-light)', border: '1px dashed var(--color-border)', borderRadius: '8px', fontSize: '13px' }}>
                  No buttons added. You can add Quick Replies, Phone Numbers, or URL redirect links.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {formButtons.map((btn, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        background: 'white', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--color-border)',
                        position: 'relative'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(index)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          color: 'var(--color-danger)',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid" style={{ gridTemplateColumns: '150px 1fr', gap: '16px', alignItems: 'start' }}>
                        <div>
                          <label className="label">Button Type</label>
                          <select
                            value={btn.type}
                            onChange={(e) => handleUpdateButton(index, 'type', e.target.value)}
                            style={{ marginTop: 0 }}
                          >
                            <option value="QUICK_REPLY">Quick Reply</option>
                            <option value="PHONE_NUMBER">Call Phone Number</option>
                            <option value="URL">Open URL Link</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Button Label (Max 25 chars)</label>
                          <input
                            type="text"
                            maxLength={25}
                            placeholder="e.g. Shop Now"
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                            style={{ marginTop: 0 }}
                            required
                          />
                        </div>
                      </div>

                      {/* Additional CTA settings */}
                      {btn.type === 'PHONE_NUMBER' && (
                        <div style={{ marginTop: '12px' }}>
                          <label className="label">Phone Number (including Country Code, no + or spaces)</label>
                          <input
                            type="text"
                            placeholder="e.g. 919976893141"
                            value={btn.phone_number || ''}
                            onChange={(e) => handleUpdateButton(index, 'phone_number', e.target.value)}
                            style={{ marginTop: 0 }}
                            required
                          />
                        </div>
                      )}

                      {btn.type === 'URL' && (
                        <div style={{ marginTop: '12px' }}>
                          <label className="label">Redirect URL Link</label>
                          <input
                            type="text"
                            placeholder="e.g. https://infokart.in/shop or https://infokart.in/shop/{{1}}"
                            value={btn.url || ''}
                            onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                            style={{ marginTop: 0 }}
                            required
                          />
                          <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>
                            You can append the parameter tag suffix {'{{1}}'} to make the URL destination dynamic.
                          </span>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live Interactive Mobile Preview Pane */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div 
              style={{
                width: '320px',
                height: '630px',
                backgroundColor: '#0b141a', // Darker bezels/frame
                borderRadius: '44px',
                border: '14px solid #1e293b',
                boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto',
                position: 'relative'
              }}
            >
              {/* iPhone style speaker/camera notch */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  width: '120px', 
                  height: '22px', 
                  backgroundColor: '#1e293b', 
                  borderBottomLeftRadius: '14px', 
                  borderBottomRightRadius: '14px', 
                  zIndex: 20 
                }} 
              />

              {/* Phone Header Bar */}
              <div style={{ backgroundColor: '#075e54', padding: '32px 14px 10px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>IK</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>InfoKart Business</div>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>Official Business Account</div>
                </div>
              </div>

              {/* Chat Message Bubble Canvas */}
              <div 
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                  backgroundSize: 'cover',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start'
                }}
              >
                
                {/* Simulated Business Msg Bubble */}
                <div 
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    boxShadow: '0 1px 1.5px rgba(0,0,0,0.15)', 
                    position: 'relative', 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  
                  {/* Preview Media Header */}
                  {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formHeaderType) && (
                    <div style={{ width: '100%', height: '120px', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f1f5f9', overflow: 'hidden' }}>
                      {formHeaderType === 'IMAGE' && formHeaderContent.startsWith('http') ? (
                        <img src={formHeaderContent} alt="Header Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          {formHeaderType === 'IMAGE' && <Image style={{ color: 'var(--color-text-light)' }} size={24} />}
                          {formHeaderType === 'VIDEO' && <Video style={{ color: 'var(--color-text-light)' }} size={24} />}
                          {formHeaderType === 'DOCUMENT' && <FileText style={{ color: 'var(--color-text-light)' }} size={24} />}
                          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '6px', fontWeight: 'bold' }}>
                            {formHeaderType} PREVIEW
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bubble Content container */}
                  <div style={{ padding: '12px' }}>
                    
                    {/* Header text rendering */}
                    {formHeaderType === 'TEXT' && formHeaderContent && (
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
                        {formHeaderContent}
                      </div>
                    )}

                    {/* Body text rendering (Variables highlighted) */}
                    <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {getRenderedBody()}
                    </div>

                    {/* Footer text rendering */}
                    {formFooterContent && (
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                        {formFooterContent}
                      </div>
                    )}

                    {/* Time & status indicator tick */}
                    <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
                      10:45 AM
                    </div>

                  </div>

                  {/* Under-bubble CTA Buttons List */}
                  {formButtons.length > 0 && (
                    <div style={{ borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc' }}>
                      {formButtons.map((btn, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', 
                            padding: '10px', 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            color: 'var(--color-primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          {btn.type === 'PHONE_NUMBER' && <Phone size={12} />}
                          {btn.type === 'URL' && <ExternalLink size={12} />}
                          {btn.text || 'Button'}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Phone Footer Input Placeholder */}
              <div style={{ backgroundColor: '#f0f2f5', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1, backgroundColor: 'white', height: '28px', borderRadius: '14px' }} />
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#00a884' }} />
              </div>

            </div>

            {/* Preview Variables Inputs Panel */}
            {formBodyContent.match(/\{\{(\d+)\}\}/g) && (
              <div className="card mt-4" style={{ padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Test Preview Variables</h4>
                <div className="flex flex-col gap-2">
                  {(formBodyContent.match(/\{\{(\d+)\}\}/g) || []).map((match, i) => {
                    const num = match.replace(/[\{\}]/g, '');
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span style={{ fontSize: '11px', fontWeight: 'bold', width: '36px' }}>{`{{${num}}}`}</span>
                        <input
                          type="text"
                          placeholder={`Mock value for variable ${num}`}
                          value={previewVariables[num] || ''}
                          onChange={(e) => setPreviewVariables({ ...previewVariables, [num]: e.target.value })}
                          style={{ margin: 0, padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* VIEW 3: AI COPILOT GENERATOR POPUP DIALOG */}
      {isAiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="flex items-center gap-2"><Sparkles style={{ color: 'var(--color-primary)' }} /> AI Template Copilot</h2>
              <button onClick={() => setIsAiModalOpen(false)} className="text-muted"><X size={24} /></button>
            </div>

            {isGeneratingAi ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                <h3 className="font-semibold text-sm">{aiProgressText}</h3>
                <p className="text-muted text-xs mt-2">Gemini is designing your structured WhatsApp layout...</p>
              </div>
            ) : (
              <div>
                <p className="text-muted text-sm mb-4">
                  Describe what you want to achieve (e.g. sale, shipping alert, OTP verify). Gemini will generate the name, select category, write copy with placeholder tags, and build CTA buttons.
                </p>

                <div className="form-group">
                  <label className="label">Campaign Objective / Instruction</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. A utility shipping message. Greet the customer by name, mention their order is out for delivery, give their tracking link as a CTA url button and support line as quick reply."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    required
                  />
                </div>

                {/* Helpful Suggestions pills */}
                <div className="mb-6">
                  <label className="label" style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>Quick Templates Suggestions:</label>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: '6px' }}>
                    {[
                      'Summer sale: 15% discount for contact and link to store',
                      'Order status update: Tracking package URL tag',
                      'OTP Code security sign-in with quick copy link',
                      'Abandoned checkout reminder with discount coupon'
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAiPrompt(s)}
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#f1f5f9',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        className="hover:bg-slate-200"
                      >
                        {s.substring(0, 42) + '...'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAiModalOpen(false)}>Cancel</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={handleGenerateAiTemplate}
                    disabled={!aiPrompt.trim()}
                  >
                    <Sparkles size={16} /> Generate Layout
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Templates;
