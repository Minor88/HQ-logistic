import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import {
  Package,
  FileText,
  DollarSign,
  Briefcase,
  Users,
  Settings,
  Calculator,
  CreditCard,
  TrendingUp,
  Truck,
  List,
  Building,
  Home
} from "lucide-react";

// Define menu items with required roles
interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  requiredRoles: UserRole[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  // Define all menu items with their access requirements
  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: Home,
      path: "/",
      requiredRoles: ["superuser", "admin", "boss", "manager", "warehouse", "client"],
    },
    {
      label: "Shipments",
      icon: Truck,
      path: "/shipments",
      requiredRoles: ["superuser", "admin", "boss", "manager", "warehouse", "client"],
    },
    {
      label: "Requests",
      icon: FileText,
      path: "/requests",
      requiredRoles: ["superuser", "admin", "boss", "manager", "warehouse", "client"],
    },
    {
      label: "Finances",
      icon: DollarSign,
      path: "/finances",
      requiredRoles: ["superuser", "admin", "boss", "client"],
    },
    {
      label: "Shipment Calculation",
      icon: Calculator,
      path: "/calculation",
      requiredRoles: ["superuser", "admin", "boss"],
    },
    {
      label: "Balance",
      icon: CreditCard,
      path: "/balance",
      requiredRoles: ["superuser", "admin", "boss"],
    },
    {
      label: "Analytics",
      icon: TrendingUp,
      path: "/analytics",
      requiredRoles: ["superuser", "admin", "boss"],
    },
    {
      label: "Companies",
      icon: Building,
      path: "/companies",
      requiredRoles: ["superuser"],
    },
    {
      label: "Users",
      icon: Users,
      path: "/users",
      requiredRoles: ["superuser", "admin"],
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
      requiredRoles: ["superuser", "admin"],
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) =>
    hasPermission(item.requiredRoles)
  );

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-apple-purple" />
          <span className="text-lg font-semibold text-gray-800">LogiFlow</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-apple-purple text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
