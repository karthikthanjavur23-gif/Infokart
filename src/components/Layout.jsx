import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import AccountSwitcher from './AccountSwitcher';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  useNotifications();
  
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-nav">
          <div className="flex items-center gap-6">
            <AccountSwitcher />
          </div>
          <div className="user-profile">
            <button className="btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
              <Bell size={20} />
            </button>
            <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name || 'User'}</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>{user?.role || 'Member'}</span>
            </div>
            <button className="btn-secondary" onClick={logout} style={{ marginLeft: '12px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
              Logout
            </button>
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
