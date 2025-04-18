import React from "react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MainLayoutProps {
  requiredRoles?: UserRole[];
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  requiredRoles,
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useSettings();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If required roles are specified and user doesn't have them, redirect to 403
  if (requiredRoles && requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
    return <Navigate to="/forbidden" />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div 
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '76px' : '250px'
        }}
      >
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
