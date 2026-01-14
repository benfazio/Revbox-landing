import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import DataSourcesPage from "@/pages/DataSourcesPage";
import DataSourceDetailPage from "@/pages/DataSourceDetailPage";
import StagingPage from "@/pages/StagingPage";
import ConflictResolutionPage from "@/pages/ConflictResolutionPage";
import ApprovedDataPage from "@/pages/ApprovedDataPage";
import TableLinkingPage from "@/pages/TableLinkingPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="spinner" />
      </div>
    );
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sources" 
        element={
          <ProtectedRoute>
            <DataSourcesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sources/:id" 
        element={
          <ProtectedRoute>
            <DataSourceDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staging" 
        element={
          <ProtectedRoute>
            <StagingPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/conflicts" 
        element={
          <ProtectedRoute>
            <ConflictResolutionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/approved" 
        element={
          <ProtectedRoute>
            <ApprovedDataPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/linking" 
        element={
          <ProtectedRoute>
            <TableLinkingPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
