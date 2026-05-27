import React, { useState, useEffect } from 'react';
import { ClipboardList, User, Shield, Zap, Search, Download, Clock } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const SystemAudit = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`, { headers: getAuthHeaders() });
      const data = await res.json();
      setLogs(data);
    } catch (e) { console.error(e); }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="flex items-center gap-3"><ClipboardList size={32} className="text-primary" /> System Audit Logs</h1>
          <p className="text-muted text-sm mt-1">Immutable record of all administrative actions in your organization</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
          <Download size={18} /> Export PDF Report
        </button>
      </div>

      <div className="card mb-6 flex items-center gap-4 py-4 px-6">
        <Search size={20} className="text-muted" />
        <input 
          type="text" 
          placeholder="Filter by action or team member..." 
          className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full text-left">
          <thead className="bg-surface-soft border-b border-border-soft">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted">Timestamp</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted">User</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted">Action</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-border-soft hover:bg-background transition-colors">
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted">
                    <Clock size={12} />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-soft text-primary flex items-center justify-center font-bold text-xs">
                      {log.user_name?.charAt(0) || 'S'}
                    </div>
                    <span className="font-bold text-sm">{log.user_name || 'System'}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${
                    log.action === 'LOGIN' ? 'bg-success/10 text-success' : 
                    log.action === 'SEND_CAMPAIGN' ? 'bg-primary/10 text-primary' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <code className="text-xs text-muted font-mono bg-surface-soft px-2 py-1 rounded">
                    {log.details}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemAudit;
