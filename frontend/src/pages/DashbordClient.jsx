import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import { Search, Bot, ClipboardList, Settings } from "lucide-react";
import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { Header } from "@/components/Layout/Header";

export default function DashboardClient() {
   const navigate = useNavigate();

   const features = [
      {
         title: "Find Providers",
         description:
            "Search for NDT service providers based on location and expertise.",
         icon: <Search className="w-8 h-8 text-[#004aad]" />,
         route: "/find-providers",
      },
      {
         title: "Get Recommendations",
         description:
            "Use our AI tool to find the best provider for your needs.",
         icon: <Bot className="w-8 h-8 text-purple-600" />,
         route: "/get-recommendations",
      },
      {
         title: "My Service Requests",
         description:
            "Track the status of your ongoing and past service requests.",
         icon: <ClipboardList className="w-8 h-8 text-green-600" />,
         route: "/my-service-requests",
      },
      {
         title: "Account Settings",
         description: "Manage your account details and preferences.",
         icon: <Settings className="w-8 h-8 text-gray-600" />,
         route: "/account-settings",
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
                     Welcome to your Dashboard, Rohan Suryawanshi!
                  </h1>
                  <p className="text-lg text-gray-600">
                     You are logged in as a{" "}
                     <span className="font-semibold text-[#004aad]">
                        client
                     </span>
                     .
                  </p>
                  <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                     This is your central hub for NDT Connect. Use the options
                     below to access features tailored to your role.
                  </p>
               </div>

               <Separator />

               {/* Feature Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                  {features.map((feature, idx) => (
                     <Card
                        key={idx}
                        className="group border border-gray-200 hover:shadow-xl transition duration-300"
                     >
                        <CardHeader className="flex items-center gap-4">
                           <div className="bg-[#004aad] p-3 rounded-md group-hover:bg-[#004aad] transition">
                              {feature.icon}
                           </div>
                           <CardTitle className="text-xl font-semibold text-gray-800">
                              {feature.title}
                           </CardTitle>
                        </CardHeader>

                        <CardContent className="text-sm text-gray-600 flex flex-col justify-between h-full">
                           <p>{feature.description}</p>
                           <Button
                              className="mt-6 w-full"
                              onClick={() => navigate(feature.route)}
                           >
                              Go to {feature.title}
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
