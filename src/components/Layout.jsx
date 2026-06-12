import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './Layout.css';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  useNotifications();
  
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

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-nav">
          <div className="top-nav-left">
            <span className="breadcrumb-main">{getPageTitle()}</span>
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
    </div>
  );
};

export default Layout;
