import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Megaphone, Bot, Settings, Inbox, 
  Users, LayoutTemplate, MessageCircle, Sparkles, Zap, Shield, ClipboardList,
  Search, Bell, LogOut, ChevronDown, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountSwitcher from './AccountSwitcher';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter items dynamically using sidebar search box
  const filteredSections = sections.map(section => {
    const items = section.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar">
      {/* Brand area */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">
            <Zap size={14} color="white" fill="white" />
          </div>
          <span>Info</span>kart
        </div>
      </div>

      {/* Switcher block */}
      <div className="sidebar-switcher-container">
        <AccountSwitcher />
      </div>

      {/* Sidebar search bar */}
      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search nav..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Menu scroll area */}
      <nav className="nav-menu custom-scrollbar">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        {filteredSections.length === 0 && (
          <div className="no-matches">No matches found</div>
        )}
      </nav>

      {/* Profile and actions footer */}
      <div className="sidebar-footer">
        <div className="footer-profile">
          <div className="avatar-small">{user?.name?.charAt(0) || 'U'}</div>
          <div className="profile-details">
            <p className="profile-name">{user?.name || 'User'}</p>
            <p className="profile-email">{user?.role || 'Member'}</p>
          </div>
          <button 
            onClick={logout} 
            className="footer-btn text-slate-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
