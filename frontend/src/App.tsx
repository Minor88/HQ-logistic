import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import Companies from "./pages/companies";
import UsersPage from "./pages/users/UsersPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ShipmentsPage from "./pages/shipments/ShipmentsPage";
import RequestsPage from "./pages/requests/RequestsPage";
import FinancesPage from "./pages/finances/FinancesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
              <Route path="/companies" element={
                <MainLayout requiredRoles={["superuser"]}>
                  <Companies />
                </MainLayout>
              } />
              <Route path="/users" element={
                <MainLayout requiredRoles={["superuser", "admin"]}>
                  <UsersPage />
                </MainLayout>
              } />
              <Route path="/settings" element={
                <MainLayout requiredRoles={["superuser", "admin"]}>
                  <SettingsPage />
                </MainLayout>
              } />
              <Route path="/shipments" element={
                <MainLayout requiredRoles={["superuser", "admin", "boss", "manager", "warehouse", "client"]}>
                  <ShipmentsPage />
                </MainLayout>
              } />
              <Route path="/requests" element={
                <MainLayout requiredRoles={["superuser", "admin", "boss", "manager", "warehouse", "client"]}>
                  <RequestsPage />
                </MainLayout>
              } />
              <Route path="/finances" element={
                <MainLayout requiredRoles={["superuser", "admin", "boss", "client"]}>
                  <FinancesPage />
                </MainLayout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
