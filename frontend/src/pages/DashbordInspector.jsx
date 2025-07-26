import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import {
   ClipboardCheck,
   FileText,
   UploadCloud,
   DollarSign,
   MessageCircle,
   UserCircle,
} from "lucide-react";

import NavbarSection from "@/features/NavbarSection/NavbarSection";

export default function DashboardInspector() {
   const navigate = useNavigate();

   const features = [
      {
         title: "Assigned Jobs",
         description: "View incoming inspection jobs and accept or reject them.",
         icon: <ClipboardCheck className="w-8 h-8 text-[#004aad]" />,
         route: "/inspector/assigned-jobs",
      },
      {
         title: "Upload Final Report",
         description: "Upload completed reports after fieldwork.",
         icon: <UploadCloud className="w-8 h-8 text-blue-500" />,
         route: "/inspector/final-report-upload",
      },
      {
         title: "Payment & Downloads",
         description:
            "Clients must pay to download reports. Track payment status.",
         icon: <DollarSign className="w-8 h-8 text-emerald-600" />,
         route: "/inspector/payment-downloads",
      },
      {
         title: "Feedback Received",
         description: "View feedback from clients after report download.",
         icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
         route: "/inspector/feedback",
      },
      {
         title: "Manage Profile",
         description: "Update your personal details, resume, and availability.",
         icon: <UserCircle className="w-8 h-8 text-gray-700" />,
         route: "/inspector-profile",
      }
   ];

   return (
      <>
         <NavbarSection />
         <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-7xl mx-auto space-y-12">
               {/* Header */}
               <div className="text-center space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#004aad]">
                     Welcome to your Dashboard, Inspector!
                  </h1>
                  <p className="text-lg text-gray-600">
                     You are logged in as an{" "}
                     <span className="font-semibold text-[#004aad]">
                        inspector
                     </span>
                     .
                  </p>
                  <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                     Manage your inspection jobs, generate procedures, upload reports,
                     and handle payments all in one place.
                  </p>
               </div>

               <Separator />

               {/* Features */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
