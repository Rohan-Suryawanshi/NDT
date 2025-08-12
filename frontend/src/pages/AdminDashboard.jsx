import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

// Lucide Icons
import { 
  Users, 
  Settings, 
  Wrench, 
  Shield, 
  BarChart3, 
  Database,
  FileText,
  CreditCard,
  MessageSquare,
  Bell,
  Building
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: "Job Management",
      description: "Monitor all job requests, quotations, progress, and generate reports.",
      icon: <Building className="w-8 h-8 text-indigo-600" />,
      route: "/admin/job-management",
    },
    {
      title: "User Management",
      description: "Manage all users, roles, and permissions across the platform.",
      icon: <Users className="w-8 h-8 text-blue-600" />,
      route: "/admin/user-management",
    },
    {
      title: "Service Management",
      description: "Manage available services, codes, and premium features.",
      icon: <Wrench className="w-8 h-8 text-green-600" />,
      route: "/admin/service-manager",
    },
    {
      title: "System Settings",
      description: "Configure platform settings, fees, and system preferences.",
      icon: <Settings className="w-8 h-8 text-gray-600" />,
      route: "/admin/settings",
    },
    // {
    //   title: "Analytics & Reports",
    //   description: "View platform analytics, user statistics, and generate reports.",
    //   icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
    //   route: "/admin/analytics",
    // },
    {
      title: "Payment Management",
      description: "Monitor transactions, withdrawals, and payment processing.",
      icon: <CreditCard className="w-8 h-8 text-emerald-600" />,
      route: "/admin/payments",
    },
    {
      title: "System Revenue",
      description: "Monitor system performance, logs, and security alerts.",
      icon: <Shield className="w-8 h-8 text-red-600" />,
      route: "/admin/revenue",
    },
  ];

  return (
    <>
      <NavbarSection />
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-12 h-12 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              You are logged in as an{" "}
              <span className="font-semibold text-red-600">
                administrator
              </span>
              .
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              Manage users, configure system settings, monitor platform performance, 
              and oversee all aspects of the NDT Connect platform.
            </p>
          </div>

          <Separator />

          {/* Admin Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {adminFeatures.map(({ icon, title, description, route }) => (
              <Card
                key={title}
                className="group border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(route)}
              >
                <CardHeader className="flex items-center gap-4 pb-2">
                  <div className="bg-gray-50 p-3 rounded-md group-hover:bg-blue-50 transition">
                    {icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 text-center">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 flex flex-col justify-between h-full pt-0">
                  <p className="text-center mb-4">{description}</p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(route);
                    }}
                  >
                    Open {title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
