const steps = [
   {
      image: "./idea.gif",
      title: "Step 1: Sign Up",
      description:
         "Create your account as a company, inspector, or client and get access to your dashboard.",
   },
   {
      image: "./checklist.gif",
      title: "Step 2: Create or Join Jobs",
      description:
         "Companies assign inspection jobs, inspectors accept tasks, and clients request services.",
   },
   {
      image: "./shield.gif",
      title: "Step 3: Report & Monitor",
      description:
         "Inspectors submit reports, clients track job status, and companies monitor progress.",
   },
];

const HowItWorksSection = () => {
   return (
      <section id="how-it-works" className="bg-white py-20 px-4">
         <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-12">
               How It <span className="text-[#004aad]">Works</span>
            </h2>
            <div className="grid gap-10 md:grid-cols-3 text-left">
               {steps.map(({ image, title, description }) => (
                  <div
                     key={title}
                     className="rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow "
                  >
                     <div className="mb-4 flex items-center justify-center">
                        <img
                           src={image}
                           alt={title}
                           className="h-16 w-16 object-contain"
                        />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {title}
                     </h3>
                     <p className="text-gray-600">{description}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>
   );
};

export default HowItWorksSection;
