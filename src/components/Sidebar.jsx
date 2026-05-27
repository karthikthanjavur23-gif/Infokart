import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Megaphone, Bot, Settings, Inbox, 
  Users, LayoutTemplate, MessageCircle, Sparkles, Zap, Shield, ClipboardList
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const sections = [
    {
      title: 'Growth & Engagement',
      items: [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/marketing-helper', label: 'AI Workspace', icon: Sparkles, badge: 'PRO' },
        { path: '/campaigns', label: 'Broadcasts', icon: Megaphone },
      ]
    },
    {
      title: 'Customer Operations',
      items: [
        { path: '/inbox', label: 'Team Inbox', icon: Inbox },
        { path: '/contacts', label: 'CRM Contacts', icon: Users },
        { path: '/templates', label: 'Library', icon: LayoutTemplate },
      ]
    },
    {
      title: 'Automation',
      items: [
        { path: '/whatsapp-chatbot', label: 'WhatsApp Bot', icon: MessageCircle },
        { path: '/ig-chatbot', label: 'Instagram AI', icon: Bot },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/team', label: 'Team Infrastructure', icon: Shield },
        { path: '/audit', label: 'System Audit Logs', icon: ClipboardList },
        { path: '/settings', label: 'Infrastructure', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          Info<span>kart</span>
        </div>
      </div>
      <nav className="nav-menu">
        {sections.map((section, idx) => (
          <div key={idx} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <item.icon size={18} />
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="pro-card">
          <div className="font-bold text-xs mb-1">Meta Business Partner</div>
          <div className="text-[10px] opacity-70">Verified Integration</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
