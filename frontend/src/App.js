import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CarriersPage from "@/pages/CarriersPage";
import CarrierDetailPage from "@/pages/CarrierDetailPage";
import AgentsPage from "@/pages/AgentsPage";
import UploadPage from "@/pages/UploadPage";
import DataReviewPage from "@/pages/DataReviewPage";
import ConflictsPage from "@/pages/ConflictsPage";
import PayoutsPage from "@/pages/PayoutsPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
        path="/carriers" 
        element={
          <ProtectedRoute>
            <CarriersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/carriers/:id" 
        element={
          <ProtectedRoute>
            <CarrierDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/agents" 
        element={
          <ProtectedRoute>
            <AgentsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/review" 
        element={
          <ProtectedRoute>
            <DataReviewPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/conflicts" 
        element={
          <ProtectedRoute>
            <ConflictsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payouts" 
        element={
          <ProtectedRoute>
            <PayoutsPage />
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
