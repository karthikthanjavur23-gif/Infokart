import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardOverview from './views/DashboardOverview';
import BulkCampaigns from './views/BulkCampaigns';
import InstagramChatbot from './views/InstagramChatbot';
import TeamInbox from './views/TeamInbox';
import Contacts from './views/Contacts';
import Templates from './views/Templates';
import Settings from './views/Settings';
import WhatsAppChatbot from './views/WhatsAppChatbot';
import CampaignCreate from './views/CampaignCreate';
import CampaignDetails from './views/CampaignDetails';
import MarketingHelper from './views/MarketingHelper';
import TeamManagement from './views/TeamManagement';
import SystemAudit from './views/SystemAudit';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './views/Login';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="inbox" element={<TeamInbox />} />
            <Route path="marketing-helper" element={<MarketingHelper />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="campaigns" element={<BulkCampaigns />} />
            <Route path="campaigns/create" element={<CampaignCreate />} />
            <Route path="campaigns/:id" element={<CampaignDetails />} />
            <Route path="templates" element={<Templates />} />
            <Route path="ig-chatbot" element={<InstagramChatbot />} />
            <Route path="whatsapp-chatbot" element={<WhatsAppChatbot />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="audit" element={<SystemAudit />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
