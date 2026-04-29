import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-nav">
          <div className="user-profile">
            <button className="btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
              <Bell size={20} />
            </button>
            <div className="avatar">K</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Karthik</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>Admin</span>
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
