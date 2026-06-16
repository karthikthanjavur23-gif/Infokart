import React, { useState, useEffect } from 'react';
import {
  Globe, User, Bell, Shield, Smartphone, ExternalLink,
  Check, RefreshCw, AlertTriangle, Play, HelpCircle,
  Settings as SettingsIcon, MessageSquare, Zap, Activity, Info
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('integration');
  const [subTab, setSubTab] = useState('connection'); // 'connection', 'messaging', 'advanced'
  const [wsStatus, setWsStatus] = useState({ connected: false, details: null });
  const [metaConfig, setMetaConfig] = useState({ appId: '', configId: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchMetaConfig();
    fetchStatus();

    // Check for Meta redirect code in URL (Embedded Signup Callback)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const redirectUri = window.location.origin + "/settings";
      window.history.replaceState({}, document.title, redirectUri);
      completeSignup(code, redirectUri);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchMetaConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/init-config`, { headers: getAuthHeaders() });
      const config = await res.json();
      setMetaConfig(config);
    } catch (e) {
      console.error("Failed to load Meta app configurations", e);
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/status`, { headers: getAuthHeaders() });
      const data = await res.json();
      setWsStatus(data);
    } catch (e) {
      console.error("Failed to fetch WhatsApp connection status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSignup = () => {
    if (!metaConfig.appId || !metaConfig.configId) {
      return alert("Meta Developer credentials are not configured on the server. Please verify your .env file.");
    }
    const redirectUri = window.location.origin + "/settings";

    // Meta Embedded Onboarding Configuration Options
    const extras = encodeURIComponent(JSON.stringify({
      version: "v4",
      sessionInfoVersion: "3",
      featureType: "whatsapp_business_app_onboarding"
    }));

    const signupUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${metaConfig.appId}&config_id=${metaConfig.configId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=whatsapp_business_management,whatsapp_business_messaging&extras=${extras}`;

    window.location.href = signupUrl;
  };

  const completeSignup = async (code, redirectUri) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/embedded-signup`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, redirectUri })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("WhatsApp Business Account connected successfully!");
        fetchStatus();
      } else {
        alert(data.error || "Failed to complete WhatsApp onboarding.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during onboarding.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp? This will immediately pause all active campaigns and AI automation.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast("Disconnected WhatsApp Account.");
        fetchStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/reconnect`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Connection successfully verified!");
        fetchStatus();
      } else {
        showToast(data.error || "Connection failed. Please re-authenticate.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Verification failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerSync = async (type) => {
    setActionLoading(true);
    try {
      const url = type === 'templates'
        ? `${API_BASE_URL}/api/templates/sync`
        : `${API_BASE_URL}/api/contacts/sync`;

      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Successfully synced ${type}!`);
      } else {
        showToast(data.error || `Failed to sync ${type}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Sync operation failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'integration', label: 'Meta Integrations', icon: Globe },
    { id: 'profile', label: 'Business Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out', color: '#111827', minHeight: '80vh' }}>
      {/* Toast Notification */}
      {toast.message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#7c3aed',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13px',
          animation: 'slideInRight 0.2s ease-out'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage connected platform integrations and settings.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px' }}>
        {/* Left Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === tab.id ? '#7c3aed' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#4b5563',
                boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(124, 58, 237, 0.25)' : 'none'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}

          <div style={{ marginTop: '32px', padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>Onboarding Guide</h4>
            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5', marginBottom: '12px' }}>
              Connect WhatsApp to sync templates, create interactive message campaigns, and automate replies.
            </p>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#7c3aed', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              API Reference <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Right Content */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}>
          {activeTab === 'integration' && (
            <div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                  <RefreshCw size={36} className="animate-spin" style={{ color: '#7c3aed', marginBottom: '16px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Loading integration details...</p>
                </div>
              ) : !wsStatus.connected ? (
                /* DISCONNECTED / ONBOARDING VIEW */
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>WhatsApp Business Onboarding</h2>
                    <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
                      Connect your number to enable Infokart to converse with customers and run broadcast campaigns.
                    </p>
                  </div>

                  {/* Connect Card */}
                  <div style={{
                    border: '2px dashed #7c3aed',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#faf5ff',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      backgroundColor: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      margin: '0 auto 24px auto',
                      boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)'
                    }}>
                      <Smartphone size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Connect WhatsApp</h3>
                    <p style={{ color: '#6b7280', fontSize: '13px', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                      Connect your WhatsApp Business number in under 2 minutes. Meta Embedded Signup handles everything.
                    </p>
                    <button
                      onClick={handleLaunchSignup}
                      style={{
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '14px 28px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px -3px rgba(124, 58, 237, 0.4)',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Zap size={16} fill="white" />
                      Connect WhatsApp
                    </button>
                  </div>

                  {/* Step Indicators */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Onboarding Process</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      {[
                        { step: '1', title: 'Enter Details', desc: 'Provide company name' },
                        { step: '2', title: 'Connect Number', desc: 'Input WhatsApp number' },
                        { step: '3', title: 'Verify OTP', desc: 'Verify via SMS / call' },
                        { step: '4', title: 'Done', desc: 'Start messaging!' }
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '11px', fontWeight: '800', marginBottom: '10px' }}>
                            {item.step}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CONNECTED - TABS VIEW */
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  {/* Status Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#faf5ff',
                    border: '1px solid #f3e8ff',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{wsStatus.details?.phoneNumber || 'Active Connection'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          <span>WABA Account: {wsStatus.details?.displayName}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: wsStatus.details?.status === 'Disconnected' ? '#ef4444' : '#22c55e',
                        boxShadow: wsStatus.details?.status === 'Disconnected' ? '0 0 8px #ef4444' : '0 0 8px #22c55e',
                        animation: 'pulse 1.5s infinite'
                      }} />
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: wsStatus.details?.status === 'Disconnected' ? '#ef4444' : '#22c55e' }}>
                        {wsStatus.details?.status || 'Connected'}
                      </span>
                    </div>
                  </div>

                  {/* Sub Tab Buttons */}
                  <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '28px' }}>
                    {[
                      { id: 'connection', label: 'Connection' },
                      { id: 'messaging', label: 'Messaging' },
                      { id: 'advanced', label: 'Advanced' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          borderBottom: subTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                          paddingBottom: '12px',
                          color: subTab === tab.id ? '#7c3aed' : '#6b7280',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          paddingLeft: '4px',
                          paddingRight: '4px'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Panels */}
                  <div>
                    {subTab === 'connection' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number ID</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>{wsStatus.details?.phoneNumberId}</div>
                          </div>
                          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Business Portfolio ID</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>{wsStatus.details?.businessId || 'N/A'}</div>
                          </div>
                          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>WABA Account ID</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>{wsStatus.details?.wabaId}</div>
                          </div>
                          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Webhook Status</div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={14} /> Subscribed (Auto)
                            </div>
                          </div>
                        </div>

                        {/* Connection Actions */}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                          <button
                            onClick={handleReconnect}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              backgroundColor: 'transparent',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              color: '#374151',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} />
                            Verify Health
                          </button>
                          <button
                            onClick={handleDisconnect}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              backgroundColor: 'transparent',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              color: '#ef4444',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Disconnect Number
                          </button>
                        </div>
                      </div>
                    )}

                    {subTab === 'messaging' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                          {/* Quality Rating */}
                          <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Quality Rating</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#ffffff',
                                backgroundColor:
                                  wsStatus.details?.qualityRating?.toUpperCase() === 'GREEN' ? '#10b981' :
                                    wsStatus.details?.qualityRating?.toUpperCase() === 'YELLOW' ? '#f59e0b' : '#ef4444'
                              }}>
                                {wsStatus.details?.qualityRating || 'GREEN'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>Meta health score</span>
                            </div>
                          </div>

                          {/* Messaging Tier Limit */}
                          <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Messaging Tier Limit</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', fontSize: '15px' }}>
                                {wsStatus.details?.messagingLimit || 'TIER_1K'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                ({wsStatus.details?.messagingLimit === 'TIER_250' ? '250 limit' :
                                  wsStatus.details?.messagingLimit === 'TIER_10K' ? '10K limit' : '1000 limit'}/day)
                              </span>
                            </div>
                          </div>

                          {/* Verified Display Name */}
                          <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Verified display name</div>
                            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1f2937' }}>
                              {wsStatus.details?.displayName || 'Unknown Name'}
                            </div>
                          </div>

                          {/* Connection Monitor */}
                          <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Connection Monitor</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#3b82f6' }}>
                              <Activity size={14} /> Active (Checks every 15 min)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {subTab === 'advanced' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Info size={14} style={{ color: '#7c3aed' }} /> Sync Assets
                          </h4>
                          <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
                            Sync assets from your Meta account directly to your local database if you updated them in the Meta Business Manager.
                          </p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => triggerSync('templates')}
                              disabled={actionLoading}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                color: '#334155'
                              }}
                            >
                              Sync Templates
                            </button>
                            <button
                              onClick={() => triggerSync('contacts')}
                              disabled={actionLoading}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                color: '#334155'
                              }}
                            >
                              Sync Contacts
                            </button>
                          </div>
                        </div>

                        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>Automatic Token Management</h4>
                          <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
                            Infokart maintains a long-lived Meta connection. To refresh authentication permissions, trigger a reconnection from the connection status tab.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'integration' && (
            <div style={{ display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center', height: '400px', textAlign: 'center', opacity: 0.5 }}>
              <div style={{ margin: '0 auto 16px auto', color: '#9ca3af' }}>
                <SettingsIcon size={40} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#4b5563' }}>Module in development</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>This settings tab will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
