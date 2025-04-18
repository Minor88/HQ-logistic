import React from "react";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSettings();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 border-b bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium text-gray-800">Apple Flow Logistics</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-apple-purple"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apple-purple text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium">
                {user?.name}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
