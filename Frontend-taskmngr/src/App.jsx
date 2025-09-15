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
//import Header from './components/Header';  #out due to sidebar navigation 
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import NewCompanyPage from './pages/NewCompanyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AddEventPage from './pages/AddEventPage';
import EventsPage from './pages/EventsPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import EditCompanyPage from './pages/EditCompanyPage';
import ReportsPage from './pages/ReportsPage';
import ContactsPage from './pages/ContactsPage';
import DailyCallsPage from './pages/DailyCallsPage';
import ProjectsPage from './pages/ProjectsPage'; // <-- Add this import
import { CallNotificationProvider } from './context/CallNotificationContext';
import { RealtimeProvider } from './context/RealtimeContext';
import CallNotificationModal from './components/CallNotificationModal';
import PaymentsPage from './pages/PaymentsManagementPage';
import CommissionsPage from './pages/CommissionsPage';
import PaymentDetailPage from './pages/PaymentDetailPage'; // Make sure this exists
import CarFinancePage from './pages/CarFinancePage';
import DocumentsPage from './pages/DocumentsPage';
import ChatPage from './pages/ChatPage';
import ApprovalsPage from './pages/ApprovalsPage';
import SidebarNavigation from './components/SidebarNavigation';
import TopBar from './components/TopBar';
import UserStatusSidebar from './components/UserStatusSidebar';
import MobileBottomNav from './components/MobileBottomNav';
import React from 'react';
// This component now correctly uses the context because it will be rendered INSIDE AuthProvider
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="loading-spinner">{t('authenticating')}</div>;
  }

  return currentUser ? children : <Navigate to="/login" />;
};

// This component also correctly uses the context
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) {
    return <div className="loading-spinner">{t('loading')}</div>;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Add your ProtectedRoute definition if not already present
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="loading-spinner">{t('authenticating')}</div>;
  }

  // Check for required role
  if (!currentUser || (requiredRole && currentUser.role !== requiredRole)) {
    return <Navigate to="/login" />;
  }

  return children;
};

// This new component contains the part of your app that needs the auth context
function AppContent() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  return (
    <div className="app-with-sidebar with-right-sidebar">
      {isAuthenticated && <TopBar />}
      {isAuthenticated && <SidebarNavigation />}
      {isAuthenticated && <UserStatusSidebar />}
      {isAuthenticated && <MobileBottomNav />}
      <CallNotificationModal />
      <main>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
          
          {/* Add these new routes */}
          <Route path="/payments" element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
          <Route path="/payments/:paymentId" element={<PrivateRoute><PaymentDetailPage /></PrivateRoute>} />
          <Route path="/commissions" element={<PrivateRoute><CommissionsPage /></PrivateRoute>} />
          
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
          <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/approvals" element={<PrivateRoute><ApprovalsPage /></PrivateRoute>} />
          
          {/* New route for Car Finance Page */}
          <Route
            path="/car-finances"
            element={
              <ProtectedRoute requiredRole="admin">
                <CarFinancePage />
              </ProtectedRoute>
            }
          />
          
          {/* Redirects and Catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2>{t('page_not_found')}</h2>
            </div>
          } />
        </Routes>
      </main>
      <NotificationContainer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <LanguageProvider>
            <CallNotificationProvider>
              <RealtimeProvider>
                <AppContent />
              </RealtimeProvider>
            </CallNotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;