import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardOverview from './views/DashboardOverview';
import BulkCampaigns from './views/BulkCampaigns';
import TeamInbox from './views/TeamInbox';
import Contacts from './views/Contacts';
import Templates from './views/Templates';
import Settings from './views/Settings';
import CampaignCreate from './views/CampaignCreate';
import CampaignDetails from './views/CampaignDetails';
import KnowledgeBase from './views/KnowledgeBase';
import AiAgent from './views/AiAgent';
import Analytics from './views/Analytics';
import Billing from './views/Billing';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './views/Login';
import LiveChat from './views/LiveChat';

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
          <Route path="/livechat" element={<LiveChat />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="inbox" element={<TeamInbox />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="campaigns" element={<BulkCampaigns />} />
            <Route path="campaigns/create" element={<CampaignCreate />} />
            <Route path="campaigns/:id" element={<CampaignDetails />} />
            <Route path="templates" element={<Templates />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="ai-agent" element={<AiAgent />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
