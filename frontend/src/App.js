import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider } from "@/lib/i18n";
import SubmitPage from "@/pages/SubmitPage";
import ResultsPage from "@/pages/ResultsPage";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/submit" replace />} />
      <Route path="/submit" element={<SubmitPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/admin" element={<ProtectedRoute>{(user, logout) => <Dashboard user={user} onLogout={logout} />}</ProtectedRoute>} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/submit" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
    </LangProvider>
  );
}
