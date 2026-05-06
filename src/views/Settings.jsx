import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, MessageSquare, Bell, User, Plus, Check, ExternalLink, Globe, Smartphone } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('integration');
  const [wsStatus, setWsStatus] = useState({ connected: false, details: null });
  const [metaConfig, setMetaConfig] = useState({ appId: '', configId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initFB = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whatsapp/init-config`);
        const config = await res.json();
        setMetaConfig(config);

        window.fbAsyncInit = function() {
          window.FB.init({
            appId: config.appId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v22.0'
          });
        };

        const loadSDK = (d, s, id) => {
          let js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://connect.facebook.net/en_US/sdk.js";
          fjs.parentNode.insertBefore(js, fjs);
        };
        loadSDK(document, 'script', 'facebook-jssdk');
      } catch (e) {
        console.error("Failed to load Meta config");
      }
    };

    initFB();
    fetchStatus();

    // Handle return from manual redirect flow
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      // Clear the code from the URL for a clean state
      const redirectUri = (window.location.origin + window.location.pathname).replace(/\/$/, "");
      window.history.replaceState({}, document.title, redirectUri);
      console.log("[DEBUG] Completing signup with redirectUri:", redirectUri);
      completeSignup(code, redirectUri);
    }
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
      if (!res.ok) throw new Error("Server out of sync");
      const data = await res.json();
      setWsStatus(data);
    } catch (e) {
      console.error("Failed to fetch WhatsApp status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSignup = () => {
    if (!metaConfig.appId || !metaConfig.configId) {
      return alert("Meta App credentials are missing in your .env file. Please provide them to continue.");
    }

    // Launch using the official Meta JS SDK (required for Business Login)
    window.FB.login((response) => {
      if (response.authResponse) {
        // The SDK returns the 'code' inside the authResponse if using the Business Login flow
        const code = response.authResponse.code;
        if (code) {
          console.log("[DEBUG] SDK login successful, code received");
          completeSignup(code, redirectUri);
        } else {
          console.error("[ERROR] SDK login succeeded but no code was returned. Ensure config_id is correct.");
        }
      } else {
        console.log("[INFO] User cancelled login or did not fully authorize.");
      }
    }, {
      config_id: metaConfig.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        feature: "whatsapp_embedded_signup",
        sessionInfoVersion: 3,
        setup: {}
      }
    });
  };

  const completeSignup = async (code, manualRedirectUri) => {
    try {
      const redirectUri = manualRedirectUri || (window.location.origin + window.location.pathname);
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/embedded-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri })
      });
      if (!res.ok) throw new Error("Signup failed");
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        alert(data.error || "Failed to complete signup.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during signup.");
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect WhatsApp? This will stop all automation and campaigns.")) return;
    try {
      await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, { method: 'POST' });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: 'integration', label: 'Meta Integrations', icon: Globe },
    { id: 'profile', label: 'Business Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="mb-1">Settings</h1>
          <p className="text-muted">Manage your connected accounts and application preferences.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px' }}>
        {/* Sidebar Tabs */}
        <div className="flex flex-col gap-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'hover:bg-slate-50 text-muted hover:text-main'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          
          <div className="mt-12 p-8 rounded-[32px] bg-slate-50 border border-slate-100">
            <h4 className="text-sm font-black mb-3 italic">Need Help?</h4>
            <p className="text-[11px] text-muted leading-relaxed mb-4">Check our developer documentation for API limits and integration guides.</p>
            <button className="text-primary text-[11px] font-bold flex items-center gap-2">Read Docs <ExternalLink size={12} /></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="card" style={{ minHeight: '600px', padding: 'var(--space-xl)' }}>
          {activeTab === 'integration' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="mb-2 text-2xl font-black">WhatsApp Business API</h2>
                  <p className="text-muted text-sm max-w-lg leading-relaxed">Connect your official Meta WhatsApp Business Account to enable bulk campaigns, auto-replies, and a shared team inbox.</p>
                </div>
                {wsStatus.connected && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-black tracking-widest ring-1 ring-success/20">
                    <Check size={14} /> CONNECTED
                  </div>
                )}
              </div>

              <div style={{ padding: '48px', borderRadius: '32px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border-soft)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '120px', height: '120px', backgroundColor: 'var(--color-primary)', opacity: 0.03, borderRadius: '50%' }} />
                
                <div className="flex items-start gap-8 relative z-10">
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '28px', 
                    backgroundColor: '#1877f2', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white',
                    boxShadow: '0 20px 40px -12px rgba(24, 119, 242, 0.4)'
                  }}>
                    <Smartphone size={40} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 mt-1">
                      <div className="font-black text-xl text-main">
                        {wsStatus.connected ? (wsStatus.details?.verified_name || 'Official WhatsApp API') : 'Meta Cloud API V22.0'}
                      </div>
                    </div>
                    <p className="text-muted text-sm mb-8 italic">
                      {wsStatus.connected 
                        ? 'Successfully connected to official Meta infrastructure.'
                        : 'Direct integration with official WhatsApp infrastructure.'}
                    </p>

                    {wsStatus.connected ? (
                      <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 animate-slide-up">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                          <div>
                            <div className="text-[10px] font-black text-muted mb-2 uppercase tracking-widest">Display Phone</div>
                            <div className="font-bold text-lg text-main">{wsStatus.details?.display_phone_number}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-muted mb-2 uppercase tracking-widest">Account ID</div>
                            <div className="font-mono text-xs bg-slate-50 px-2 py-1 rounded truncate">
                              {wsStatus.details?.phone_number_id}
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn-secondary w-full py-3 text-xs font-black tracking-widest uppercase hover:bg-danger/5 hover:text-danger hover:border-danger/20 transition-all font-bold" 
                          onClick={handleDisconnect}
                        >
                          Terminate Integration
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-10 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all font-bold" 
                        style={{ backgroundColor: '#1877f2', border: 'none', fontSize: '15px' }}
                        onClick={handleLaunchSignup}
                      >
                        {(!metaConfig.appId || !metaConfig.configId) ? (
                          <span className="opacity-50 text-[11px] uppercase tracking-tighter">Configuration Missing</span>
                        ) : (
                          <><Plus size={20} strokeWidth={3} /> Connect via Facebook</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-6 text-main font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  Integration Prerequisites
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
                    <div className="font-bold text-sm mb-2 flex items-center gap-2"><Globe size={16} className="text-primary" /> Meta Business Portfolio</div>
                    <p className="text-xs text-muted leading-relaxed font-medium">You must have a verified Meta Business Portfolio (formerly Business Manager) to request API access.</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
                    <div className="font-bold text-sm mb-2 flex items-center gap-2"><MessageSquare size={16} className="text-primary" /> Unlinked Number</div>
                    <p className="text-xs text-muted leading-relaxed font-medium">A number that hasn't been used with another WhatsApp account (App or Business App) in 6 months.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'integration' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-50">
              <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: 'var(--color-surface-soft)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                <SettingsIcon size={40} />
              </div>
              <h3 className="text-lg">Module in development</h3>
              <p className="text-muted text-sm">This setting tab will be available in the next update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
