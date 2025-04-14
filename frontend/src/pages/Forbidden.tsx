
import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-4 text-gray-600">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => navigate("/")} className="bg-apple-purple hover:bg-apple-purple/90">
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
