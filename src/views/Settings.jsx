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

  const [showDirect, setShowDirect] = useState(false);
  const [directStep, setDirectStep] = useState(1);
  const [directData, setDirectData] = useState({
    countryCode: '91',
    phoneNumber: '',
    verifiedName: '',
    phoneNumberId: '',
    code: ''
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
      const redirectUri = window.location.origin + "/settings";
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
    const redirectUri = window.location.origin + "/settings";

    // Build the Meta-hosted onboarding URL config
    const extras = encodeURIComponent(JSON.stringify({
      version: "v4",
      sessionInfoVersion: "3",
      featureType: "whatsapp_business_app_onboarding"
    }));

    const signupUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${metaConfig.appId}&config_id=${metaConfig.configId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=whatsapp_business_management,whatsapp_business_messaging&extras=${extras}`;

    // Redirect to Meta OAuth dialog (bypasses JS SDK restrictions and handles redirection automatically)
    window.location.href = signupUrl;
  };

  const completeSignup = async (code, manualRedirectUri) => {
    try {
      const redirectUri = manualRedirectUri || (window.location.origin + "/settings");
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

  const handleDirectRegister = async (e) => {
    e.preventDefault();
    if (!directData.countryCode || !directData.phoneNumber || !directData.verifiedName) {
      return alert("Please fill in all fields.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/register-phone`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countryCode: directData.countryCode,
          phoneNumber: directData.phoneNumber,
          verifiedName: directData.verifiedName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (data.details?.error?.message) || "Failed to register number");
      
      setDirectData({ ...directData, phoneNumberId: data.phoneNumberId });
      setDirectStep(2);
      alert("Verification code (OTP) has been sent to your WhatsApp number via SMS.");
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectVerify = async (e) => {
    e.preventDefault();
    if (!directData.code) {
      return alert("Please enter the verification code.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/verify-phone`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: directData.phoneNumberId,
          code: directData.code,
          verifiedName: directData.verifiedName,
          countryCode: directData.countryCode,
          phoneNumber: directData.phoneNumber
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (data.details?.error?.message) || "Failed to verify number");
      
      setShowDirect(false);
      setDirectStep(1);
      setDirectData({ countryCode: '91', phoneNumber: '', verifiedName: '', phoneNumberId: '', code: '' });
      fetchStatus();
      alert("WhatsApp successfully connected!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
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
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          
          <div style={{ marginTop: '48px', padding: '24px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--color-border-soft)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Need Help?</h4>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>Check our developer documentation for API limits and integration guides.</p>
            <button style={{ color: 'var(--color-primary)', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>Read Docs <ExternalLink size={12} /></button>
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
                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', fontSize: '12px', lineHeight: '1.6' }}>
                      <strong>⚠️ Meta Notice:</strong> Embedded Signup is currently in "Tech Partner" review. 
                      Please use the <strong>Manual Configuration</strong> below with a Permanent Access Token from your Meta Developer Console.
                    </div>
                  )}
                </div>
                {wsStatus.connected && (
                  <div className="badge badge-success flex items-center gap-1">
                    <Check size={12} /> Connected
                  </div>
                )}
              </div>

              <div style={{ padding: '32px', borderRadius: '16px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border-soft)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
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
                      <div className="card animate-slide-up" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border-soft)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}>
                        <div className="grid mb-8" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Display Phone</div>
                            <div className="font-bold text-lg text-main">{wsStatus.details?.display_phone_number}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account ID</div>
                            <div className="font-mono text-xs truncate" style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                              {wsStatus.details?.phone_number_id}
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn-secondary hover-bg-danger-10" 
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                          onClick={handleDisconnect}
                        >
                          Terminate Integration
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Direct OTP Form */}
                        {showDirect ? (
                          <div className="card animate-slide-up" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-main)' }}>Direct OTP Verification</h4>
                            
                            {directStep === 1 ? (
                              <form onSubmit={handleDirectRegister}>
                                <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: '1fr 3fr', gap: '12px' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="label">Code</label>
                                    <input 
                                      type="text" 
                                      placeholder="91" 
                                      value={directData.countryCode}
                                      onChange={(e) => setDirectData({...directData, countryCode: e.target.value})}
                                      required
                                      style={{ margin: 0 }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="label">WhatsApp Phone Number</label>
                                    <input 
                                      type="text" 
                                      placeholder="9876543210" 
                                      value={directData.phoneNumber}
                                      onChange={(e) => setDirectData({...directData, phoneNumber: e.target.value})}
                                      required
                                      style={{ margin: 0 }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="form-group">
                                  <label className="label">Display Business Name</label>
                                  <input 
                                    type="text" 
                                    placeholder="Infowaves" 
                                    value={directData.verifiedName}
                                    onChange={(e) => setDirectData({...directData, verifiedName: e.target.value})}
                                    required
                                  />
                                </div>

                                <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                  <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Send OTP Code</button>
                                  <button type="button" onClick={() => setShowDirect(false)} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cancel</button>
                                </div>
                              </form>
                            ) : (
                              <form onSubmit={handleDirectVerify}>
                                <div className="form-group">
                                  <label className="label">6-Digit Verification Code (SMS OTP)</label>
                                  <input 
                                    type="text" 
                                    placeholder="123456" 
                                    value={directData.code}
                                    onChange={(e) => setDirectData({...directData, code: e.target.value})}
                                    required
                                  />
                                </div>

                                <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                  <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Verify & Connect</button>
                                  <button type="button" onClick={() => setDirectStep(1)} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Back</button>
                                </div>
                              </form>
                            )}
                          </div>
                        ) : showManual ? (
                          <form onSubmit={handleManualConnect} className="card animate-slide-up" style={{ marginTop: '24px', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-main)' }}>Manual Configuration</h4>
                            
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
                            
                            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', margin: 0 }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                    <label className="label">Phone Number ID</label>
                                    <input 
                                      type="text" 
                                      placeholder="1116..." 
                                      value={manualData.phoneNumberId}
                                      onChange={(e) => setManualData({...manualData, phoneNumberId: e.target.value})}
                                      required
                                      style={{ margin: 0 }}
                                    />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                    <label className="label">WABA ID</label>
                                    <input 
                                      type="text" 
                                      placeholder="2014..." 
                                      value={manualData.wabaId}
                                      onChange={(e) => setManualData({...manualData, wabaId: e.target.value})}
                                      required
                                      style={{ margin: 0 }}
                                    />
                              </div>
                            </div>
                            
                            <div className="form-group" style={{ marginTop: '16px' }}>
                              <label className="label">Business Name (Optional)</label>
                              <input 
                                type="text" 
                                placeholder="My Business" 
                                value={manualData.verifiedName}
                                onChange={(e) => setManualData({...manualData, verifiedName: e.target.value})}
                              />
                            </div>

                            <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                              <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Save Configuration</button>
                              <button type="button" onClick={() => setShowManual(false)} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button 
                              className="btn-primary" 
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '48px', fontSize: '15px', borderRadius: '10px' }}
                              onClick={() => { setShowDirect(true); setDirectStep(1); }}
                            >
                              <Plus size={20} /> Direct Connect with OTP
                            </button>

                            <button 
                              className="btn-secondary" 
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '48px', fontSize: '15px', borderRadius: '10px' }}
                              onClick={handleLaunchSignup}
                            >
                              Connect via Facebook Onboarding
                            </button>
                            
                            <button 
                              style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', textAlign: 'center', marginTop: '8px', cursor: 'pointer' }}
                              onClick={() => setShowManual(true)}
                            >
                              Or Connect Manually (Token/IDs)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-6 text-main font-black flex items-center gap-3">
                  <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--color-primary)', borderRadius: '4px' }} />
                  Integration Prerequisites
                </h3>
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  <div className="card" style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--color-border-soft)' }}>
                    <div className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
                      <Globe size={16} style={{ color: 'var(--color-primary)' }} /> Meta Business Portfolio
                    </div>
                    <p className="text-xs text-muted" style={{ lineHeight: '1.6' }}>
                      You must have a verified Meta Business Portfolio (formerly Business Manager) to request API access.
                    </p>
                  </div>
                  <div className="card" style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--color-border-soft)' }}>
                    <div className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
                      <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} /> Unlinked Number
                    </div>
                    <p className="text-xs text-muted" style={{ lineHeight: '1.6' }}>
                      A number that hasn't been used with another WhatsApp account (App or Business App) in 6 months.
                    </p>
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
