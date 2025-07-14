import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import { ClipboardList, Bot, UserCircle, Settings } from "lucide-react";

import NavbarSection from "@/features/NavbarSection/NavbarSection";

export default function DashboardProvider() {
   const navigate = useNavigate();

   const features = [
      {
         title: "Service Requests",
         description: "View and manage incoming service requests from clients.",
         icon: <ClipboardList className="w-8 h-8 text-[#004aad]" />,
         route: "/provider/service-requests",
      },
      {
         title: "AI Procedure Writer",
         description: "Use AI to generate comprehensive NDT procedures.",
         icon: <Bot className="w-8 h-8 text-green-600" />,
         route: "/provider/ai-writer",
      },
      {
         title: "Manage Profile",
         description:
            "Update your company details, services offered, and availability.",
         icon: <UserCircle className="w-8 h-8 text-purple-600" />,
         route: "/provider-profile",
      },
      {
         title: "Account Settings",
         description:
            "Manage your NDT Connect account settings and preferences.",
         icon: <Settings className="w-8 h-8 text-gray-600" />,
         route: "/settings",
      },
      {
         title: "Certificate",
         description:
            "Manage your NDT Connect account Certificates and preferences.",
         icon: <Settings className="w-8 h-8 text-gray-600" />,
         route: "/certificate",
      },
   ];

   return (
      <>
         <NavbarSection />
         <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-7xl mx-auto space-y-12">
               {/* Header */}
               <div className="text-center space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#004aad]">
                     Welcome to your Dashboard, Rohan!
                  </h1>
                  <p className="text-lg text-gray-600">
                     You are logged in as a{" "}
                     <span className="font-semibold text-[#004aad]">
                        provider
                     </span>
                     .
                  </p>
                  <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                     Use the tools below to manage your services, clients, and
                     profile efficiently.
                  </p>
               </div>

               <Separator />

               {/* Dashboard Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                  {features.map(({ icon, title, description, route }) => (
                     <Card
                        key={title}
                        className="group border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                     >
                        <CardHeader className="flex items-center gap-4">
                           <div className="bg-blue-50 p-3 rounded-md group-hover:bg-blue-100 transition">
                              {icon}
                           </div>
                           <CardTitle className="text-xl font-semibold text-gray-800">
                              {title}
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 flex flex-col justify-between h-full">
                           <p>{description}</p>
                           <Button
                              className="mt-6 w-full"
                              onClick={() => navigate(route)}
                           >
                              Go to {title}
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
