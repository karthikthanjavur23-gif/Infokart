import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Upload, Filter, Search, Plus, X, CheckSquare, Square, 
  Trash2, Mail, Phone, Calendar, Tag, FileText, ChevronRight, Save, Eye, Layers, Grid, List, Sparkles, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone_number: '', tags: '', email: '', notes: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode switcher: table, card, kanban
  const [viewMode, setViewMode] = useState('table'); 
  
  // Segment Filter Tabs
  const [activeSegment, setActiveSegment] = useState('ALL'); // ALL, Lead, VIP, Customer
  
  // Selected Contact for Side Drawer
  const [selectedContact, setSelectedContact] = useState(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch contacts from local DB
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.phone_number) {
      alert("Phone number is required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewContact({ name: '', phone_number: '', tags: '', email: '', notes: '' });
        fetchContacts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inline update contact details via side drawer
  const handleUpdateContactDetails = async () => {
    if (!selectedContact) return;
    setIsSavingContact(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedContact.name,
          email: selectedContact.email,
          tags: selectedContact.tags,
          notes: selectedContact.notes,
          phone_number: selectedContact.phone_number
        })
      });
      if (res.ok) {
        alert("Contact updated successfully!");
        fetchContacts();
      } else {
        alert("Failed to update contact.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setSelectedContact(null);
        fetchContacts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const contactsToImport = [];
      for (let i = 1; i < lines.length; i++) { // Skip header
        const columns = lines[i].split(',').map(s => s?.trim());
        const name = columns[0];
        const phone_number = columns[1];
        const tags = columns[2];
        const email = columns[3] || '';
        const notes = columns[4] || '';
        
        if (phone_number) {
          contactsToImport.push({ name, phone_number, tags, email, notes });
        }
      }

      if (contactsToImport.length > 0) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/contacts/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ contacts: contactsToImport })
          });
          if (res.ok) {
            fetchContacts();
            alert(`Imported ${contactsToImport.length} contacts successfully!`);
          } else {
            alert("Bulk import failed.");
          }
        } catch (e) {
          console.error(e);
          alert("Error during bulk import.");
        }
      }
    };
    reader.readAsText(file);
  };

  // Filter contacts by search query & segment selection
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeSegment !== 'ALL') {
      const tagsList = (c.tags || '').toLowerCase().split(',').map(t => t.trim());
      if (!tagsList.includes(activeSegment.toLowerCase())) return false;
    }

    return true;
  });

  // Helper for generating deterministic values
  const getEngagementScore = (id) => (id * 17) % 41 + 60; // range 60-100
  const getLeadScore = (id) => (id * 13) % 35 + 65; // range 65-99
  
  const getAiSummary = (tags = '') => {
    const lower = tags.toLowerCase();
    if (lower.includes('vip')) return "VIP Customer. Fast response rate, interested in luxury loyalty rewards.";
    if (lower.includes('lead')) return "Promising lead. Responded to summer catalog, pending demo call.";
    return "Regular customer. Interacted with bot, average campaign read rate.";
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CRM Contacts</h1>
          <p className="text-slate-500 text-xs mt-1">Manage customer profiles, segmentation logs, and bulk notifications</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
            style={{ display: 'none' }} 
            accept=".csv"
          />
          <button 
            className="btn-secondary flex-1 sm:flex-initial flex items-center gap-2 hover:bg-slate-50 border-slate-200"
            onClick={() => fileInputRef.current.click()}
          >
            <Upload size={14} /> Import CSV
          </button>
          <button 
            className="btn-primary flex-1 sm:flex-initial flex items-center gap-2 hover:bg-[#6d28d9] transition"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Segment tabs & Filter bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-slate-100 pb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-start">
          {[
            { id: 'ALL', label: 'All Contacts' },
            { id: 'Lead', label: 'Leads' },
            { id: 'VIP', label: 'VIP Clients' },
            { id: 'Customer', label: 'Customers' }
          ].map(seg => (
            <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                activeSegment === seg.id 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Layout Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => setViewMode('card')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Card View"
            >
              <Grid size={14} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Kanban View"
            >
              <Layers size={14} />
            </button>
          </div>

          <div className="relative w-full sm:w-[240px]">
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border-slate-200 rounded-xl bg-white w-full"
              style={{ height: '38px', marginTop: 0 }}
            />
          </div>
        </div>
      </div>

      {/* CRM Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
        
        <div className="flex-1 w-full overflow-x-auto">
          {/* 1. TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="card bg-white border border-slate-100 rounded-[24px] p-0 overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 w-12 text-center">
                      <button 
                        onClick={() => {
                          if (selectedIds.length === filteredContacts.length) setSelectedIds([]);
                          else setSelectedIds(filteredContacts.map(c => c.id));
                        }}
                        className="text-slate-400 hover:text-[#7c3aed]"
                      >
                        {selectedIds.length === filteredContacts.length && filteredContacts.length > 0 ? (
                          <CheckSquare size={16} className="text-[#7c3aed]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="p-4 font-bold text-slate-500">Contact Name</th>
                    <th className="p-4 font-bold text-slate-500">WhatsApp Line</th>
                    <th className="p-4 font-bold text-slate-500">Segment Tags</th>
                    <th className="p-4 font-bold text-slate-500">Lead Score</th>
                    <th className="p-4 font-bold text-slate-500">Created At</th>
                    <th className="p-4 font-bold text-slate-500 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const isDrawerSelected = selectedContact?.id === c.id;
                    const leadScore = getLeadScore(c.id);
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedContact(c)}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer ${
                          isSelected ? 'bg-purple-50/20' : isDrawerSelected ? 'bg-purple-50/10' : ''
                        }`}
                      >
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              if (isSelected) setSelectedIds(selectedIds.filter(id => id !== c.id));
                              else setSelectedIds([...selectedIds, c.id]);
                            }}
                            className="text-slate-400 hover:text-[#7c3aed]"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-[#7c3aed]" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-bold text-xs">
                              {c.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{c.name || 'Anonymous'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{c.email || 'No email logged'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">{c.phone_number}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {c.tags?.split(',').filter(t => t.trim() !== '').map(t => (
                              <span 
                                key={t} 
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[#7c3aed]"
                              >
                                {t.trim()}
                              </span>
                            ))}
                            {(!c.tags || c.tags.trim() === '') && (
                              <span className="text-[10px] text-slate-400 italic">No tags</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            leadScore > 85 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {leadScore}%
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-medium">
                          {new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-[#7c3aed] rounded-lg hover:bg-slate-100 transition"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-16 text-center text-slate-400 italic font-medium">
                        No contacts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. CARD VIEW */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
              {filteredContacts.map(c => {
                const leadScore = getLeadScore(c.id);
                const isSelected = selectedContact?.id === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedContact(c)}
                    className={`card bg-white border rounded-[24px] p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected ? 'border-purple-300 ring-4 ring-purple-50' : 'border-slate-100'
                    }`}
                    style={{ minHeight: '190px' }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-extrabold text-sm">
                            {c.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{c.name || 'Anonymous'}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{c.phone_number}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-purple-50 border border-purple-100 text-[#7c3aed] px-2 py-0.5 rounded-lg">
                          Score: {leadScore}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mb-3 italic">
                        "{getAiSummary(c.tags)}"
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.tags?.split(',').filter(t => t.trim() !== '').map(t => (
                        <span 
                          key={t} 
                          className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500"
                        >
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredContacts.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 italic font-medium bg-white rounded-[24px] border border-slate-100">
                  No contacts found.
                </div>
              )}
            </div>
          )}

          {/* 3. KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in items-start">
              {[
                { id: 'Lead', label: 'Leads', color: '#8b5cf6' },
                { id: 'Qualified', label: 'Qualified', color: '#7c3aed' },
                { id: 'Customer', label: 'Customers', color: '#10b981' },
                { id: 'VIP', label: 'VIP Clients', color: '#f59e0b' }
              ].map(column => {
                const colContacts = filteredContacts.filter(c => {
                  const tagsList = (c.tags || '').toLowerCase().split(',').map(t => t.trim());
                  if (column.id === 'Qualified') {
                    // fall back columns for contacts that aren't Leads, Customers, or VIP
                    return !tagsList.includes('lead') && !tagsList.includes('customer') && !tagsList.includes('vip');
                  }
                  return tagsList.includes(column.id.toLowerCase());
                });

                return (
                  <div key={column.id} className="bg-slate-50/50 p-4 rounded-[20px] border border-slate-100 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex justify-between items-center px-1 mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                        {column.label}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {colContacts.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {colContacts.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => setSelectedContact(c)}
                          className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="font-bold text-xs text-slate-800 mb-1">{c.name || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-400 font-medium mb-2">{c.phone_number}</div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">
                              Score: {getLeadScore(c.id)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {colContacts.length === 0 && (
                        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold border-dashed border border-slate-200 rounded-xl">
                          Drop/assign here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic CRM Profile Side Drawer */}
        {selectedContact && (
          <div className="card bg-white border border-slate-100 rounded-[24px] p-6 shadow-md w-full lg:w-[340px] sticky top-6 animate-slide-up flex flex-col gap-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={12} /> Contact Profile Intelligence
              </span>
              <button 
                onClick={() => setSelectedContact(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-extrabold text-lg">
                  {selectedContact.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{selectedContact.name || 'Anonymous Contact'}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold truncate">{selectedContact.phone_number}</p>
                </div>
              </div>

              {/* CRM Scoring Meter */}
              <div className="bg-purple-50/30 border border-purple-100/40 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={11} className="text-[#7c3aed]" /> Engagement Score
                  </span>
                  <span className="text-xs font-bold text-[#7c3aed]">{getEngagementScore(selectedContact.id)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed]" style={{ width: `${getEngagementScore(selectedContact.id)}%` }} />
                </div>
              </div>

              {/* AI profile summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-[#7c3aed] tracking-wider flex items-center gap-1 mb-1.5">
                  <Sparkles size={10} /> Copilot AI Summary
                </span>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {getAiSummary(selectedContact.tags)}
                </p>
              </div>

              {/* Editing fields */}
              <div className="form-group flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  className="w-input text-xs" 
                  value={selectedContact.name || ''}
                  onChange={e => setSelectedContact({ ...selectedContact, name: e.target.value })}
                  style={{ height: '40px', marginTop: 0 }}
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  className="w-input text-xs" 
                  value={selectedContact.email || ''}
                  onChange={e => setSelectedContact({ ...selectedContact, email: e.target.value })}
                  style={{ height: '40px', marginTop: 0 }}
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segmentation Tags</label>
                <input 
                  type="text" 
                  className="w-input text-xs" 
                  value={selectedContact.tags || ''}
                  onChange={e => setSelectedContact({ ...selectedContact, tags: e.target.value })}
                  style={{ height: '40px', marginTop: 0 }}
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Notes</label>
                <textarea 
                  rows={3}
                  className="w-textarea text-xs" 
                  value={selectedContact.notes || ''}
                  onChange={e => setSelectedContact({ ...selectedContact, notes: e.target.value })}
                  style={{ marginTop: 0, padding: '12px 14px' }}
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  className="flex-1 py-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
                >
                  Delete Profile
                </button>
                <button 
                  onClick={handleUpdateContactDetails}
                  disabled={isSavingContact}
                  className="flex-1 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> {isSavingContact ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-6 left-0 right-0 p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex justify-between items-center z-10 animate-slide-up">
          <div className="text-xs font-semibold">
            <strong>{selectedIds.length}</strong> contacts selected for campaigns
          </div>
          <div className="flex gap-3">
            <button 
              className="text-xs px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
            <button 
              className="text-xs px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg"
              onClick={() => navigate('/campaigns/create', { state: { selectedIds } })}
            >
              Start Bulk Campaign
            </button>
          </div>
        </div>
      )}

      {/* Add Contact Dialog Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Add New CRM Profile</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  value={newContact.name}
                  onChange={e => setNewContact({...newContact, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">WhatsApp Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 15551234567" 
                  value={newContact.phone_number}
                  onChange={e => setNewContact({...newContact, phone_number: e.target.value})}
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1.5">Include country code, no + or spaces</span>
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. john@example.com" 
                  value={newContact.email}
                  onChange={e => setNewContact({...newContact, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">CRM Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lead, VIP" 
                  value={newContact.tags}
                  onChange={e => setNewContact({...newContact, tags: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Activity Notes</label>
                <textarea 
                  rows={3} 
                  placeholder="Enter notes about contact requirements..."
                  value={newContact.notes}
                  onChange={e => setNewContact({...newContact, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  className="btn-secondary flex-1" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1" 
                  style={{ border: 'none' }}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
