import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept global fetch calls to check for unauthorized or forbidden statuses (expired/invalid tokens)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const res = await originalFetch(...args);
    if (res.status === 401 || res.status === 403) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (!url.includes('/api/auth/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return res;
  } catch (err) {
    throw err;
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

