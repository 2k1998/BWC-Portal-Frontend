import { Routes, Route, Navigate } from 'react-router-dom';
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
import useAuth from './context/useAuth';
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
import ContactsPage from './pages/ContactsPage';
import DailyCallsPage from './pages/DailyCallsPage';
import ProjectsPage from './pages/ProjectsPage'; // <-- Add this import
import { CallNotificationProvider } from './context/CallNotificationContext';
import CallNotificationModal from './components/CallNotificationModal';
import PaymentsPage from './pages/PaymentsManagementPage';
import CommissionsPage from './pages/CommissionsPage';
import PaymentDetailPage from './pages/PaymentDetailPage'; // Make sure this exists
import CarFinancePage from './pages/CarFinancePage';
import DocumentsPage from './pages/DocumentsPage';
import SidebarNavigation from './components/SidebarNavigation';
import React from 'react';
// A protected layout that shows the sidebar only when authenticated
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Authenticating...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated: render the sidebar + page content
  return (
    <div className="app-with-sidebar">
      <SidebarNavigation />
      <main>{children}</main>
    </div>
  );
};

// This component also correctly uses the context
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Add your ProtectedRoute definition if not already present
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Authenticating...</div>;
  }

  // Check for required role
  if (!currentUser || (requiredRole && currentUser.role !== requiredRole)) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="app-with-sidebar">
      {/* NO sidebar here */}
      <CallNotificationModal />
      <main>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
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
              <h2>404 - Page Not Found</h2>
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
    <NotificationProvider>
      <LanguageProvider>
        <CallNotificationProvider>
          <AppContent />
        </CallNotificationProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

export default App;