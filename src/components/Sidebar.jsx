import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Megaphone, Bot, Settings, Inbox, 
  Users, LayoutTemplate, MessageCircle, Sparkles, Zap, Shield, ClipboardList,
  Search, Bell, LogOut, ChevronDown, ChevronLeft, ChevronRight, X, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountSwitcher from './AccountSwitcher';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = [
    {
      title: 'Workspace',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/inbox', label: 'WhatsApp Inbox', icon: Inbox },
        { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
        { path: '/contacts', label: 'Contacts', icon: Users },
      ]
    },
    {
      title: 'AI Platform',
      items: [
        { path: '/knowledge-base', label: 'Knowledge Base', icon: ClipboardList },
        { path: '/ai-agent', label: 'AI Agent', icon: Sparkles, badge: 'ACTIVE' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/analytics', label: 'Analytics', icon: Bot },
        { path: '/billing', label: 'Billing', icon: CreditCard },
        { path: '/settings', label: 'Settings', icon: Settings },
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
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand area */}
      <div className="sidebar-header">
        {!isCollapsed ? (
          <div className="brand">
            <div className="brand-logo" style={{ backgroundColor: '#7c3aed' }}>
              <Sparkles size={14} color="white" fill="white" />
            </div>
            <span>Spark</span>AI
          </div>
        ) : (
          <div className="brand-logo" style={{ margin: '0 auto', backgroundColor: '#7c3aed' }}>
            <Sparkles size={14} color="white" fill="white" />
          </div>
        )}
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Switcher block */}
      {!isCollapsed ? (
        <div className="sidebar-switcher-container">
          <AccountSwitcher />
        </div>
      ) : (
        <div className="sidebar-collapsed-switcher" onClick={() => setIsCollapsed(false)} title="Switch Line">
          <MessageCircle size={18} className="text-primary" />
        </div>
      )}

      {/* Sidebar search bar */}
      {!isCollapsed ? (
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
      ) : (
        <div className="sidebar-collapsed-search" onClick={() => setIsCollapsed(false)} title="Search Navigation">
          <Search size={16} />
        </div>
      )}

      {/* Menu scroll area */}
      <nav className="nav-menu custom-scrollbar">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="nav-section">
            {!isCollapsed && <div className="nav-section-title">{section.title}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {!isCollapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        {filteredSections.length === 0 && !isCollapsed && (
          <div className="no-matches">No matches found</div>
        )}
      </nav>

      {/* Profile and actions footer */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="footer-profile">
            <div className="avatar-small">{user?.name?.charAt(0) || 'U'}</div>
            <div className="profile-details">
              <p className="profile-name">{user?.name || 'User'}</p>
              <p className="profile-email">{user?.role || 'Member'}</p>
            </div>
            <button 
              onClick={logout} 
              className="footer-btn"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="footer-profile-collapsed">
            <div className="avatar-small" style={{ marginBottom: '12px' }}>{user?.name?.charAt(0) || 'U'}</div>
            <button 
              onClick={logout} 
              className="footer-btn-collapsed"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
