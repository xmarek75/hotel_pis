import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import { AppLayout } from "./AppLayout";
import RoomPage from "./pages/RoomPage";
import ServicePage from "./pages/ServicePage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/rooms" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  {/* <Route path="/dashboard" element={<Dashboard />} /> */}
                  {/* <Route path="/reservations" element={<Dashboard />} /> */}
                  <Route path="/rooms" element={<RoomPage />} />
                  <Route path="/services" element={<ServicePage />} />
                </Route>
            </Route>
            {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}
