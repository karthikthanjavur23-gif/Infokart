import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  Sparkles, 
  Loader2, 
  Search, 
  Filter, 
  MoreVertical, 
  MessageCircle, 
  Users, 
  Lock, 
  Smile, 
  Paperclip, 
  BookOpen, 
  Activity, 
  Check, 
  CheckCheck, 
  Tag, 
  Inbox, 
  Archive, 
  Trash2, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  ChevronRight, 
  FileText,
  User,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const TeamInbox = () => {
  // Inbox lists & loading
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  
  // Navigation sidebar & Filters
  const [activeFolder, setActiveFolder] = useState('ALL_CHATS'); // ALL_CHATS, UNASSIGNED, MY_CHATS, WHATSAPP, INSTAGRAM, WEBSITE, ARCHIVED, SPAM, CLOSED
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN'); // OPEN, CLOSED, ALL
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  
  // Composer state
  const [composerMode, setComposerMode] = useState('reply'); // 'reply', 'note'
  const [replyText, setReplyText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
  // AI assistant states
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [aiSuggestionsDrawer, setAiSuggestionsDrawer] = useState(false);
  const [aiSuggestedReplyText, setAiSuggestedReplyText] = useState('');
  
  // Presence & Collision Detection
  const [activeAgents, setActiveAgents] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // CRM Contact Editing fields
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactTags, setContactTags] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState('New Lead');
  const [isEditingCRM, setIsEditingCRM] = useState(false);
  
  // AI Training Knowledge base fields
  const [activeRightTab, setActiveRightTab] = useState('CRM'); // 'CRM', 'KB'
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbType, setKbType] = useState('faq');
  const [isAddingKb, setIsAddingKb] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ message: '', type: '' });
  
  const chatEndRef = useRef(null);

  // Emojis list
  const emojiList = ['😊', '👍', '👋', '🎉', '❤️', '🔥', '💡', '🤔', '🙏', '🙌', '👀', '✨'];

  // Quick replies list
  const quickRepliesList = [
    { shortcut: '/price', label: 'Pricing Information', text: 'Our plans start at $10/month for the Starter tier, $29/month for Growth, and $99/month for Enterprise. Visit our settings workspace to learn more!' },
    { shortcut: '/thanks', label: 'Thank You', text: 'Thank you for reaching out to InfoKart! We appreciate your business and will get back to you shortly.' },
    { shortcut: '/location', label: 'Office Location', text: 'We are located at InfoKart Headquarters, Tech Park City. Drop by anytime between 9 AM to 6 PM.' }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  // 1. Fetch Conversations list
  const fetchConversations = async () => {
    try {
      const qParts = [];
      
      // Map folder selection to API query parameters
      if (activeFolder === 'UNASSIGNED') qParts.push('assigned_to=unassigned');
      if (activeFolder === 'MY_CHATS') qParts.push('assigned_to=my');
      if (activeFolder === 'WHATSAPP') qParts.push('channel=WhatsApp');
      if (activeFolder === 'INSTAGRAM') qParts.push('channel=Instagram');
      if (activeFolder === 'WEBSITE') qParts.push('channel=Website');
      if (activeFolder === 'ARCHIVED') qParts.push('status=archived');
      if (activeFolder === 'SPAM') qParts.push('status=spam');
      if (activeFolder === 'CLOSED') qParts.push('status=closed');
      if (['ALL_CHATS', 'UNASSIGNED', 'MY_CHATS', 'WHATSAPP', 'INSTAGRAM', 'WEBSITE'].includes(activeFolder)) {
        qParts.push(`status=${statusFilter === 'ALL' ? 'ALL' : statusFilter === 'OPEN' ? 'OPEN' : 'CLOSED'}`);
      }

      if (searchQuery) qParts.push(`search=${encodeURIComponent(searchQuery)}`);
      
      const qString = qParts.length > 0 ? '?' + qParts.join('&') : '';
      const res = await fetch(`${API_BASE_URL}/api/inbox/conversations${qString}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch thread messages
  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/messages?conversation_id=${convId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Fetch auxiliary team users
  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Fetch rich WhatsApp templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.filter(t => t.status === 'APPROVED'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Fetch AI Knowledge Base Articles
  const fetchKbArticles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/kb`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setKbArticles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Polling updates for threads and selected conversation
  useEffect(() => {
    fetchConversations();
    fetchAgents();
    fetchTemplates();
    fetchKbArticles();
    setIsLoading(false);

    const convInterval = setInterval(fetchConversations, 5000);
    return () => clearInterval(convInterval);
  }, [activeFolder, statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedConv) {
      setIsMessagesLoading(true);
      fetchMessages(selectedConv.id);
      setIsMessagesLoading(false);
      
      // Pre-fill CRM sidebar fields
      setContactName(selectedConv.customer_name || 'Unknown Contact');
      setContactEmail(selectedConv.customer_email || '');
      setContactNotes(selectedConv.customer_notes || '');
      setContactTags(selectedConv.customer_tags || '');
      setLifecycleStage(selectedConv.lifecycle_stage || 'New Lead');
      setIsEditingCRM(false);

      const msgInterval = setInterval(() => fetchMessages(selectedConv.id), 3000);
      return () => clearInterval(msgInterval);
    } else {
      setMessages([]);
    }
  }, [selectedConv?.id]);

  // Presence Reporting Polling (Collision Alert & Typing Status)
  useEffect(() => {
    if (!selectedConv) return;
    
    const presenceInterval = setInterval(() => {
      reportPresence();
    }, 3000);

    return () => clearInterval(presenceInterval);
  }, [selectedConv?.id, isTyping]);

  const reportPresence = async () => {
    if (!selectedConv) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/active-status`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id, typing_status: isTyping ? 1 : 0 })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.active_agents)) {
        setActiveAgents(data.active_agents);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scroll Timeline to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message or Internal note
  const handleSend = async () => {
    if (!replyText.trim() && !mediaUrl.trim()) return;
    if (!selectedConv) return;

    try {
      const url = composerMode === 'note' 
        ? `${API_BASE_URL}/api/inbox/note`
        : `${API_BASE_URL}/api/inbox/send`;
      
      const payload = composerMode === 'note'
        ? { conversation_id: selectedConv.id, note: replyText }
        : { conversation_id: selectedConv.id, content: replyText, media_url: mediaUrl || null };

      const res = await fetch(url, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReplyText('');
        setMediaUrl('');
        setIsTyping(false);
        fetchMessages(selectedConv.id);
        fetchConversations(); // refresh list to update last snippet
      } else {
        showToast('Failed to deliver message', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Connection failed', 'error');
    }
  };

  // AI Suggest Reply
  const handleAiSuggestReply = async () => {
    if (!selectedConv) return;
    setIsAiSuggesting(true);
    setAiSuggestionsDrawer(true);
    setAiSuggestedReplyText('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/ai-auto-suggest`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id })
      });
      const data = await res.json();
      if (res.ok) {
        setAiSuggestedReplyText(data.response);
      } else {
        setAiSuggestedReplyText("AI could not formulate a response. Train the Knowledge Base first.");
      }
    } catch (e) {
      console.error(e);
      setAiSuggestedReplyText("Error connecting to AI Copilot.");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // AI Rewrite Text
  const handleAiRewrite = async (style) => {
    if (!replyText.trim()) return;
    setIsAiRewriting(true);

    try {
      const prompt = `Rewrite the following message to sound ${style}. Keep placeholders:
      Message: ${replyText}
      Rewritten:`;

      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setReplyText(data.response.trim());
        showToast(`Message rewritten to be ${style}!`);
      }
    } catch (e) {
      console.error(e);
      showToast('AI Rewrite failed', 'error');
    } finally {
      setIsAiRewriting(false);
    }
  };

  // Assign chat agent
  const handleAssignAgent = async (agentId) => {
    if (!selectedConv) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/assign`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id, assigned_to: agentId ? parseInt(agentId) : null })
      });
      if (res.ok) {
        showToast(agentId ? 'Conversation assigned!' : 'Conversation unassigned');
        fetchConversations();
        fetchMessages(selectedConv.id);
        
        // Update local object immediately to refresh UI
        const updatedAgent = agents.find(a => a.id === parseInt(agentId));
        setSelectedConv(prev => ({ 
          ...prev, 
          assigned_to: agentId ? parseInt(agentId) : null,
          assignee_name: updatedAgent ? updatedAgent.name : null
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle open/closed status
  const handleToggleStatus = async () => {
    if (!selectedConv) return;
    const isClosed = selectedConv.status === 'closed';
    const endpoint = isClosed ? 'reopen' : 'close';
    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/${endpoint}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id })
      });
      if (res.ok) {
        showToast(isClosed ? 'Conversation Reopened!' : 'Conversation Closed!');
        fetchConversations();
        fetchMessages(selectedConv.id);
        setSelectedConv(prev => ({ ...prev, status: isClosed ? 'open' : 'closed' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update CRM Profile details
  const handleSaveCRM = async () => {
    if (!selectedConv) return;
    try {
      const payload = {
        name: contactName,
        email: contactEmail,
        notes: contactNotes,
        tags: contactTags
      };

      const res = await fetch(`${API_BASE_URL}/api/contacts/${selectedConv.customer_phone}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('CRM Profile updated successfully!');
        setIsEditingCRM(false);
        fetchConversations();
        setSelectedConv(prev => ({
          ...prev,
          customer_name: contactName,
          customer_email: contactEmail,
          customer_notes: contactNotes,
          customer_tags: contactTags
        }));
      } else {
        showToast('Failed to update CRM profile', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error updating CRM', 'error');
    }
  };

  // Add Knowledge Base FAQ/URL
  const handleAddKb = async () => {
    if (!kbContent.trim()) return;
    setIsAddingKb(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/inbox/kb`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: kbType, title: kbTitle, content: kbContent })
      });

      if (res.ok) {
        showToast('AI Knowledge Base trained successfully!');
        setKbTitle('');
        setKbContent('');
        fetchKbArticles();
      } else {
        showToast('Failed to add training data', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error adding training data', 'error');
    } finally {
      setIsAddingKb(false);
    }
  };

  // Custom CSS for dark-mode SaaS workspace layout
  const localStyles = `
    .inbox-workspace {
      display: grid;
      grid-template-columns: 240px 340px 1fr 320px;
      height: calc(100vh - var(--header-height, 80px) - 20px);
      background-color: #0b0f19;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #1e293b;
      font-size: 14px;
    }
    
    .inbox-sidebar {
      background-color: #0b0f19;
      border-right: 1px solid #1e293b;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .folder-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .folder-item:hover, .folder-item.active {
      background-color: #1e293b;
      color: white;
    }

    .inbox-list-pane {
      background-color: #0f172a;
      border-right: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .inbox-chat-pane {
      background-color: #090d16;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .inbox-crm-pane {
      background-color: #0f172a;
      border-left: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 20px;
    }

    .chat-bubble {
      max-width: 65%;
      padding: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .chat-bubble.inbound {
      background-color: #1e293b;
      color: #f1f5f9;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .chat-bubble.outbound {
      background-color: #00bfa5;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .chat-bubble.internal_note {
      background-color: #fef08a;
      color: #854d0e;
      align-self: center;
      max-width: 80%;
      border-radius: 12px;
      border: 1px solid #fef08a;
      font-size: 13px;
    }

    .chat-bubble.system {
      background-color: transparent;
      color: #64748b;
      align-self: center;
      max-width: 80%;
      box-shadow: none;
      font-style: italic;
      font-size: 12px;
      padding: 4px;
      text-align: center;
    }

    .unread-count-dot {
      background-color: #f43f5e;
      color: white;
      font-size: 10px;
      font-weight: bold;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .priority-badge {
      font-size: 9px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .priority-badge.high { background-color: #fef2f2; color: #b91c1c; }
    .priority-badge.medium { background-color: #fffbeb; color: #b45309; }
    .priority-badge.low { background-color: #f0fdf4; color: #15803d; }

    .sla-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .sla-indicator.good { background-color: #10b981; }
    .sla-indicator.warning { background-color: #f59e0b; }
    .sla-indicator.overdue { background-color: #f43f5e; }

    .text-dark-theme {
      color: #f8fafc;
    }

    .subtext-dark-theme {
      color: #94a3b8;
    }

    .dark-input {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      outline: none;
      margin-top: 4px;
      width: 100%;
    }

    .dark-input:focus {
      border-color: #00bfa5;
    }

    .crm-section {
      border-bottom: 1px solid #1e293b;
      padding-bottom: 18px;
      margin-bottom: 18px;
    }
  `;

  // Filter conversations based on UI selections
  const getFilteredConversations = () => {
    return conversations.filter(conv => {
      // Priority filter check
      if (priorityFilter !== 'ALL' && conv.priority?.toUpperCase() !== priorityFilter) return false;
      return true;
    });
  };

  const currentFilteredList = getFilteredConversations();

  return (
    <div>
      <style>{localStyles}</style>

      {/* Toast popup */}
      {toast.message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)',
          color: 'white',
          fontWeight: '600',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="inbox-workspace">
        
        {/* PANEL 1: SIDEBAR NAVIGATION */}
        <div className="inbox-sidebar">
          <div style={{ padding: '8px 12px', marginBottom: '16px' }}>
            <h2 className="text-dark-theme flex items-center gap-2" style={{ fontSize: '18px', fontWeight: '800' }}>
              <Inbox size={22} style={{ color: '#00bfa5' }} /> Infokart Inbox
            </h2>
          </div>

          {[
            { id: 'ALL_CHATS', label: 'All Chats', icon: MessageCircle },
            { id: 'UNASSIGNED', label: 'Unassigned', icon: HelpCircle },
            { id: 'MY_CHATS', label: 'My Chats', icon: User },
            { id: 'WHATSAPP', label: 'WhatsApp', icon: ExternalLink },
            { id: 'INSTAGRAM', label: 'Instagram', icon: Globe },
            { id: 'WEBSITE', label: 'Website Chat', icon: Laptop },
            { id: 'ARCHIVED', label: 'Archived', icon: Archive },
            { id: 'CLOSED', label: 'Closed', icon: Trash2 }
          ].map(folder => {
            const Icon = folder.icon;
            return (
              <div
                key={folder.id}
                className={`folder-item ${activeFolder === folder.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveFolder(folder.id);
                  setSelectedConv(null);
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} />
                  {folder.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* PANEL 2: CONVERSATION LIST */}
        <div className="inbox-list-pane">
          {/* List Search & Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  paddingLeft: '38px',
                  color: 'white',
                  margin: 0
                }}
              />
            </div>

            {/* Quick Filter buttons */}
            <div className="flex gap-2 justify-between items-center" style={{ flexWrap: 'wrap' }}>
              {/* Status toggle Open/Closed */}
              <div className="flex gap-1" style={{ backgroundColor: '#1e293b', padding: '2px', borderRadius: '6px' }}>
                {['OPEN', 'CLOSED', 'ALL'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: statusFilter === st ? '#334155' : 'transparent',
                      color: statusFilter === st ? 'white' : '#94a3b8',
                      fontWeight: '700'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  width: '90px',
                  margin: 0
                }}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Conversation List cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {currentFilteredList.map((conv) => {
              // Calculate SLA warnings: mockup timer
              const lastMsgTime = conv.last_message_time ? new Date(conv.last_message_time) : new Date();
              const elapsedMinutes = Math.floor((new Date() - lastMsgTime) / 60000);
              let slaClass = "good";
              if (elapsedMinutes >= 1 && elapsedMinutes < 3) slaClass = "warning";
              else if (elapsedMinutes >= 3) slaClass = "overdue";

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedConv?.id === conv.id ? '#1e293b' : 'transparent',
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '4px',
                    border: '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (selectedConv?.id !== conv.id) e.currentTarget.style.backgroundColor = '#111827'; }}
                  onMouseLeave={(e) => { if (selectedConv?.id !== conv.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Channel icon & Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: selectedConv?.id === conv.id ? '#00bfa5' : '#334155',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '16px'
                    }}>
                      {conv.customer_name?.charAt(0) || '?'}
                    </div>
                    {/* Small Channel badge overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      border: '1px solid #1e293b'
                    }}>
                      {conv.channel === 'WhatsApp' ? <ExternalLink size={10} style={{ color: '#00bfa5' }} /> : conv.channel === 'Instagram' ? <Globe size={10} style={{ color: '#ec4899' }} /> : <Laptop size={10} style={{ color: '#3b82f6' }} />}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-dark-theme font-bold" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.customer_name || conv.customer_phone}
                      </div>
                      <span className="subtext-dark-theme" style={{ fontSize: '10px' }}>
                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>

                    <div className="subtext-dark-theme text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message_sender === 'agent' ? 'You: ' : ''}{conv.last_message_content || 'No messages yet.'}
                    </div>

                    {/* Meta stats badges */}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`sla-indicator ${slaClass}`} title={`SLA response timer: ${elapsedMinutes}m elapsed`} />
                        <span className={`priority-badge ${conv.priority || 'medium'}`} style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>{conv.priority}</span>
                        {conv.sentiment && (
                          <span style={{ fontSize: '12px' }} title={`Detected Sentiment: ${conv.sentiment}`}>
                            {conv.sentiment === 'positive' ? '😊' : conv.sentiment === 'negative' ? '😠' : '😐'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {conv.assignee_name && (
                          <span style={{ fontSize: '9px', backgroundColor: '#334155', color: 'white', padding: '1px 5px', borderRadius: '4px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.assignee_name}
                          </span>
                        )}
                        {conv.unread_count > 0 && (
                          <div className="unread-count-dot">{conv.unread_count}</div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {currentFilteredList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                No conversations found in this view.
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: CENTER CHAT WINDOW */}
        <div className="inbox-chat-pane">
          {selectedConv ? (
            <>
              {/* Chat Header details */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, backgroundColor: '#0f172a' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#00bfa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {selectedConv.customer_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-dark-theme font-bold" style={{ fontSize: '15px' }}>{selectedConv.customer_name || selectedConv.customer_phone}</h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span className="flex items-center gap-1">
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        Online
                      </span>
                      <span>•</span>
                      <span>Channel: {selectedConv.channel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        Sentiment: {selectedConv.sentiment === 'positive' ? '😊' : selectedConv.sentiment === 'negative' ? '😠' : '😐'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Assignee select box */}
                  <div className="flex items-center gap-1.5">
                    <span className="subtext-dark-theme" style={{ fontSize: '11px' }}>Assign:</span>
                    <select
                      value={selectedConv.assigned_to || ''}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        width: '120px',
                        margin: 0
                      }}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>

                  {/* Close / Reopen */}
                  <button 
                    onClick={handleToggleStatus}
                    className="btn-secondary"
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      fontSize: '12px', 
                      borderColor: selectedConv.status === 'closed' ? '#10b981' : '#f43f5e',
                      color: selectedConv.status === 'closed' ? '#10b981' : '#f43f5e',
                      fontWeight: '700'
                    }}
                  >
                    {selectedConv.status === 'closed' ? 'Reopen Chat' : 'Close Chat'}
                  </button>
                </div>
              </div>

              {/* Chat Message feed timeline */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {isMessagesLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin text-muted" size={24} />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSystem = msg.sender_type === 'system';
                    const isNote = msg.sender_type === 'internal_note';
                    const isOutbound = msg.direction === 'outbound';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="chat-bubble system">
                          {msg.content}
                        </div>
                      );
                    }

                    if (isNote) {
                      return (
                        <div key={msg.id} className="chat-bubble internal_note">
                          <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                            <Lock size={12} /> INTERNAL COMMENT
                          </div>
                          <div>{msg.content}</div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isOutbound ? 'flex-end' : 'flex-start' }} className="animate-slide-up">
                        <div className={`chat-bubble ${isOutbound ? 'outbound' : 'inbound'}`}>
                          
                          {/* Media asset attachment preview if url set */}
                          {msg.media_url && (
                            <div style={{ width: '100%', marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                              {/\.(jpeg|jpg|gif|png)$/i.test(msg.media_url) ? (
                                <img src={msg.media_url} alt="Attachment" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                              ) : (
                                <a 
                                  href={msg.media_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    borderRadius: '6px',
                                    color: isOutbound ? 'white' : '#60a5fa',
                                    fontSize: '12px'
                                  }}
                                >
                                  <FileText size={18} />
                                  <span style={{ textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    View Document Asset
                                  </span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Message text */}
                          <div style={{ fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </div>

                          {/* Receipt status checkmarks */}
                          <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <span>12:45 PM</span>
                            {isOutbound && (
                              <span>
                                {msg.status === 'read' ? <CheckCheck size={12} style={{ color: '#34d399' }} /> : msg.status === 'delivered' ? <CheckCheck size={12} /> : <Check size={12} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Typing indicators or Collision Detection notification banner */}
              {activeAgents.length > 0 && (
                <div style={{ padding: '6px 24px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #1e293b' }}>
                  <AlertCircle size={14} />
                  <span>
                    {activeAgents.map(a => a.username).join(', ')} {activeAgents.some(a => a.typing_status === 1) ? 'is typing...' : 'is viewing this conversation'}
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>(Reply locked to prevent overlaps)</span>
                </div>
              )}

              {/* AI auto suggest drawer container if open */}
              {aiSuggestionsDrawer && (
                <div style={{ padding: '16px 24px', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', position: 'relative' }}>
                  <button 
                    onClick={() => setAiSuggestionsDrawer(false)}
                    style={{ position: 'absolute', top: '12px', right: '12px', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bfa5', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Sparkles size={14} /> AI Suggested Response
                  </h4>
                  {isAiSuggesting ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-[#94a3b8]">
                      <Loader2 size={16} className="animate-spin" /> Suggesting smart answer...
                    </div>
                  ) : (
                    <div>
                      <p className="text-dark-theme text-sm leading-relaxed" style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        {aiSuggestedReplyText}
                      </p>
                      <button
                        onClick={() => {
                          setReplyText(aiSuggestedReplyText);
                          setAiSuggestionsDrawer(false);
                        }}
                        className="btn-primary"
                        style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }}
                      >
                        Apply to Reply input
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Composer Input box */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
                
                {/* Mode tabs: Reply vs Notes */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setComposerMode('reply')}
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      backgroundColor: composerMode === 'reply' ? '#00bfa5' : 'transparent',
                      color: composerMode === 'reply' ? 'white' : '#94a3b8'
                    }}
                  >
                    Reply Customer
                  </button>
                  <button
                    onClick={() => setComposerMode('note')}
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      backgroundColor: composerMode === 'note' ? '#eab308' : 'transparent',
                      color: composerMode === 'note' ? 'black' : '#94a3b8'
                    }}
                  >
                    Internal Note
                  </button>
                </div>

                <div className="flex gap-3 items-center">
                  
                  {/* AI Quick helper menu */}
                  <button
                    onClick={handleAiSuggestReply}
                    className="btn-secondary flex items-center justify-center"
                    style={{
                      borderRadius: '12px',
                      width: '44px',
                      height: '44px',
                      padding: 0,
                      backgroundColor: 'rgba(0,191,165,0.1)',
                      borderColor: 'transparent',
                      color: '#00bfa5'
                    }}
                    title="Suggest answer from Knowledge Base"
                  >
                    <Sparkles size={20} />
                  </button>

                  <div style={{ flex: 1, position: 'relative' }}>
                    
                    {/* Emoji Popup Box */}
                    {showEmojis && (
                      <div className="card" style={{ position: 'absolute', bottom: '60px', left: 0, padding: '10px', display: 'flex', gap: '8px', zIndex: 100 }}>
                        {emojiList.map(e => (
                          <button 
                            key={e} 
                            onClick={() => { setReplyText(prev => prev + e); setShowEmojis(false); }}
                            style={{ fontSize: '18px' }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Meta Template list Modal overlay */}
                    {showTemplates && (
                      <div className="card shadow-2xl" style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, zIndex: 100, maxHeight: '250px', overflowY: 'auto', padding: '12px' }}>
                        <div className="flex justify-between items-center mb-3 px-2">
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">Approved WhatsApp Templates</span>
                          <button onClick={() => setShowTemplates(false)} className="text-xs font-bold text-danger">Close</button>
                        </div>
                        {templates.map(t => (
                          <button
                            key={t.id}
                            className="text-left w-full p-2.5 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 flex flex-col mb-1"
                            onClick={() => {
                              setReplyText(t.body_content.replace(/\{\{1\}\}/g, selectedConv.customer_name || 'Friend'));
                              setShowTemplates(false);
                            }}
                          >
                            <span className="font-bold text-xs" style={{ fontFamily: 'monospace' }}>{t.template_name}</span>
                            <span className="text-xs text-muted truncate w-full">{t.body_content}</span>
                          </button>
                        ))}
                        {templates.length === 0 && <p className="text-xs text-muted p-2">No approved templates available.</p>}
                      </div>
                    )}

                    {/* Quick Replies selection menu shortcut */}
                    {showQuickReplies && (
                      <div className="card shadow-2xl" style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, zIndex: 100, padding: '12px' }}>
                        <div className="flex justify-between items-center mb-3 px-2">
                          <span className="text-[10px] font-black text-muted tracking-widest uppercase">Quick reply Shortcuts</span>
                          <button onClick={() => setShowQuickReplies(false)} className="text-xs font-bold text-danger">Close</button>
                        </div>
                        {quickRepliesList.map(q => (
                          <button
                            key={q.shortcut}
                            className="text-left w-full p-2 hover:bg-slate-50 rounded-lg flex justify-between items-center"
                            onClick={() => {
                              setReplyText(q.text);
                              setShowQuickReplies(false);
                            }}
                          >
                            <span className="font-bold text-xs" style={{ color: '#00bfa5' }}>{q.shortcut}</span>
                            <span className="text-xs text-muted truncate flex-1 ml-3">{q.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder={composerMode === 'note' ? 'Add internal comment (yellow bubble)...' : `Reply to ${selectedConv.customer_name || selectedConv.customer_phone}...`}
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(e.target.value);
                        setIsTyping(true);
                        if (e.target.value.endsWith('/')) {
                          setShowQuickReplies(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        height: '44px',
                        paddingLeft: '14px',
                        paddingRight: '120px',
                        color: 'white',
                        margin: 0
                      }}
                    />

                    {/* Composer controls */}
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => setShowEmojis(!showEmojis)} 
                        style={{ padding: '6px', color: '#94a3b8' }}
                        title="Add emoji"
                      >
                        <Smile size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const url = window.prompt("Enter an attachment media link URL (e.g. image / PDF):");
                          if (url) setMediaUrl(url);
                        }} 
                        style={{ padding: '6px', color: mediaUrl ? '#00bfa5' : '#94a3b8' }}
                        title="Attach media URL link"
                      >
                        <Paperclip size={16} />
                      </button>
                      {selectedConv.channel === 'WhatsApp' && composerMode === 'reply' && (
                        <button 
                          onClick={() => setShowTemplates(!showTemplates)} 
                          style={{ fontSize: '9px', fontWeight: 'bold', padding: '4px 6px', backgroundColor: '#334155', color: '#f1f5f9', borderRadius: '4px' }}
                          title="Inject WhatsApp Cloud templates"
                        >
                          TPL
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Send trigger */}
                  <button
                    onClick={handleSend}
                    className="btn-primary flex items-center justify-center"
                    style={{
                      borderRadius: '12px',
                      width: '44px',
                      height: '44px',
                      padding: 0,
                      backgroundColor: composerMode === 'note' ? '#eab308' : '#00bfa5',
                      color: composerMode === 'note' ? 'black' : 'white'
                    }}
                  >
                    <Send size={18} />
                  </button>

                </div>

                {/* AI Assistant drawer triggers */}
                {composerMode === 'reply' && replyText.trim() && (
                  <div className="flex gap-2 mt-3" style={{ fontSize: '10px' }}>
                    <span className="subtext-dark-theme font-bold flex items-center gap-1"><Sparkles size={10} /> AI Polisher:</span>
                    <button onClick={() => handleAiRewrite('Professional')} style={{ color: '#60a5fa', fontWeight: 'bold' }}>👔 Professional</button>
                    <button onClick={() => handleAiRewrite('Friendly')} style={{ color: '#34d399', fontWeight: 'bold' }}>😊 Friendly</button>
                    <button onClick={() => handleAiRewrite('Short')} style={{ color: '#a78bfa', fontWeight: 'bold' }}>⚡ Shorten</button>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div style={{ padding: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,191,165,0.08)', color: '#00bfa5' }}>
                <MessageCircle size={52} />
              </div>
              <h3 className="text-dark-theme">Shared Team Inbox</h3>
              <p className="text-muted text-sm text-center" style={{ maxWidth: '300px' }}>
                Select a customer chat thread from folders to view messages, assign owners, and reply.
              </p>
            </div>
          )}
        </div>

        {/* PANEL 4: CRM SIDEBAR (RIGHT PANE) */}
        <div className="inbox-crm-pane">
          {selectedConv ? (
            <>
              {/* Profile Selection Tabs */}
              <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                <button
                  onClick={() => setActiveRightTab('CRM')}
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: activeRightTab === 'CRM' ? '#00bfa5' : '#94a3b8',
                    borderBottom: activeRightTab === 'CRM' ? '2px solid #00bfa5' : 'none',
                    paddingBottom: '6px',
                    flex: 1
                  }}
                >
                  CRM Profile
                </button>
                <button
                  onClick={() => setActiveRightTab('KB')}
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: activeRightTab === 'KB' ? '#00bfa5' : '#94a3b8',
                    borderBottom: activeRightTab === 'KB' ? '2px solid #00bfa5' : 'none',
                    paddingBottom: '6px',
                    flex: 1
                  }}
                >
                  AI Copilot Training
                </button>
              </div>

              {activeRightTab === 'CRM' ? (
                <div>
                  {/* 1. Customer profile photo block */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }} className="crm-section">
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#00bfa5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 12px' }}>
                      {selectedConv.customer_name?.charAt(0) || '?'}
                    </div>
                    <h3 className="text-dark-theme" style={{ fontSize: '16px' }}>{selectedConv.customer_name || 'Unknown Contact'}</h3>
                    <span className="subtext-dark-theme" style={{ fontSize: '12px' }}>{selectedConv.customer_phone}</span>
                  </div>

                  {/* 2. Customer fields info */}
                  <div className="crm-section">
                    <div className="form-group mb-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block">Customer Name</label>
                      {isEditingCRM ? (
                        <input type="text" className="dark-input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                      ) : (
                        <p className="text-dark-theme font-medium mt-1">{selectedConv.customer_name || 'Unknown'}</p>
                      )}
                    </div>

                    <div className="form-group mb-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block">Email Address</label>
                      {isEditingCRM ? (
                        <input type="email" className="dark-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                      ) : (
                        <p className="text-dark-theme font-medium mt-1">{selectedConv.customer_email || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="form-group mb-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block">Smart Tags</label>
                      {isEditingCRM ? (
                        <input type="text" className="dark-input" placeholder="comma separated values" value={contactTags} onChange={(e) => setContactTags(e.target.value)} />
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedConv.customer_tags?.split(',').filter(t => t.trim()).map(t => (
                            <span key={t} className="badge badge-primary" style={{ fontSize: '9px', padding: '3px 8px' }}>{t.trim()}</span>
                          )) || <span className="text-xs text-muted">No tags added</span>}
                        </div>
                      )}
                    </div>

                    <div className="form-group mb-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block">CRM Notes</label>
                      {isEditingCRM ? (
                        <textarea className="dark-input" rows={3} value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} />
                      ) : (
                        <p className="subtext-dark-theme text-xs italic mt-1 leading-relaxed">{selectedConv.customer_notes || 'No CRM profile notes.'}</p>
                      )}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      {isEditingCRM ? (
                        <div className="flex gap-2">
                          <button className="btn-primary flex-1 py-1.5 text-xs" onClick={handleSaveCRM}>Save</button>
                          <button className="btn-secondary py-1.5 text-xs" onClick={() => setIsEditingCRM(false)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn-secondary w-full py-1.5 text-xs font-bold" onClick={() => setIsEditingCRM(true)}>Edit Profile</button>
                      )}
                    </div>
                  </div>

                  {/* 3. Lifecycle state selection */}
                  <div className="crm-section">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Lifecycle Stage</label>
                    <select
                      value={lifecycleStage}
                      onChange={(e) => {
                        setLifecycleStage(e.target.value);
                        showToast(`Lead stage updated to: ${e.target.value}`);
                      }}
                      style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px', borderRadius: '8px', width: '100%', margin: 0 }}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  {/* 4. SLA indicators tracker */}
                  <div>
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-3">SLA Tracking Performance</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '10px', fontSize: '12px' }}>
                      <div className="flex justify-between items-center">
                        <span className="subtext-dark-theme">First Response:</span>
                        <span className="text-dark-theme font-bold" style={{ color: '#10b981' }}>🟢 Good (&lt; 2m)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="subtext-dark-theme">Resolution Time:</span>
                        <span className="text-dark-theme font-bold" style={{ color: '#f59e0b' }}>🟡 Warning (5m)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Knowledge Base training workspace tab */}
                  <h3 className="text-dark-theme font-bold mb-2" style={{ fontSize: '14px' }}>Train AI Agent</h3>
                  <p className="subtext-dark-theme text-xs leading-relaxed mb-4">
                    Submit training articles to teach InfoKart's AI. When you trigger AI suggestions in chat, it will consult these answers.
                  </p>

                  <div className="form-group mb-3">
                    <label className="label">Training Type</label>
                    <select
                      value={kbType}
                      onChange={(e) => setKbType(e.target.value)}
                      style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px', borderRadius: '8px', width: '100%', margin: 0 }}
                    >
                      <option value="faq">FAQ Answer Pair</option>
                      <option value="url">Website URL Crawl</option>
                      <option value="text">Raw Text Document</option>
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label className="label">Title / Source URL</label>
                    <input
                      type="text"
                      className="dark-input"
                      placeholder="e.g. Return Policy"
                      value={kbTitle}
                      onChange={(e) => setKbTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label className="label">Knowledge Content</label>
                    <textarea
                      className="dark-input"
                      rows={4}
                      placeholder="Write core facts or insert answers..."
                      value={kbContent}
                      onChange={(e) => setKbContent(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleAddKb}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2"
                    disabled={isAddingKb || !kbContent.trim()}
                  >
                    {isAddingKb ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    Add Training Data
                  </button>

                  <h3 className="text-dark-theme font-bold mt-6 mb-3" style={{ fontSize: '13px' }}>Current Training pool ({kbArticles.length})</h3>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {kbArticles.map((k, i) => (
                      <div key={i} style={{ backgroundColor: '#1e293b', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', fontSize: '11px' }}>
                        <span style={{ fontWeight: 'bold', color: '#00bfa5', textTransform: 'uppercase' }}>{k.source_type}</span>
                        <div className="text-dark-theme font-semibold truncate mt-0.5">{k.title}</div>
                        <div className="subtext-dark-theme truncate mt-0.5">{k.content}</div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
              <Users size={44} className="mb-3 text-muted" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Customer CRM Profile</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeamInbox;
