
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // Redirect to dashboard if authenticated, otherwise to login
  return isAuthenticated ? <Navigate to="/" /> : <Navigate to="/login" />;
};

export default Index;
