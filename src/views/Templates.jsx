import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Trash2, Search, X } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'Marketing' });

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
          <div key={template.id} className="card flex-col" style={{ position: 'relative' }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>{template.category}</span>
                <h3 style={{ marginTop: '4px' }}>{template.name}</h3>
              </div>
              <button onClick={() => handleDelete(template.id)} className="text-muted" style={{ color: 'var(--color-danger)', opacity: 0.7 }}><Trash2 size={16} /></button>
            </div>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', flex: 1 }}>
              {template.content}
            </div>
          </div>
        ))}
      </div>
      {templates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
          No templates yet. Create your first one to get started!
        </div>
      )}
    </div>
  );
};

export default Templates;
