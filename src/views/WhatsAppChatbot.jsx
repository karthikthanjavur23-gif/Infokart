import React, { useState, useEffect, useRef } from 'react';
import { 
  ToggleLeft, ToggleRight, LayoutTemplate, Workflow, Settings, MessageCircle, 
  Send, X, Plus, Trash2, Save, Play, Sparkles, Cpu, Layers, Activity, 
  HelpCircle, Check, Database, BookOpen, UserCheck, Smile, Volume2, 
  ArrowRight, Shuffle, Code, FileText, Bot, Compass, RefreshCw, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import { sendWhatsAppMessage } from '../api/whatsapp';
import { API_BASE_URL, getAuthHeaders } from '../api/config';

const WhatsAppChatbot = () => {
  // Navigation & Workspace Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Bot Profiles State
  const [bots, setBots] = useState([]);
  const [activeBot, setActiveBot] = useState(null);
  const [newBotName, setNewBotName] = useState('');
  const [showNewBotModal, setShowNewBotModal] = useState(false);
  const [isBotToggling, setIsBotToggling] = useState(false);

  // Bot Visual Flow State
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedConnectionIndex, setSelectedConnectionIndex] = useState(null);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  
  // Canvas Viewport Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [activeLinkSource, setActiveLinkSource] = useState(null); // { nodeId, conditionIndex, condition }

  // AI assistant generate state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAiFlow, setIsGeneratingAiFlow] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // AI Profile Settings state
  const [aiMode, setAiMode] = useState('BALANCED');
  const [aiTone, setAiTone] = useState('FRIENDLY');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // FAQ/Knowledge Base state
  const [kbItems, setKbItems] = useState([]);
  const [newFaq, setNewFaq] = useState({ title: '', content: '' });
  const [kbSourceType, setKbSourceType] = useState('FAQ');
  const [isTraining, setIsTraining] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalConversations: 0,
    botResolved: 0,
    humanEscalated: 0,
    aiResponses: 0,
    resolutionRate: 80
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Simulator State
  const [testNumber, setTestNumber] = useState('');
  const [simulatorMessage, setSimulatorMessage] = useState('');
  const [simulatorLogs, setSimulatorLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Refs for tracking drag handlers
  const canvasRef = useRef(null);

  // 1. Initial Data Fetching
  useEffect(() => {
    fetchBots();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeBot) {
      fetchFlow(activeBot.id);
      fetchKnowledgeBase(activeBot.id);
      setAiMode(activeBot.ai_mode || 'BALANCED');
      setAiTone(activeBot.ai_tone || 'FRIENDLY');
    } else {
      setNodes([]);
      setConnections([]);
      setKbItems([]);
    }
  }, [activeBot]);

  const fetchBots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/list`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (Array.isArray(data)) {
        setBots(data);
        if (data.length > 0) {
          // Select active bot or first bot
          const active = data.find(b => b.status === 'ACTIVE') || data[0];
          setActiveBot(active);
        }
      }
    } catch (e) {
      console.error("Failed to fetch bots", e);
    }
  };

  const fetchFlow = async (botId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/flow?bot_id=${botId}`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data && Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        setConnections(data.connections || []);
      } else {
        setNodes([]);
        setConnections([]);
      }
    } catch (e) {
      console.error("Failed to fetch bot flow", e);
    }
  };

  const fetchKnowledgeBase = async (botId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/kb-list?bot_id=${botId}`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (Array.isArray(data)) {
        setKbItems(data);
      }
    } catch (e) {
      console.error("Failed to fetch knowledge base", e);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/analytics`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data && !data.error) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 2. Bot Profile Handlers
  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/create`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_name: newBotName })
      });
      const data = await response.json();
      if (data.success) {
        setNewBotName('');
        setShowNewBotModal(false);
        await fetchBots();
      }
    } catch (e) {
      console.error("Failed to create bot", e);
    }
  };

  const handleToggleBotStatus = async () => {
    if (!activeBot) return;
    const newStatus = activeBot.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsBotToggling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/publish`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: activeBot.id, status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        // Refresh bots list and update selected
        const updatedBots = bots.map(b => {
          if (b.id === activeBot.id) return { ...b, status: newStatus };
          if (newStatus === 'ACTIVE') return { ...b, status: 'INACTIVE' }; // Deactivate others
          return b;
        });
        setBots(updatedBots);
        setActiveBot({ ...activeBot, status: newStatus });
      }
    } catch (e) {
      console.error("Failed to toggle bot status", e);
    } finally {
      setIsBotToggling(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm("Are you sure you want to delete this bot flow profile?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/delete/${botId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        const filtered = bots.filter(b => b.id !== botId);
        setBots(filtered);
        if (filtered.length > 0) {
          setActiveBot(filtered[0]);
        } else {
          setActiveBot(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete bot", e);
    }
  };

  // 3. Visual Canvas Mechanics
  const handleCanvasMouseDown = (e) => {
    // Left-click on canvas background triggers pan
    if (e.button === 0 && e.target === canvasRef.current || e.target.tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeId) {
      setNodes(prev => prev.map(node => {
        if (node.id === draggingNodeId) {
          return {
            ...node,
            x: Math.round((e.clientX - dragStart.x) / zoom),
            y: Math.round((e.clientY - dragStart.y) / zoom)
          };
        }
        return node;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeDragStart = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragStart({
      x: e.clientX - node.x * zoom,
      y: e.clientY - node.y * zoom
    });
  };

  // Add standard nodes
  const handleAddNode = (type) => {
    const uniqueId = `node_${Date.now()}`;
    const labels = {
      Message: 'Text Message',
      Buttons: 'Quick Replies',
      Question: 'User Input Question',
      Condition: 'Keyword Filter',
      'AI Reply': 'AI KB Query',
      'Assign Agent': 'Human Takeover',
      End: 'Terminator'
    };
    
    // Spawn at the center of the viewport
    const x = Math.round((400 - pan.x) / zoom);
    const y = Math.round((250 - pan.y) / zoom);

    const newNode = {
      id: uniqueId,
      type,
      label: labels[type] || type,
      content: type === 'Assign Agent' ? 'Transferring you to a live support agent...' : 'Hello! Write your message here.',
      x,
      y
    };

    if (type === 'Buttons') {
      newNode.buttons = ['Option A', 'Option B'];
    } else if (type === 'Question') {
      newNode.crm_action = null;
    } else if (type === 'Condition') {
      newNode.content = 'Verify if user text matches:';
    }

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(uniqueId);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    // Remove connections associated with this node
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Link Ports Mechanics
  const handlePortClick = (nodeId, portIndex = null, condition = null) => {
    if (!activeLinkSource) {
      // Set link source
      setActiveLinkSource({ nodeId, portIndex, condition });
    } else {
      // Connect to target input port
      if (activeLinkSource.nodeId !== nodeId) {
        // Prevent duplicate connection
        const duplicate = connections.some(c => 
          c.from === activeLinkSource.nodeId && 
          c.to === nodeId && 
          c.condition === activeLinkSource.condition
        );

        if (!duplicate) {
          const newConn = {
            from: activeLinkSource.nodeId,
            to: nodeId,
            condition: activeLinkSource.condition || null
          };
          setConnections(prev => [...prev, newConn]);
        }
      }
      setActiveLinkSource(null);
    }
  };

  const handleDeleteConnection = (index) => {
    setConnections(prev => prev.filter((_, i) => i !== index));
    setSelectedConnectionIndex(null);
  };

  // Save Flow to DB
  const handleSaveFlow = async () => {
    if (!activeBot) return;
    setIsSavingFlow(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/flow`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: activeBot.id,
          flow_json: JSON.stringify({ nodes, connections })
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Bot visual automation flow saved successfully!");
      }
    } catch (e) {
      console.error("Failed to save flow", e);
      alert("Error saving bot flow. Please try again.");
    } finally {
      setIsSavingFlow(false);
    }
  };

  // 4. Gemini AI Flow Generator API Call
  const handleGenerateAiFlow = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAiFlow(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/generate-ai-flow`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json();
      if (data && Array.isArray(data.nodes)) {
        // Redraw canvas with AI nodes
        setNodes(data.nodes);
        setConnections(data.connections || []);
        setShowAiDrawer(false);
        setAiPrompt('');
        alert("Gemini has generated and loaded the automation blueprint onto the canvas!");
      } else {
        alert("Failed to compile AI response into canvas schema. Try another prompt.");
      }
    } catch (e) {
      console.error("Gemini Flow build error:", e);
      alert("AI generator offline or token limit exceeded.");
    } finally {
      setIsGeneratingAiFlow(false);
    }
  };

  // 5. Update AI Behavior (Mode & Tone)
  const handleSaveAiSettings = async () => {
    if (!activeBot) return;
    setIsSavingSettings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/update-settings`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: activeBot.id,
          ai_mode: aiMode,
          ai_tone: aiTone
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local bots list
        setBots(prev => prev.map(b => b.id === activeBot.id ? { ...b, ai_mode: aiMode, ai_tone: aiTone } : b));
        alert("AI intelligence preferences saved successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 6. FAQ & Training Database
  const handleAddKb = async (e) => {
    e.preventDefault();
    if (!newFaq.content.trim()) return;
    
    setIsTraining(true);
    try {
      const title = newFaq.title || (kbSourceType === 'FAQ' ? 'FAQ Q&A' : 'Trained Resource');
      const response = await fetch(`${API_BASE_URL}/api/bot/train`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: activeBot.id,
          source_type: kbSourceType,
          title,
          content: newFaq.content
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewFaq({ title: '', content: '' });
        await fetchKnowledgeBase(activeBot.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteKb = async (id) => {
    if (!window.confirm("Delete this trained document segment?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/kb-delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setKbItems(prev => prev.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 7. Live Debugger Simulation
  const handleSimulateChat = async (e) => {
    e.preventDefault();
    if (!testNumber.trim() || !simulatorMessage.trim()) return;
    
    const userMsg = simulatorMessage;
    setSimulatorMessage('');
    setIsSimulating(true);

    // Add user message locally immediately
    setSimulatorLogs(prev => [...prev, { sender: 'user', content: userMsg, timestamp: new Date().toLocaleTimeString() }]);

    try {
      // We hit the public send endpoint as a simulator
      const response = await fetch(`${API_BASE_URL}/api/public/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: testNumber,
          content: userMsg
        })
      });
      
      // Sleep briefly for database persistence and bot reply triggers
      await new Promise(r => setTimeout(r, 1500));
      
      // Fetch recent message history for this contact to extract bot answers
      const resMsg = await fetch(`${API_BASE_URL}/api/public/messages/${testNumber}`);
      const messages = await resMsg.json();
      
      if (Array.isArray(messages)) {
        // Map conversation
        const mapped = messages.map(m => ({
          sender: m.sender,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString()
        }));
        setSimulatorLogs(mapped);
      }
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Node Inspector Field Editor helper
  const updateSelectedNodeField = (field, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, [field]: value };
      }
      return n;
    }));
  };

  // SVG Line Path calculation
  const drawCurve = (x1, y1, x2, y2) => {
    const dx = Math.max(80, Math.abs(x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="chatbot-theme-wrapper">
      <style>{`
        .chatbot-theme-wrapper {
          --w-bg: #f8fafc;
          --w-surface: #ffffff;
          --w-surface-soft: #f1f5f9;
          --w-border: #e2e8f0;
          --w-text: #0f172a;
          --w-text-muted: #64748b;
          --w-accent: #7c3aed;
          --w-accent-rgb: 124, 58, 237;
          --w-accent-dark: #6d28d9;
          
          background-color: var(--w-bg);
          color: var(--w-text);
          padding: 24px;
          min-height: calc(100vh - 100px);
          font-family: 'Inter', sans-serif;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--w-border);
          margin-bottom: 24px;
        }

        .bot-pill {
          background-color: var(--w-surface-soft);
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-success);
          box-shadow: 0 0 10px var(--color-success);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
        }

        .workspace-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          color: var(--w-text-muted);
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background-color: var(--w-surface);
          color: var(--w-text);
        }

        .nav-item.active {
          background-color: var(--w-accent);
          color: #ffffff;
        }

        .workspace-content {
          background-color: var(--w-surface);
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          min-height: 550px;
          overflow: hidden;
          position: relative;
        }

        /* Dashboard Styles */
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 24px;
        }

        .dash-card {
          background-color: var(--w-bg);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s;
        }

        .dash-card:hover {
          transform: translateY(-2px);
          border-color: var(--w-accent);
        }

        /* Flow Builder Canvas */
        .canvas-container {
          width: 100%;
          height: 600px;
          position: relative;
          background-color: #ffffff;
          background-image: 
            radial-gradient(var(--w-border) 1px, transparent 1px);
          background-size: 20px 20px;
          overflow: hidden;
          cursor: grab;
          user-select: none;
        }

        .canvas-container:active {
          cursor: grabbing;
        }

        .canvas-toolbar {
          position: absolute;
          top: 16px;
          left: 16px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 10;
        }

        .canvas-controls {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .canvas-node {
          position: absolute;
          width: 230px;
          background-color: var(--w-surface);
          border: 2px solid var(--w-border);
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          z-index: 5;
          cursor: default;
        }

        .canvas-node.selected {
          border-color: var(--w-accent);
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.2);
        }

        .node-header {
          padding: 8px 12px;
          background-color: var(--w-surface-soft);
          border-bottom: 1px solid var(--w-border);
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          font-weight: 700;
          font-size: 13px;
        }

        .node-body {
          padding: 12px;
          font-size: 12px;
          color: var(--w-text-muted);
          min-height: 48px;
        }

        .node-port {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #cbd5e1;
          border: 2px solid var(--w-surface);
          position: absolute;
          cursor: pointer;
        }

        .node-port:hover {
          background-color: var(--w-accent);
          transform: scale(1.3);
        }

        .node-port.input {
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .node-port.output {
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .node-port-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          position: relative;
        }

        .node-port-row-output {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--w-accent);
          border: 1px solid var(--w-surface);
          position: absolute;
          right: -16px;
          cursor: pointer;
        }

        .node-port-row-output:hover {
          transform: scale(1.3);
        }

        /* Inspector panel */
        .inspector-panel {
          position: absolute;
          top: 0;
          right: 0;
          width: 320px;
          height: 100%;
          background-color: var(--w-surface);
          border-left: 1px solid var(--w-border);
          z-index: 12;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 20px rgba(0, 0, 0, 0.03);
        }

        /* AI Prompt Drawer */
        .ai-drawer {
          position: absolute;
          top: 0;
          right: 0;
          width: 360px;
          height: 100%;
          background-color: var(--w-surface-soft);
          border-left: 1px solid var(--w-border);
          z-index: 15;
          padding: 24px;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
        }

        /* Simulator Styles */
        .simulator-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          padding: 24px;
        }

        .chat-preview-box {
          height: 380px;
          background-color: var(--w-bg);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
        }

        .chat-bubble.inbound {
          background-color: var(--w-surface-soft);
          color: var(--w-text);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .chat-bubble.outbound {
          background-color: var(--w-accent);
          color: #ffffff;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        /* Dark form controls */
        .w-input, .w-textarea, .w-select {
          background-color: var(--w-bg);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: var(--w-text);
          padding: 10px 14px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .w-input:focus, .w-textarea:focus, .w-select:focus {
          border-color: var(--w-accent);
        }
      `}</style>

      {/* Top Header */}
      <div className="workspace-header">
        <div className="flex items-center gap-4">
          <Workflow size={32} className="text-[#7c3aed]" />
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">WhatsApp AI Bot Builder</h1>
            <p className="text-xs text-slate-500 mt-1">Design stateful customer interaction pathways and FAQ-powered agents</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeBot && (
            <div className="bot-pill">
              <span className="font-bold text-sm text-slate-700">{activeBot.bot_name}</span>
              <div className="flex items-center gap-2">
                <span className={activeBot.status === 'ACTIVE' ? 'active-dot' : 'w-2 h-2 rounded-full bg-slate-500'} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{activeBot.status}</span>
              </div>
              <button 
                onClick={handleToggleBotStatus}
                disabled={isBotToggling}
                className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all ${
                  activeBot.status === 'ACTIVE'
                    ? 'border-red-500/30 text-red-600 hover:bg-red-500/10'
                    : 'border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/10'
                }`}
              >
                {activeBot.status === 'ACTIVE' ? 'Deactivate' : 'Publish / Go Live'}
              </button>
            </div>
          )}

          <select 
            className="w-select bg-white border-slate-200 text-sm font-semibold rounded-xl text-slate-800 px-3 py-2 cursor-pointer"
            value={activeBot ? activeBot.id : ''}
            onChange={(e) => {
              const selected = bots.find(b => b.id === Number(e.target.value));
              if (selected) setActiveBot(selected);
            }}
          >
            {bots.map(b => (
              <option key={b.id} value={b.id}>{b.bot_name} ({b.status})</option>
            ))}
          </select>

          <button 
            onClick={() => setShowNewBotModal(true)}
            className="btn-primary flex items-center gap-2 py-2 text-sm"
            style={{ backgroundColor: 'var(--w-accent)' }}
          >
            <Plus size={16} /> New Bot
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="workspace-grid">
        {/* Navigation Sidebar */}
        <div className="workspace-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); fetchAnalytics(); }}
          >
            <Activity size={18} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <Workflow size={18} />
            <span>Bot Flow Canvas</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Cpu size={18} />
            <span>AI Settings</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => setActiveTab('kb')}
          >
            <BookOpen size={18} />
            <span>Knowledge Base</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
          >
            <Database size={18} />
            <span>Analytics & Logs</span>
          </div>
        </div>

        {/* Content Pane */}
        <div className="workspace-content">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Automation Performance</h2>
                <button 
                  onClick={fetchAnalytics}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  title="Reload Stats"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {analyticsLoading ? (
                <div className="text-center py-20 text-slate-500">Fetching analytics logs...</div>
              ) : (
                <>
                  <div className="dash-grid">
                    <div className="dash-card">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Automated Chats</p>
                      <h3 className="text-3xl font-black mt-2 text-slate-800">{analytics.totalConversations}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Unique customer sessions</p>
                    </div>
                    <div className="dash-card">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bot Resolved</p>
                      <h3 className="text-3xl font-black mt-2 text-[#7c3aed]">{analytics.botResolved}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Closed without agent escalation</p>
                    </div>
                    <div className="dash-card">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Human Escalations</p>
                      <h3 className="text-3xl font-black mt-2 text-orange-600">{analytics.humanEscalated}</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Transferred to Shared Team Inbox</p>
                    </div>
                    <div className="dash-card">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Resolution Rate</p>
                      <h3 className="text-3xl font-black mt-2 text-[#7c3aed]">{analytics.resolutionRate}%</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Industry benchmark is 75%</p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
                    {/* Bot selector & deletion logs */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <h3 className="text-sm font-bold mb-4">Trained Chatbot Profiles</h3>
                      <div className="flex flex-col gap-3">
                        {bots.map(b => (
                          <div key={b.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{b.bot_name}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">Created {new Date(b.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${b.status === 'ACTIVE' ? 'bg-[#7c3aed]/10 text-[#7c3aed]' : 'bg-slate-200 text-slate-500'}`}>{b.status}</span>
                              <button 
                                onClick={() => handleDeleteBot(b.id)} 
                                className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-200 transition"
                                title="Delete Bot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live simulator widget */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                      <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                        <span>Simulator Sandbox</span>
                        <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">Interactive Test</span>
                      </h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="w-input flex-1 bg-slate-100 border-slate-200" 
                            placeholder="Enter Test Phone (e.g. +919976893141)" 
                            value={testNumber}
                            onChange={e => setTestNumber(e.target.value)}
                          />
                          <button 
                            onClick={() => {
                              if (!testNumber) alert("Please enter a phone number to reset simulator session.");
                              else {
                                setSimulatorLogs([]);
                                alert(`Simulator session cleared for ${testNumber}`);
                              }
                            }}
                            className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                            title="Reset Thread"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>

                        <div className="chat-preview-box h-[180px] bg-slate-50 border-slate-200 p-3 rounded-lg overflow-y-auto flex flex-col gap-2">
                          {simulatorLogs.length === 0 ? (
                            <div className="text-slate-500 italic text-[11px] text-center my-auto">
                              No simulator logs. Enter phone number above and type your greeting below.
                            </div>
                          ) : (
                            simulatorLogs.map((log, idx) => (
                              <div key={idx} className={`chat-bubble text-[11px] max-w-[85%] ${log.sender === 'user' ? 'outbound' : 'inbound'}`}>
                                <p className="font-bold text-[9px] mb-0.5 text-slate-500 capitalize">{log.sender}</p>
                                <p className="whitespace-pre-wrap">{log.content}</p>
                                <span className="text-[8px] text-slate-500 float-right mt-1">{log.timestamp}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={handleSimulateChat} className="flex gap-2">
                          <input 
                            type="text" 
                            disabled={!testNumber}
                            className="w-input flex-1 bg-slate-100 border-slate-200" 
                            placeholder={testNumber ? "Type message and press Enter..." : "Enter phone number first"}
                            value={simulatorMessage}
                            onChange={e => setSimulatorMessage(e.target.value)}
                          />
                          <button 
                            type="submit"
                            disabled={isSimulating || !testNumber || !simulatorMessage.trim()}
                            className="p-2.5 bg-[#7c3aed] text-slate-800 rounded-lg hover:bg-[#6d28d9] transition font-bold"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: BOT BUILDER */}
          {activeTab === 'builder' && (
            <div className="relative">
              {/* Canvas Action Bar */}
              <div className="flex justify-between items-center p-3 bg-white border-b border-slate-200 z-10 relative">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Builder Node Toolbox:</span>
                  <div className="flex gap-1.5">
                    {['Message', 'Buttons', 'Question', 'Condition', 'AI Reply', 'Assign Agent', 'End'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleAddNode(type)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2 py-1 rounded transition"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowAiDrawer(true)}
                    className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-slate-800 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <Sparkles size={14} /> Copilot Autocomplete
                  </button>
                  <button 
                    onClick={handleSaveFlow}
                    disabled={isSavingFlow}
                    className="flex items-center gap-1.5 text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-slate-800 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <Save size={14} /> {isSavingFlow ? 'Saving...' : 'Save Flow'}
                  </button>
                </div>
              </div>

              {/* Whiteboard Interactive Canvas */}
              <div 
                ref={canvasRef}
                className="canvas-container"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              >
                {/* SVG Connections Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
                    </marker>
                    <marker id="arrow-selected" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6d28d9" />
                    </marker>
                  </defs>

                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {connections.map((conn, idx) => {
                      const fromNode = nodes.find(n => n.id === conn.from);
                      const toNode = nodes.find(n => n.id === conn.to);
                      if (!fromNode || !toNode) return null;

                      // Source ports stacked
                      let fromY = fromNode.y + 40;
                      if (fromNode.type === 'Buttons' && fromNode.buttons) {
                        const btnIdx = fromNode.buttons.indexOf(conn.condition);
                        if (btnIdx !== -1) {
                          fromY = fromNode.y + 82 + (btnIdx * 32) + 16;
                        }
                      } else if (fromNode.type === 'Condition') {
                        // Estimate condition matching index
                        const isFallback = !conn.condition;
                        fromY = fromNode.y + 82 + (isFallback ? 32 : 0) + 16;
                      }

                      const startX = fromNode.x + 230;
                      const startY = fromY;
                      const endX = toNode.x;
                      const endY = toNode.y + 35; // Input port

                      const pathString = drawCurve(startX, startY, endX, endY);
                      const isSelected = selectedConnectionIndex === idx;

                      // Midpoint for connection text label
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2;

                      return (
                        <g key={idx} className="pointer-events-auto cursor-pointer">
                          <path
                            d={pathString}
                            fill="none"
                            stroke={isSelected ? '#6d28d9' : '#a78bfa'}
                            strokeWidth={isSelected ? 3 : 2}
                            markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConnectionIndex(idx);
                              setSelectedNodeId(null);
                            }}
                          />
                          {conn.condition && (
                            <foreignObject x={midX - 50} y={midY - 14} width="100" height="28">
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConnectionIndex(idx);
                                  setSelectedNodeId(null);
                                }}
                                className={`text-[10px] text-center font-bold px-2 py-0.5 rounded-full border border-slate-200 truncate ${
                                  isSelected ? 'bg-blue-600 text-slate-800' : 'bg-white text-slate-600'
                                }`}
                              >
                                {conn.condition}
                              </div>
                            </foreignObject>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Draggable Node Cards */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    zIndex: 5
                  }}
                >
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div
                        key={node.id}
                        className={`canvas-node pointer-events-auto ${isSelected ? 'selected' : ''}`}
                        style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                          setSelectedConnectionIndex(null);
                        }}
                      >
                        <div 
                          className="node-header text-slate-800"
                          onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                          style={{
                            borderLeft: `4px solid ${
                              node.type === 'Start' ? '#8b5cf6' :
                              node.type === 'Message' ? '#3b82f6' :
                              node.type === 'Buttons' ? '#10b981' :
                              node.type === 'Question' ? '#f97316' :
                              node.type === 'AI Reply' ? '#6366f1' :
                              node.type === 'Assign Agent' ? '#f43f5e' : '#6b7280'
                            }`
                          }}
                        >
                          <span className="truncate">{node.label}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                            className="text-slate-500 hover:text-red-600 p-0.5 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="node-body">
                          {node.type === 'Message' && <p className="italic font-medium line-clamp-3">"{node.content}"</p>}
                          {node.type === 'Buttons' && (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[10px] font-bold text-slate-500 mb-1">{node.content}</p>
                              {(node.buttons || []).map((b, idx) => (
                                <div key={idx} className="node-port-row border border-slate-200 bg-slate-100 text-[10px] px-2 py-1 rounded text-slate-800 font-bold">
                                  <span>{b}</span>
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, idx, b); }}
                                    className="node-port-row-output" 
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {node.type === 'Question' && (
                            <div>
                              <p className="italic line-clamp-2">"{node.content}"</p>
                              <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-2 inline-block">
                                CRM: {node.crm_action || 'NONE'}
                              </span>
                            </div>
                          )}
                          {node.type === 'Condition' && (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[10px] font-bold text-slate-500 mb-1">Keywords Filter:</p>
                              <div className="node-port-row bg-slate-100 border border-slate-200 text-[10px] px-2 py-1 rounded text-slate-800">
                                <span>Condition Matches</span>
                                <div 
                                  onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, 0, 'Matches'); }}
                                  className="node-port-row-output"
                                />
                              </div>
                              <div className="node-port-row bg-slate-100 border border-slate-200 text-[10px] px-2 py-1 rounded text-slate-800">
                                <span>Else / Fallback</span>
                                <div 
                                  onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, 1, 'Else'); }}
                                  className="node-port-row-output"
                                />
                              </div>
                            </div>
                          )}
                          {node.type === 'AI Reply' && (
                            <div>
                              <p className="text-[11px] leading-relaxed">Runs RAG retrieval query against Trained FAQ logs</p>
                            </div>
                          )}
                          {node.type === 'Assign Agent' && (
                            <div>
                              <p className="text-red-600 font-bold">{node.content}</p>
                            </div>
                          )}
                          {node.type === 'Start' && <p className="text-slate-500 italic">Triggers on first inbound</p>}
                          {node.type === 'End' && <p className="text-slate-500 italic">Ends bot thread state</p>}
                        </div>

                        {/* Node Ports */}
                        {node.type !== 'Start' && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); handlePortClick(node.id); }}
                            className="node-port input" 
                          />
                        )}
                        {node.type !== 'Buttons' && node.type !== 'Condition' && node.type !== 'End' && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); handlePortClick(node.id); }}
                            className="node-port output" 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Viewport Zoom & Fit controls */}
              <div className="canvas-controls">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Zoom Out"><ZoomOut size={16} /></button>
                <span className="text-xs font-semibold px-1 py-1 text-slate-600">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Zoom In"><ZoomIn size={16} /></button>
                <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Reset View"><Maximize size={16} /></button>
              </div>

              {/* Canvas helper alert */}
              {activeLinkSource && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 z-10 shadow-2xl">
                  <span>Linking from Node "{nodes.find(n => n.id === activeLinkSource.nodeId)?.label}"... Select destination node input port</span>
                  <button onClick={() => setActiveLinkSource(null)} className="p-1 hover:bg-slate-100 rounded"><X size={12} /></button>
                </div>
              )}

              {/* Sidebar Inspector Panel */}
              {selectedNodeId && (
                <div className="inspector-panel p-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
                    <h3 className="font-bold text-sm text-slate-700">Configure Node Settings</h3>
                    <button onClick={() => setSelectedNodeId(null)} className="p-1 text-slate-500 hover:text-slate-800"><X size={16} /></button>
                  </div>

                  {(() => {
                    const node = nodes.find(n => n.id === selectedNodeId);
                    if (!node) return null;
                    return (
                      <div className="flex flex-col gap-4 overflow-y-auto flex-1">
                        <div className="form-group flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Node Title</label>
                          <input 
                            type="text" 
                            className="w-input" 
                            value={node.label}
                            onChange={(e) => updateSelectedNodeField('label', e.target.value)}
                          />
                        </div>

                        {/* Type specific fields */}
                        {(node.type === 'Message' || node.type === 'Question' || node.type === 'Assign Agent') && (
                          <div className="form-group flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Message Text</label>
                            <textarea 
                              rows={5} 
                              className="w-textarea"
                              value={node.content}
                              onChange={(e) => updateSelectedNodeField('content', e.target.value)}
                            />
                          </div>
                        )}

                        {node.type === 'Buttons' && (
                          <div className="flex flex-col gap-3">
                            <div className="form-group flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Message Prompt</label>
                              <input 
                                type="text" 
                                className="w-input" 
                                value={node.content}
                                onChange={(e) => updateSelectedNodeField('content', e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Quick Reply Options</label>
                              {(node.buttons || []).map((b, bIdx) => (
                                <div key={bIdx} className="flex gap-2">
                                  <input 
                                    type="text" 
                                    className="w-input flex-1 py-1 px-2 text-xs" 
                                    value={b}
                                    onChange={(e) => {
                                      const updated = [...node.buttons];
                                      updated[bIdx] = e.target.value;
                                      updateSelectedNodeField('buttons', updated);
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const updated = node.buttons.filter((_, idx) => idx !== bIdx);
                                      updateSelectedNodeField('buttons', updated);
                                      // Remove connections tied to this condition
                                      setConnections(prev => prev.filter(c => !(c.from === node.id && c.condition === b)));
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-red-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const updated = [...(node.buttons || []), `Option ${(node.buttons || []).length + 1}`];
                                  updateSelectedNodeField('buttons', updated);
                                }}
                                className="text-xs text-[#7c3aed] font-bold flex items-center gap-1.5 mt-1 self-start"
                              >
                                <Plus size={14} /> Add Quick Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {node.type === 'Question' && (
                          <div className="form-group flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Save Input to CRM Field</label>
                            <select 
                              className="w-select"
                              value={node.crm_action || ''}
                              onChange={(e) => updateSelectedNodeField('crm_action', e.target.value || null)}
                            >
                              <option value="">None / Ask Only</option>
                              <option value="SAVE_NAME">Contact Full Name</option>
                              <option value="SAVE_EMAIL">Contact Email</option>
                            </select>
                          </div>
                        )}

                        {node.type === 'Condition' && (
                          <div className="flex flex-col gap-3">
                            <div className="form-group flex flex-col gap-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Filter Keywords</label>
                              <input 
                                type="text" 
                                className="w-input"
                                placeholder="e.g. pricing,cost,quote" 
                                value={node.content}
                                onChange={(e) => updateSelectedNodeField('content', e.target.value)}
                              />
                              <p className="text-[9px] text-slate-500 leading-relaxed">
                                Checks if user message contains any comma-separated values to route to "Matches" transition.
                              </p>
                            </div>
                          </div>
                        )}

                        {node.type === 'AI Reply' && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex flex-col gap-2">
                            <p className="font-bold text-[#7c3aed]">AI Model Context Routing</p>
                            <p className="text-slate-500 text-[10px] leading-relaxed">
                              This node pauses the manual tree flow, extracts facts from the FAQ knowledge base (managed in settings tab), and feeds it to Gemini to reply contextually.
                            </p>
                          </div>
                        )}

                        <button 
                          onClick={() => handleDeleteNode(node.id)}
                          className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold text-red-600 transition"
                        >
                          <Trash2 size={14} /> Delete Selected Node
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Inspector Connection Panel */}
              {selectedConnectionIndex !== null && (
                <div className="inspector-panel p-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
                    <h3 className="font-bold text-sm text-slate-700">Connection Transition</h3>
                    <button onClick={() => setSelectedConnectionIndex(null)} className="p-1 text-slate-500 hover:text-slate-800"><X size={16} /></button>
                  </div>

                  {(() => {
                    const conn = connections[selectedConnectionIndex];
                    if (!conn) return null;
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    return (
                      <div className="flex flex-col gap-4 flex-1">
                        <div className="text-xs text-slate-500 leading-relaxed">
                          <p className="mb-2"><strong>From Node:</strong> {fromNode?.label || conn.from}</p>
                          <p className="mb-2"><strong>To Node:</strong> {toNode?.label || conn.to}</p>
                        </div>

                        {(fromNode?.type === 'Buttons' || fromNode?.type === 'Condition') && (
                          <div className="form-group flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Match Condition Value</label>
                            <input 
                              type="text" 
                              className="w-input text-xs" 
                              value={conn.condition || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConnections(prev => prev.map((c, i) => i === selectedConnectionIndex ? { ...c, condition: val } : c));
                              }}
                            />
                          </div>
                        )}

                        <button 
                          onClick={() => handleDeleteConnection(selectedConnectionIndex)}
                          className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold text-red-600 transition"
                        >
                          <Trash2 size={14} /> Delete Connection
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Gemini AI Drawer Panel */}
              {showAiDrawer && (
                <div className="ai-drawer">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
                    <h3 className="font-bold text-sm text-purple-600 flex items-center gap-2">
                      <Sparkles size={16} /> Gemini Flow Autocomplete
                    </h3>
                    <button onClick={() => setShowAiDrawer(false)} className="p-1 text-slate-500 hover:text-slate-800"><X size={16} /></button>
                  </div>

                  <div className="flex flex-col gap-4 flex-1">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Describe your customer campaign goal. Gemini will outline nodes, routing choices, and keywords, immediately drafting the visual flow onto the builder.
                    </p>
                    <textarea 
                      rows={8} 
                      className="w-textarea bg-white border-slate-200/60"
                      placeholder="e.g. Design a welcome sequence for a hair salon. Ask for name, show quick replies: Booking, Pricing, or Contact. If booking, send calendar link. If pricing, show cost list. Otherwise route to live human support."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                    />

                    <button
                      onClick={handleGenerateAiFlow}
                      disabled={isGeneratingAiFlow || !aiPrompt.trim()}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-slate-800 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/10"
                    >
                      {isGeneratingAiFlow ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Synthesizing Blueprint...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> Write Blueprint on Canvas
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI ASSISTANT SETTINGS */}
          {activeTab === 'ai' && (
            <div className="p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Cpu size={22} className="text-[#7c3aed]" /> AI Model Personalities
              </h2>

              <div className="max-w-2xl flex flex-col gap-8">
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl flex flex-col gap-6">
                  <div className="form-group flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Intelligence Retrieval Mode</label>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1">
                      Adjusts how strictly the bot answers from the Knowledge Base training logs vs creative general knowledge.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { mode: 'CONSERVATIVE', label: 'Strict Facts Only', desc: 'Queries KB only. Stops hallucinating completely.' },
                        { mode: 'BALANCED', label: 'Balanced RAG', desc: 'Natural conversations bound by training resources.' },
                        { mode: 'CREATIVE', label: 'Conversational LLM', desc: 'Rich responses but can fallback to broad knowledge.' }
                      ].map(item => (
                        <div 
                          key={item.mode}
                          onClick={() => setAiMode(item.mode)}
                          className={`p-4 rounded-xl border text-center cursor-pointer transition ${
                            aiMode === item.mode 
                              ? 'border-[#7c3aed] bg-[#7c3aed]/5 text-slate-800' 
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <span className="font-bold text-xs block mb-1">{item.label}</span>
                          <span className="text-[9px] leading-tight text-slate-500 block">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Conversational Accent & Tone</label>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1">
                      Applies conversational styles to match brand objectives.
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {['FRIENDLY', 'PROFESSIONAL', 'SALES', 'SUPPORT'].map(t => (
                        <div 
                          key={t}
                          onClick={() => setAiTone(t)}
                          className={`p-3 rounded-lg border text-center cursor-pointer font-bold text-xs uppercase transition ${
                            aiTone === t
                              ? 'border-[#7c3aed] bg-[#7c3aed]/5 text-[#7c3aed]' 
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveAiSettings}
                  disabled={isSavingSettings}
                  className="btn-primary py-3 px-6 text-sm font-bold self-start"
                  style={{ backgroundColor: 'var(--w-accent)' }}
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save AI Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KNOWLEDGE BASE */}
          {activeTab === 'kb' && (
            <div className="p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <BookOpen size={22} className="text-[#7c3aed]" /> FAQ Intelligence Knowledge Base
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
                {/* FAQ List */}
                <div>
                  <h3 className="text-sm font-bold mb-4">Trained Q&A Segments ({kbItems.length})</h3>
                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2">
                    {kbItems.length === 0 ? (
                      <div className="text-center py-20 bg-white/30 border border-dashed border-slate-200 rounded-xl text-slate-500 italic text-sm">
                        No training data logged for this chatbot. Add Q&A fields in the panel on the right.
                      </div>
                    ) : (
                      kbItems.map(item => (
                        <div key={item.id} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#7c3aed] uppercase tracking-wider">{item.source_type}</span>
                            <h4 className="text-sm font-bold text-slate-800 mt-2 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.content}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteKb(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Form */}
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl self-start">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Database size={16} className="text-[#7c3aed]" /> Index FAQ Record</h3>
                  <form onSubmit={handleAddKb} className="flex flex-col gap-4">
                    <div className="form-group flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Input Format</label>
                      <select 
                        className="w-select" 
                        value={kbSourceType} 
                        onChange={e => setKbSourceType(e.target.value)}
                      >
                        <option value="FAQ">FAQ Q&A Pair</option>
                        <option value="TEXT">System Prompt / Document Block</option>
                      </select>
                    </div>

                    <div className="form-group flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Title / Trigger Concept</label>
                      <input 
                        type="text" 
                        className="w-input" 
                        placeholder={kbSourceType === 'FAQ' ? "e.g. Return Policy" : "e.g. Business Description"}
                        value={newFaq.title}
                        onChange={e => setNewFaq({ ...newFaq, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Information Content</label>
                      <textarea 
                        rows={5} 
                        className="w-textarea" 
                        placeholder={kbSourceType === 'FAQ' ? "Provide answer details..." : "Enter descriptive facts about your business..."}
                        value={newFaq.content}
                        onChange={e => setNewFaq({ ...newFaq, content: e.target.value })}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isTraining || !newFaq.content.trim()}
                      className="w-full py-2.5 bg-[#7c3aed] text-slate-800 font-bold rounded-lg text-xs hover:bg-[#6d28d9] transition flex items-center justify-center gap-1.5"
                    >
                      {isTraining ? 'Training Model...' : 'Train AI Node'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS & LOGS */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Database size={22} className="text-[#7c3aed]" /> Chatbot Run Log Analytics
              </h2>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Aggregated Automation Performance Statistics</span>
                  <span className="text-[10px] bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 font-bold px-2.5 py-0.5 rounded-full">REALTIME RUNTIME LOGS</span>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Conversations</p>
                      <h4 className="text-2xl font-black mt-2 text-slate-800">{analytics.totalConversations}</h4>
                    </div>
                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bot Resolved</p>
                      <h4 className="text-2xl font-black mt-2 text-[#7c3aed]">{analytics.botResolved}</h4>
                    </div>
                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Responses</p>
                      <h4 className="text-2xl font-black mt-2 text-blue-600">{analytics.aiResponses}</h4>
                    </div>
                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Takeover Pauses</p>
                      <h4 className="text-2xl font-black mt-2 text-orange-600">{analytics.humanEscalated}</h4>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-bold mb-4">System Integration Settings</h3>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/20 text-xs flex flex-col gap-3 text-slate-600">
                      <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                        <span>Automation Framework Status</span>
                        <span className="font-bold text-green-600">ACTIVE & LISTENERS ATTACHED</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                        <span>Meta WhatsApp Cloud API Webhook Listener</span>
                        <span className="font-semibold text-slate-500">/webhook</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                        <span>Website Public Live Chat Endpoint</span>
                        <span className="font-semibold text-slate-500">/api/public/send</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Database Driver</span>
                        <span className="font-semibold text-slate-500">SQLite3 (Better-SQLite3)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Bot Creation */}
      {showNewBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold flex items-center gap-2"><Bot size={20} className="text-[#7c3aed]" /> Create Chatbot Profile</h3>
              <button onClick={() => setShowNewBotModal(false)} className="p-1 text-slate-500 hover:text-slate-800 rounded"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateBot} className="flex flex-col gap-4">
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Bot Profile Name</label>
                <input 
                  type="text" 
                  className="w-input" 
                  placeholder="e.g. Customer Support Bot"
                  value={newBotName}
                  onChange={e => setNewBotName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                disabled={!newBotName.trim()}
                className="w-full py-3 bg-[#7c3aed] text-slate-800 font-bold rounded-lg text-sm hover:bg-[#6d28d9] transition"
              >
                Create Bot Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppChatbot;
