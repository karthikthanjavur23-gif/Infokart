import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, HelpCircle, Sparkles, Send, X, Search, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './Layout.css';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useNotifications();

  // Copilot States
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Infokart AI Copilot. I can help you create campaigns, build bots, draft templates, or analyze CRM insights. What's our goal today?" }
  ]);

  const suggestions = [
    "Create Campaign",
    "Create Bot",
    "CRM Insights",
    "Suggest Broadcast",
    "Generate Template",
    "Analyze Contacts"
  ];
  
  // Dynamic page title mapping based on pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path === '/marketing-helper') return 'AI Workspace';
    if (path === '/campaigns') return 'Campaign Broadcasts';
    if (path === '/inbox') return 'Team Inbox';
    if (path === '/contacts') return 'CRM Contacts';
    if (path === '/templates') return 'Templates Library';
    if (path === '/whatsapp-chatbot') return 'WhatsApp Bot Builder';
    if (path === '/ig-chatbot') return 'Instagram AI Agent';
    if (path === '/team') return 'Team Management';
    if (path === '/audit') return 'System Audit Logs';
    if (path === '/settings') return 'Settings & Credentials';
    return 'Dashboard';
  };

  const handleSendCopilotMessage = (textToSend = null) => {
    const query = textToSend || copilotInput;
    if (!query.trim()) return;

    // Add user message
    setCopilotMessages(prev => [...prev, { role: 'user', content: query }]);
    setCopilotInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      setIsAiTyping(false);
      const cleaned = query.toLowerCase();
      let response = "I'm analyzing your request. Would you like me to guide you to that specific tool? Click any suggestions below to trigger direct actions.";

      if (cleaned.includes('campaign') || cleaned.includes('broadcast')) {
        response = "I can help you build a new broadcast campaign! Let me redirect you to the step-by-step Campaign Builder wizard.";
        setTimeout(() => navigate('/campaigns/create'), 1500);
      } else if (cleaned.includes('bot') || cleaned.includes('chatbot') || cleaned.includes('flow')) {
        response = "Opening the visual WhatsApp Bot Flow Builder canvas. You can visual-map customer triggers and conditions there.";
        setTimeout(() => navigate('/whatsapp-chatbot'), 1500);
      } else if (cleaned.includes('contacts') || cleaned.includes('crm') || cleaned.includes('customer')) {
        response = "Redirecting you to the CRM Contacts dashboard. You can segment contacts, view lifecycle stages, and edit individual drawers.";
        setTimeout(() => navigate('/contacts'), 1500);
      } else if (cleaned.includes('template')) {
        response = "Heading to the templates manager. I can help you draft and submit official Meta templates for approval.";
        setTimeout(() => navigate('/templates'), 1500);
      } else if (cleaned.includes('insight') || cleaned.includes('analytics')) {
        response = "Here are your organization insights: Average read rate is 64.2%, delivery is 98.4%, and chatbot resolution is at 80%. Consider launching a WhatsApp re-engagement campaign for VIP customers.";
      }

      setCopilotMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  const handleSuggestionClick = (chip) => {
    handleSendCopilotMessage(chip);
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-nav">
          <div className="top-nav-left">
            <span className="breadcrumb-main">{getPageTitle()}</span>
            <div className="header-search-container">
              <Search size={14} className="header-search-icon" />
              <input 
                type="text" 
                placeholder="Ask AI or search workspace..." 
                className="header-search-input"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setShowCopilot(true);
                    handleSendCopilotMessage(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="top-nav-right">
            <button className="icon-btn-header" title="Notifications">
              <Bell size={18} />
            </button>
            <button className="icon-btn-header" title="Help & Support">
              <HelpCircle size={18} />
            </button>
            <div className="header-divider" />
            <div className="header-avatar" title={`${user?.name} (${user?.role})`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Copilot */}
      <div className="floating-ai-copilot-container">
        {showCopilot && (
          <div className="ai-copilot-window">
            <div className="ai-copilot-header">
              <div className="ai-copilot-header-info">
                <Sparkles size={16} />
                <div>
                  <div className="ai-copilot-header-title">Gemini AI Copilot</div>
                  <div className="ai-copilot-header-subtitle">Enterprise OS Companion</div>
                </div>
              </div>
              <button className="ai-copilot-close" onClick={() => setShowCopilot(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="ai-copilot-messages custom-scrollbar">
              {copilotMessages.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  <div className="ai-message-avatar">
                    {msg.role === 'assistant' ? 'AI' : 'U'}
                  </div>
                  <div className="ai-message-bubble">
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="ai-message assistant">
                  <div className="ai-message-avatar">AI</div>
                  <div className="ai-message-bubble" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                    Analyzing objective...
                  </div>
                </div>
              )}
            </div>
            <div className="ai-copilot-suggestions">
              {suggestions.map((chip, idx) => (
                <button 
                  key={idx} 
                  className="ai-copilot-suggestion-chip"
                  onClick={() => handleSuggestionClick(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="ai-copilot-input-area">
              <input 
                type="text" 
                placeholder="Ask AI anything..." 
                className="ai-copilot-input"
                value={copilotInput}
                onChange={e => setCopilotInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendCopilotMessage();
                }}
              />
              <button className="ai-copilot-send" onClick={() => handleSendCopilotMessage()}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
        <button 
          className="floating-ai-copilot-btn"
          onClick={() => setShowCopilot(!showCopilot)}
          title="Open AI Copilot"
        >
          <Sparkles size={20} />
        </button>
      </div>
    </div>
  );
};

export default Layout;
