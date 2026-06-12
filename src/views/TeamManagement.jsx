import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Trash2, ShieldCheck, UserPlus, X, Loader2 } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';

const TeamManagement = () => {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'member' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMembers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewMember({ name: '', email: '', password: '', role: 'member' });
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this team member? They will lose all access immediately.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchMembers();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="flex items-center gap-3"><ShieldCheck size={32} className="text-primary" /> Team Infrastructure</h1>
          <p className="text-muted text-sm mt-1">Manage permissions and access for your organization</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /> Invite Member
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridGap: '24px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="group">
                  <td>
                    <div className="flex items-center gap-4">
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-main">{member.name}</div>
                        <div className="text-xs text-muted">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {currentUser?.role === 'admin' && currentUser?.id !== member.id && (
                      <button 
                        onClick={() => handleRemove(member.id)}
                        className="group-hover-visible hover-bg-danger-10"
                        style={{ padding: '8px', color: 'var(--color-text-muted)', borderRadius: '8px' }}
                      >
                        <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-xl">Invite Team Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddMember} className="flex flex-col gap-6">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Work Email</label>
                <input 
                  type="email" 
                  placeholder="john@company.com" 
                  value={newMember.email}
                  onChange={e => setNewMember({...newMember, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Initial Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newMember.password}
                  onChange={e => setNewMember({...newMember, password: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Permission Role</label>
                <select 
                  value={newMember.role}
                  onChange={e => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="member">Team Member (Viewer/Agent)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                  Add to Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
