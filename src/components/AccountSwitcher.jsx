import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { ChevronDown, MessageCircle, Check, Plus } from 'lucide-react';

const AccountSwitcher = () => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/accounts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
        setActiveAccount(data.find(a => a.is_active));
      } else {
        setAccounts([]);
        setActiveAccount(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSwitch = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/whatsapp/switch-account`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      });
      fetchAccounts();
      setIsOpen(false);
      window.location.reload(); // Reload to refresh all context with new active account
    } catch (e) { console.error(e); }
  };

  if (accounts.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn-secondary flex items-center gap-3 px-4 py-2 border-primary/20 bg-primary/5" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderRadius: '12px' }}
      >
        <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageCircle size={14} />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none mb-1">Active Line</div>
          <div className="text-xs font-bold leading-none">{activeAccount?.nickname || activeAccount?.display_phone_number || 'Main Account'}</div>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setIsOpen(false)} />
          <div className="card shadow-2xl animate-fade-in" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, width: '240px', padding: '12px', zIndex: 101 }}>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest px-3 py-2 mb-2 border-b border-border-soft">Switch WhatsApp Line</div>
            <div className="flex flex-col gap-1">
              {accounts.map(acc => (
                <button 
                  key={acc.id} 
                  className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all text-left ${acc.is_active ? 'bg-primary-light text-primary' : 'hover:bg-surface-soft text-main'}`}
                  onClick={() => handleSwitch(acc.id)}
                >
                  <div className="min-width-0">
                    <div className="text-sm font-bold truncate">{acc.nickname || 'General Line'}</div>
                    <div className="text-[10px] opacity-70 truncate">{acc.display_phone_number}</div>
                  </div>
                  {acc.is_active && <Check size={16} />}
                </button>
              ))}
            </div>
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-xs font-bold text-primary border-t border-dashed border-primary/20 pt-4 hover:bg-primary/5 transition-all rounded-xl">
              <Plus size={14} /> Add New Number
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSwitcher;
