import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Trash2, Search, X, Smartphone, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'Marketing' });
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isImproving, setIsImproving] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTemplate({ name: '', content: '', category: 'Marketing' });
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImproveContent = async (template) => {
    setIsImproving(true);
    try {
      const prompt = `Improve this WhatsApp marketing template to be more engaging and high-converting. Keep the {{name}} placeholder if present. 
      Template Name: ${template.name}
      Current Content: ${template.content}
      Improved Content:`;
      
      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (window.confirm(`AI Suggestion:\n\n${data.response}\n\nWould you like to apply this?`)) {
        await fetch(`${API_BASE_URL}/api/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...template, content: data.response })
        });
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-2"><LayoutTemplate size={28} /> Message Templates</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Template
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2>Create Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="label">Template Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Welcome Message" 
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Utility">Utility</option>
                  <option value="Authentication">Authentication</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Message Content</label>
                <textarea 
                  rows="5"
                  placeholder="Hey {{name}}! Welcome to our store..." 
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
                />
                <span className="text-muted" style={{ fontSize: '12px' }}>Use {'{{name}}'} for dynamic placeholder.</span>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {templates.map((template) => (
          <div key={template.id} className="card flex-col group" style={{ position: 'relative', border: '1px solid var(--color-border-soft)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="badge badge-primary mb-2" style={{ textTransform: 'uppercase' }}>{template.category}</span>
                <h3 className="text-main font-black">{template.name}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewTemplate(template)} className="p-2 text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-all" title="Mobile Preview">
                  <Smartphone size={18} />
                </button>
                <button onClick={() => handleImproveContent(template)} className="p-2 text-muted hover:text-success hover:bg-success/10 rounded-lg transition-all" title="Improve with AI" disabled={isImproving}>
                  {isImproving ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '20px', borderRadius: '16px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1, color: 'var(--color-text-main)', border: '1px solid var(--color-border-soft)' }}>
              {template.content}
            </div>
            <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
               <span className="text-[10px] font-black text-muted uppercase tracking-widest">Modified recently</span>
               <button className="text-xs font-black text-primary uppercase tracking-tighter" onClick={() => navigate('/campaigns/create')}>Use in Campaign</button>
            </div>
          </div>
        ))}
      </div>

      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: 0, backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }} onClick={e => e.stopPropagation()}>
             <div style={{ 
               width: '320px', 
               height: '640px', 
               backgroundColor: '#e5ddd5', 
               borderRadius: '40px', 
               border: '12px solid #333', 
               margin: '0 auto',
               position: 'relative',
               overflow: 'hidden',
               display: 'flex',
               flexDirection: 'column'
             }}>
               {/* Phone Header */}
               <div style={{ backgroundColor: '#075e54', padding: '40px 16px 12px', color: 'white' }}>
                 <div className="flex items-center gap-3">
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                   <div className="font-bold text-sm">InfoKart Business</div>
                 </div>
               </div>
               
               {/* Chat Area */}
               <div style={{ flex: 1, padding: '20px', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}>
                 <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', position: 'relative', maxWidth: '85%', fontSize: '13px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                   {previewTemplate.content.replace(/\{\{name\}\}/g, 'Karthik')}
                   <div style={{ fontSize: '10px', color: '#999', textAlign: 'right', marginTop: '4px' }}>10:45 AM</div>
                   {/* Bubble tail */}
                   <div style={{ position: 'absolute', left: '-8px', top: 0, width: 0, height: 0, borderTop: '8px solid white', borderLeft: '8px solid transparent' }} />
                 </div>
               </div>

               {/* Footer */}
               <div style={{ backgroundColor: '#f0f0f0', padding: '12px', display: 'flex', gap: '8px' }}>
                 <div style={{ flex: 1, backgroundColor: 'white', height: '32px', borderRadius: '20px' }} />
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#00a884' }} />
               </div>
             </div>
             <p className="text-center text-white mt-6 font-bold">Mobile Preview</p>
          </div>
        </div>
      )}
      {templates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
          No templates yet. Create your first one to get started!
        </div>
      )}
    </div>
  );
};

export default Templates;
