import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Public pages
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Citizen pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportIssuePage from './pages/citizen/ReportIssuePage';
import MyComplaintsPage from './pages/citizen/MyComplaintsPage';
import TrackComplaintPage from './pages/citizen/TrackComplaintPage';
import NotificationsPage from './pages/citizen/NotificationsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminDuplicateReviewPage from './pages/admin/AdminDuplicateReviewPage';
import AdminIssueDetailsPage from './pages/admin/AdminIssueDetailsPage';
import AdminWorkersPage from './pages/admin/AdminWorkersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTaskDetailsPage from './pages/worker/WorkerTaskDetailsPage';

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Public */}
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Citizen Routes */}
            <Route
              path="citizen"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="citizen/report"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <ReportIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="citizen/complaints"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <MyComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="citizen/track/:id"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin', 'worker']}>
                  <TrackComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="citizen/notifications"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin', 'worker']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/duplicates"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDuplicateReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/issues/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminIssueDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/workers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminWorkersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Worker Routes */}
            <Route
              path="worker"
              element={
                <ProtectedRoute allowedRoles={['worker', 'admin']}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="worker/tasks/:id"
              element={
                <ProtectedRoute allowedRoles={['worker', 'admin']}>
                  <WorkerTaskDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

