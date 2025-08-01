import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';

import './App.css'
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanelPage from './pages/AdminPanelPage';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import NewCompanyPage from './pages/NewCompanyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AddEventPage from './pages/AddEventPage';
import EventsPage from './pages/EventsPage';
import { LanguageProvider } from './context/LanguageContext';
import EditCompanyPage from './pages/EditCompanyPage';
import ReportsPage from './pages/ReportsPage';
import ContactsPage from './pages/ContactsPage'; // Make sure this is imported
import DailyCallsPage from './pages/DailyCallsPage'; // <-- Add this import
import { CallNotificationProvider } from './context/CallNotificationContext'; // <-- IMPORT NEW PROVIDER
import CallNotificationModal from './components/CallNotificationModal'; // <-- IMPORT NEW MODAL

// This component now correctly uses the context because it will be rendered INSIDE AuthProvider
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Authenticating...</div>;
  }

  return currentUser ? children : <Navigate to="/login" />;
};

// This component also correctly uses the context
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// This new component contains the part of your app that needs the auth context
function AppContent() {
  return (
    <>
      <Header />
      <CallNotificationModal /> {/* <-- RENDER THE MODAL HERE */}
      <main>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
          <Route path="/contacts" element={<PrivateRoute><ContactsPage /></PrivateRoute>} />
          <Route path="/daily-calls" element={<PrivateRoute><DailyCallsPage /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
          <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/admin-panel" element={<PrivateRoute><AdminPanelPage /></PrivateRoute>} />
          <Route path="/companies" element={<PrivateRoute><CompaniesPage /></PrivateRoute>} />
          <Route path="/companies/new" element={<PrivateRoute><NewCompanyPage /></PrivateRoute>} />
          <Route path="/companies/:companyId" element={<PrivateRoute><CompanyDetailPage /></PrivateRoute>} />
          <Route path="/companies/edit/:companyId" element={<PrivateRoute><EditCompanyPage /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          <Route path="/events/new" element={<PrivateRoute><AddEventPage /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          
          {/* Redirects and Catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2>404 - Page Not Found</h2>
            </div>
          } />
        </Routes>
      </main>
      <NotificationContainer />
    </>
  );
}

// The main App component now sets up all the providers
function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <LanguageProvider>
            {/* --- WRAP AppContent WITH THE NEW PROVIDER --- */}
            <CallNotificationProvider>
              <AppContent />
            </CallNotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;