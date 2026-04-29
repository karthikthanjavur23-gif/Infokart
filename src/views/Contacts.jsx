import React, { useState, useEffect, useRef } from 'react';
import { Users, Upload, Filter, Search, Plus, X, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone_number: '', tags: '' });
  const fileInputRef = useRef(null);

  // Fetch contacts from local DB
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`);
      const data = await res.json();
      setContacts(data);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewContact({ name: '', phone_number: '', tags: '' });
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
      // Expecting CSV format: Name, PhoneNumber, Tags
      const contactsToImport = [];
      for (let i = 1; i < lines.length; i++) { // Skip header
        const columns = lines[i].split(',').map(s => s?.trim());
        const name = columns[0];
        const phone_number = columns[1];
        const tags = columns[2];
        
        if (phone_number) {
          contactsToImport.push({ name, phone_number, tags });
        }
      }

      if (contactsToImport.length > 0) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/contacts/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-2"><Users size={28} style={{ color: 'var(--color-primary)' }} /> Contact Management</h1>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
            style={{ display: 'none' }} 
            accept=".csv"
          />
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => fileInputRef.current.click()}
          >
            <Upload size={18} /> Import CSV
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} /> Add Contact
          </button>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2>Add New Contact</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted"
                style={{ padding: '4px' }}
              >
                <X size={24} />
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
                <span className="text-muted" style={{ fontSize: '11px' }}>Include country code, no + or spaces</span>
              </div>
              <div className="form-group">
                <label className="label">Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lead, VIP" 
                  value={newContact.tags}
                  onChange={e => setNewContact({...newContact, tags: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1 }}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card mb-6 flex justify-between items-center" style={{ padding: '16px 24px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name or number..." 
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
          />
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary flex items-center gap-2"><Filter size={18} /> Filter Tags</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', width: '50px' }}>
                <div 
                  style={{ cursor: 'pointer', color: selectedIds.length === contacts.length && contacts.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                  onClick={() => {
                    if (selectedIds.length === contacts.length) setSelectedIds([]);
                    else setSelectedIds(contacts.map(c => c.id));
                  }}
                >
                  {selectedIds.length === contacts.length && contacts.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              </th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-muted)' }}>WhatsApp Number</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tags</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Added Date</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: selectedIds.includes(c.id) ? 'var(--color-primary-light)' : 'transparent' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div 
                    style={{ cursor: 'pointer', color: selectedIds.includes(c.id) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                    onClick={() => {
                      if (selectedIds.includes(c.id)) setSelectedIds(selectedIds.filter(id => id !== c.id));
                      else setSelectedIds([...selectedIds, c.id]);
                    }}
                  >
                    {selectedIds.includes(c.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '16px 24px' }}>{c.phone_number}</td>
                <td style={{ padding: '16px 24px' }}>
                  {c.tags?.split(',').filter(t => t.trim() !== '').map(t => (
                    <span key={t} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', marginRight: '8px' }}>
                      {t.trim()}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No contacts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedIds.length > 0 && (
        <div style={{ position: 'sticky', bottom: '24px', left: '0', right: '0', padding: '16px 24px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, marginTop: '24px' }}>
          <div><strong>{selectedIds.length}</strong> contacts selected</div>
          <div className="flex gap-3">
             <button className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={() => setSelectedIds([])}>Clear Selection</button>
             <button 
               className="btn-primary" 
               style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}
               onClick={() => navigate('/campaigns/create', { state: { selectedIds } })}
             >
               Start Bulk Campaign
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contacts;
