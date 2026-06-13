import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, ClipboardCheck, Sparkles, RefreshCw, FileText, Link, MessageSquare, HelpCircle } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const KnowledgeBase = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newItem, setNewItem] = useState({
    source_type: 'faq',
    title: '',
    content: ''
  });

  const fetchKB = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKB();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.content.trim()) return;
    
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        setNewItem({ source_type: 'faq', title: '', content: '' });
        fetchKB();
        alert("Knowledge added successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding training knowledge.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this training document? The AI Agent will lose access to this context.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchKB();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSourceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'url': return <Link size={14} className="text-blue-500" />;
      case 'faq': return <MessageSquare size={14} className="text-purple-500" />;
      default: return <FileText size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="text-purple-600" size={24} /> Central Knowledge Base
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Feed facts, documents, FAQs and business details to your permanent WhatsApp AI Employee.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form to Add Knowledge */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAdd} className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-purple-600" /> Add Knowledge Document
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Upload raw information to train your AI Agent.</p>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Type</label>
              <select
                value={newItem.source_type}
                onChange={e => setNewItem({ ...newItem, source_type: e.target.value })}
                style={{ height: '38px', marginTop: 0 }}
              >
                <option value="faq">FAQ (Q&A Pairs)</option>
                <option value="url">Website URL</option>
                <option value="text">Raw Guidelines / Text</option>
              </select>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Return Policy FAQ"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                style={{ height: '38px', marginTop: 0 }}
                required
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Content</label>
              <textarea
                rows={6}
                placeholder="Write business rules, website text copy, or FAQ answers here..."
                value={newItem.content}
                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                style={{ marginTop: 0, padding: '12px 14px' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={adding || !newItem.content.trim()}
              className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border-none mt-2"
            >
              <ClipboardCheck size={14} /> {adding ? 'Training AI...' : 'Train AI Agent'}
            </button>
          </form>
        </div>

        {/* Right Column: List of Knowledge Documents */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 font-medium bg-white rounded-[24px] border border-slate-100">
              <RefreshCw className="animate-spin text-purple-600 mr-2" size={18} />
              Loading business knowledge entries...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic text-xs font-medium bg-white rounded-[24px] border border-slate-100 flex flex-col items-center justify-center gap-3">
              <HelpCircle size={32} className="text-slate-300" />
              <span>No knowledge base training sets added yet. Feed guidelines on the left to start.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="card bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" style={{ minHeight: '190px' }}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[80%]">{item.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 flex items-center gap-1">
                        {getSourceIcon(item.source_type)} {item.source_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4 overflow-hidden text-ellipsis line-clamp-4">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-50">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default KnowledgeBase;
