
import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, hasPermission, user } = useAuth();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If roles are specified and user doesn't have permission, redirect to forbidden
  if (requiredRoles.length > 0 && !hasPermission(requiredRoles as any)) {
    return <Navigate to="/forbidden" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
