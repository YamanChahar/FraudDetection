import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import TestingLabPage from './pages/TestingLabPage';
import TransactionsPage from './pages/TransactionsPage';
import AlertsPage from './pages/AlertsPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import BatchTestingPage from './pages/BatchTestingPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

import './styles/theme.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Application Layout Shell */}
          <Route path="/" element={<AppLayout />}>
            {/* 1. Overview Dashboard */}
            <Route
              index
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 2. Fraud Testing Lab */}
            <Route
              path="testing-lab"
              element={
                <ProtectedRoute>
                  <TestingLabPage />
                </ProtectedRoute>
              }
            />

            {/* 3. Transaction Explorer */}
            <Route
              path="transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />

            {/* 4. Fraud Alerts */}
            <Route
              path="alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />

            {/* 5. Model Performance */}
            <Route
              path="models"
              element={
                <ProtectedRoute>
                  <ModelPerformancePage />
                </ProtectedRoute>
              }
            />

            {/* 6. Dataset Batch Testing (Investigator, Lead, Admin) */}
            <Route
              path="batch-testing"
              element={
                <ProtectedRoute allowedRoles={['INVESTIGATOR', 'LEAD', 'ADMIN']}>
                  <BatchTestingPage />
                </ProtectedRoute>
              }
            />

            {/* 7. Settings & Governance */}
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
