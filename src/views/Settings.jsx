import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, MessageSquare, Bell, User, Plus, Check, ExternalLink, Globe, Smartphone } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('integration');
  const [wsStatus, setWsStatus] = useState({ connected: false, details: null });
  const [metaConfig, setMetaConfig] = useState({ appId: '', configId: '' });
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(true); // Default to manual for non-BSPs
  const [manualData, setManualData] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: '',
    verifiedName: ''
  });

  useEffect(() => {
    const initFB = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whatsapp/init-config`, { headers: getAuthHeaders() });
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
      const redirectUri = (window.location.origin + window.location.pathname).replace(/\/$/, "");
      window.history.replaceState({}, document.title, redirectUri);
      completeSignup(code, redirectUri);
    }
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Server out of sync");
      const data = await res.json();
      setWsStatus(data);
      if (data.connected) setShowManual(false);
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
    const redirectUri = window.location.origin + window.location.pathname;

    // Build the Meta-hosted onboarding URL
    const extras = encodeURIComponent(JSON.stringify({
      version: "v4",
      sessionInfoVersion: "3",
      featureType: "whatsapp_business_app_onboarding"
    }));

    const signupUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${metaConfig.appId}&config_id=${metaConfig.configId}&extras=${extras}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Redirect to Meta-hosted landing page (bypasses JS SDK BSP restrictions)
    window.location.href = signupUrl;
  };

  const completeSignup = async (code, manualRedirectUri) => {
    try {
      const redirectUri = manualRedirectUri || (window.location.origin + window.location.pathname);
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/embedded-signup`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualConnect = async (e) => {
    e.preventDefault();
    if (!manualData.accessToken || !manualData.phoneNumberId || !manualData.wabaId) {
      return alert("Please fill in all required fields.");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/manual-config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(manualData)
      });
      if (!res.ok) throw new Error("Manual connection failed");
      const data = await res.json();
      if (data.success) {
        setShowManual(false);
        fetchStatus();
      } else {
        alert(data.error || "Failed to save configuration.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during manual connection.");
    } finally {
      setLoading(false);
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
                  
                  {!wsStatus.connected && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                      <strong>⚠️ Meta Notice:</strong> Embedded Signup is currently in "Tech Partner" review. 
                      Please use the <strong>Manual Configuration</strong> below with a Permanent Access Token from your Meta Developer Console.
                    </div>
                  )}
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
                        : 'Manual configuration is recommended while waiting for BSP approval.'}
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
                      <div className="flex flex-col gap-4">
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
                        
                        {!showManual ? (
                          <button 
                            className="text-[11px] font-black text-muted uppercase tracking-widest hover:text-primary transition-colors text-center"
                            onClick={() => setShowManual(true)}
                          >
                            Or Connect Manually (Non-BSP)
                          </button>
                        ) : (
                          <form onSubmit={handleManualConnect} className="mt-6 p-8 bg-white rounded-[24px] border border-slate-200 shadow-xl animate-slide-up">
                            <h4 className="text-sm font-black mb-6 uppercase tracking-widest text-main">Manual Configuration</h4>
                            
                            <div className="form-group">
                              <label className="label">Meta Access Token</label>
                              <input 
                                type="password" 
                                placeholder="EAAb..." 
                                value={manualData.accessToken}
                                onChange={(e) => setManualData({...manualData, accessToken: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="form-group">
                                <label className="label">Phone Number ID</label>
                                <input 
                                  type="text" 
                                  placeholder="1116..." 
                                  value={manualData.phoneNumberId}
                                  onChange={(e) => setManualData({...manualData, phoneNumberId: e.target.value})}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label className="label">WABA ID</label>
                                <input 
                                  type="text" 
                                  placeholder="2014..." 
                                  value={manualData.wabaId}
                                  onChange={(e) => setManualData({...manualData, wabaId: e.target.value})}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label className="label">Business Name (Optional)</label>
                              <input 
                                type="text" 
                                placeholder="My Business" 
                                value={manualData.verifiedName}
                                onChange={(e) => setManualData({...manualData, verifiedName: e.target.value})}
                              />
                            </div>

                            <div className="flex gap-3 mt-4">
                              <button type="submit" className="btn-primary flex-1 py-3 text-xs uppercase tracking-widest">Save Configuration</button>
                              <button type="button" onClick={() => setShowManual(false)} className="btn-secondary py-3 text-xs uppercase tracking-widest">Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
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
