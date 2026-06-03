import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import RoleGuard from './components/ui/RoleGuard.jsx';

// Pages Import
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PrepPage from './pages/PrepPage.jsx';
import SkillGapPage from './pages/SkillGapPage.jsx';
import MockInterviewPage from './pages/MockInterviewPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AssistantPage from './pages/AssistantPage.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <DashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/prep-setup"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <PrepPage />
              </RoleGuard>
            }
          />
          <Route
            path="/skill-gap/:id"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <SkillGapPage />
              </RoleGuard>
            }
          />
          <Route
            path="/mock-interview/:id"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <MockInterviewPage />
              </RoleGuard>
            }
          />
          <Route
            path="/results/:id"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <ResultsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/roadmap/:id"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <RoadmapPage />
              </RoleGuard>
            }
          />
          <Route
            path="/assistant"
            element={
              <RoleGuard allowedRoles={['user', 'admin']}>
                <AssistantPage />
              </RoleGuard>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleGuard>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
