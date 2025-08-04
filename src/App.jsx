import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';

import './App.css'
import ErrorBoundary from './components/ErrorBoundary'; // Add this import
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
import ContactsPage from './pages/ContactsPage';
import DailyCallsPage from './pages/DailyCallsPage';
import { CallNotificationProvider } from './context/CallNotificationContext';
import CallNotificationModal from './components/CallNotificationModal';

// Updated PrivateRoute with better error handling
const PrivateRoute = ({ children }) => {
  const { currentUser, loading, initializationComplete } = useAuth();

  // Show loading spinner during initialization
  if (!initializationComplete || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>🔄 Loading...</div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

// Updated PublicOnlyRoute with better error handling
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, initializationComplete } = useAuth();
  
  // Show loading spinner during initialization
  if (!initializationComplete || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>🔄 Loading...</div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// AppContent with error boundary around critical components
function AppContent() {
  return (
    <>
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <CallNotificationModal />
      </ErrorBoundary>
      
      <main>
        <Routes>
          <Route path="/login" element={
            <ErrorBoundary>
              <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
            </ErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <ErrorBoundary>
              <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>
            </ErrorBoundary>
          } />
          <Route path="/register" element={
            <ErrorBoundary>
              <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
            </ErrorBoundary>
          } />
          
          {/* Protected Routes with Error Boundaries */}
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <PrivateRoute><DashboardPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/tasks" element={
            <ErrorBoundary>
              <PrivateRoute><TasksPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/contacts" element={
            <ErrorBoundary>
              <PrivateRoute><ContactsPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/daily-calls" element={
            <ErrorBoundary>
              <PrivateRoute><DailyCallsPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/groups" element={
            <ErrorBoundary>
              <PrivateRoute><GroupsPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/groups/:groupId" element={
            <ErrorBoundary>
              <PrivateRoute><GroupDetailPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/users" element={
            <ErrorBoundary>
              <PrivateRoute><UsersPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/profile" element={
            <ErrorBoundary>
              <PrivateRoute><ProfilePage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/admin-panel" element={
            <ErrorBoundary>
              <PrivateRoute><AdminPanelPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/companies" element={
            <ErrorBoundary>
              <PrivateRoute><CompaniesPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/companies/new" element={
            <ErrorBoundary>
              <PrivateRoute><NewCompanyPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/companies/:companyId" element={
            <ErrorBoundary>
              <PrivateRoute><CompanyDetailPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/companies/edit/:companyId" element={
            <ErrorBoundary>
              <PrivateRoute><EditCompanyPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/events" element={
            <ErrorBoundary>
              <PrivateRoute><EventsPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/events/new" element={
            <ErrorBoundary>
              <PrivateRoute><AddEventPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          <Route path="/reports" element={
            <ErrorBoundary>
              <PrivateRoute><ReportsPage /></PrivateRoute>
            </ErrorBoundary>
          } />
          
          {/* Redirects and Catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2>404 - Page Not Found</h2>
              <p><a href="/dashboard">Go to Dashboard</a></p>
            </div>
          } />
        </Routes>
      </main>
      
      <ErrorBoundary>
        <NotificationContainer />
      </ErrorBoundary>
    </>
  );
}

// Main App component with all providers and top-level error boundary
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <LanguageProvider>
              <CallNotificationProvider>
                <AppContent />
              </CallNotificationProvider>
            </LanguageProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
