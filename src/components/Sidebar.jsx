import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Bot, Settings, Inbox, Users, LayoutTemplate, MessageCircle } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/inbox', label: 'Team Inbox', icon: Inbox },
    { path: '/whatsapp-chatbot', label: 'WhatsApp Bot', icon: MessageCircle },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/campaigns', label: 'Bulk Campaigns', icon: Megaphone },
    { path: '/templates', label: 'Message Templates', icon: LayoutTemplate },
    { path: '/ig-chatbot', label: 'Instagram Chatbot', icon: Bot },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--color-primary)', borderRadius: '6px' }}></div>
          Info<span>kart</span>
        </div>
      </div>
      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon">
              <item.icon size={20} />
            </div>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
