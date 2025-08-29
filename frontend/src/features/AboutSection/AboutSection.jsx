import { Button } from "@/components/ui/button";
import { lazy, Suspense } from "react";
const AboutSection = () => {
   const InteractiveEarth = lazy(() =>
      import("../InteractiveEarth/InteractiveEarth")
   );

   return (
      <section id="about" className="bg-gray-50 py-20 px-4">
         <div className="max-w-6xl mx-auto space-y-16">
            {/* Section Title */}
            <div className="text-center">
               <h2 className="text-4xl font-bold text-[#004aad] mb-4">About</h2>
               <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Connecting Inspection Companies, Certified Inspectors, and
                  Clients with a Seamless NDT Workflow.
               </p>
            </div>

            {/* Image + Content */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
               {/* Image */}
               <Suspense
                  fallback={<div className="h-96 bg-gray-200 animate-pulse" />}
               >
                  <InteractiveEarth />
               </Suspense>

               {/* Text Content */}
               <div className="text-gray-800">
                  <p className="text-lg mb-6 leading-relaxed text-gray-700">
                     <strong>NDT Connect</strong> is a modern platform designed
                     to simplify and digitize non-destructive testing services.
                     We provide individual dashboards for companies, inspectors,
                     and clients to collaborate with clarity and efficiency.
                  </p>
                  <p className="text-lg mb-8 leading-relaxed text-gray-700">
                     Whether you're assigning inspections, conducting them, or
                     tracking the progress — NDT Connect centralizes
                     communication, job tracking, and report submission into one
                     secure and user-friendly portal.
                  </p>
                  <p className="text-lg mb-8 leading-relaxed text-gray-700">NDT Connect delivers transparency, speed, and trust across the entire NDT workflow — enabling companies to manage efficiently, inspectors to work seamlessly, and clients to gain real-time visibility and confidence in every inspection. Sign up for Free Today!</p>
                  <Button asChild>
                     <a href="#features" className="text-white">
                        Explore Features
                     </a>
                  </Button>
               </div>
            </div>
         </div>
      </section>
   );
};

export default AboutSection;
