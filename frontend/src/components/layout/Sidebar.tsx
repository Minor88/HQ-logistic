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
  Home,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define menu items with required roles
interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  requiredRoles: UserRole[];
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const { pathname } = useLocation();
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
    <aside 
      className="h-screen fixed top-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden z-20 shadow-sm flex flex-col"
      style={{ 
        width: isCollapsed ? '76px' : '250px',
        minWidth: isCollapsed ? '76px' : '250px'
      }}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <Link to="/" className={cn(
          "flex items-center gap-2", 
          isCollapsed ? "justify-center w-full" : ""
        )}>
          <Package className="h-6 w-6 text-apple-purple flex-shrink-0" />
          {!isCollapsed && <span className="text-lg font-semibold truncate">LogiFlow</span>}
        </Link>
      </div>

      <nav className="flex flex-col flex-grow py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = item.path === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    isCollapsed ? "justify-center" : "space-x-3",
                    isActive
                      ? "bg-apple-purple text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  title={isCollapsed ? item.label : ""}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto border-t border-gray-200 py-3 px-4">
        <div 
          className="flex items-center justify-center cursor-pointer hover:bg-gray-100 py-2 rounded-md transition-colors"
          onClick={toggleSidebar}
        >
          <ChevronLeft 
            className={cn(
              "h-5 w-5 text-gray-500 transition-transform",
              isCollapsed ? "rotate-180" : ""
            )} 
          />
          {!isCollapsed && <span className="ml-2 text-sm text-gray-600">Свернуть</span>}
        </div>
        
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center mt-3">
            <div>LogiFlow v1.0.0</div>
            <div>© 2023 Apple Flow Logistics</div>
          </div>
        )}
      </div>
    </aside>
  );
};
