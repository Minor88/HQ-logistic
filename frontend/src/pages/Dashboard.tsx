import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Package, FileText, DollarSign, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  // Function to display welcome message based on user role
  const getWelcomeMessage = () => {
    switch (user?.role) {
      case "superuser":
        return "Welcome, Super Administrator";
      case "admin":
        return "Welcome, Administrator";
      case "boss":
        return "Welcome, Team Leader";
      case "manager":
        return "Welcome, Manager";
      case "warehouse":
        return "Welcome, Warehouse Operator";
      case "client":
        return "Welcome, Client";
      default:
        return "Welcome";
    }
  };

  // Sample data for cards
  const statsCards = [
    {
      title: "Total Shipments",
      value: "158",
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      link: "/shipments",
      roles: ["superuser", "admin", "boss", "manager", "warehouse"],
    },
    {
      title: "Active Requests",
      value: "42",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-50",
      link: "/requests",
      roles: ["superuser", "admin", "boss", "manager", "warehouse", "client"],
    },
    {
      title: "Monthly Revenue",
      value: "$24,500",
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      link: "/finances",
      roles: ["superuser", "admin", "boss"],
    },
    {
      title: "Active Clients",
      value: "28",
      icon: Users,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      link: "/clients",
      roles: ["superuser", "admin", "boss"],
    },
  ];

  // Filter stats cards based on user role
  const filteredStatsCards = statsCards.filter((card) =>
    card.roles.includes(user?.role as any)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">{getWelcomeMessage()}</h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your logistics operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStatsCards.map((card, index) => (
          <Card key={index} className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{card.value}</div>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <Link to={card.link}>
                  <Button variant="ghost" className="p-0 h-auto text-sm text-apple-purple">
                    View details →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role !== "client" && (
              <Link to="/shipments/new">
                <Button className="w-full bg-apple-purple hover:bg-apple-purple/90">
                  Create New Shipment
                </Button>
              </Link>
            )}
            <Link to="/requests/new">
              <Button variant="outline" className="w-full">
                Create New Request
              </Button>
            </Link>
            {(user?.role === "superuser" || user?.role === "admin" || user?.role === "boss") && (
              <Link to="/finances/new">
                <Button variant="outline" className="w-full">
                  Record Financial Transaction
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample activity items */}
            <div className="flex items-start gap-4 pb-4 border-b">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">New shipment created</div>
                <div className="text-sm text-gray-500">Shipment #SH-2023045 has been created</div>
                <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Request status updated</div>
                <div className="text-sm text-gray-500">Request #RQ-2023089 status changed to "In Process"</div>
                <div className="text-xs text-gray-400 mt-1">5 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Payment received</div>
                <div className="text-sm text-gray-500">Payment of $1,250 received from Client A</div>
                <div className="text-xs text-gray-400 mt-1">Yesterday</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
