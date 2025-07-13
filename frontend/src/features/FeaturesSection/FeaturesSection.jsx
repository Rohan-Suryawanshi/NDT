import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FeaturesSection = () => {
   const items = [
      {
         image: "./building.gif", // path relative to your public folder
         title: "Company Portal",
         desc: "Assign jobs, track history & reports",
      },
      {
         image: "/profile.gif",
         title: "Inspector Dashboard",
         desc: "Manage inspections & submit reports",
      },
      {
         image: "/repair-tools.gif",
         title: "Client Interface",
         desc: "Request inspections & view status",
      },
   ];

   return (
      <section id="features" className="bg-gray-50 py-20 px-4">
         <h3 className="text-3xl text-center font-bold text-gray-800 mb-10">
            Our <span className="text-[#004aad]">Features</span>
         </h3>
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map(({ image, title, desc }) => (
               <Card
                  key={title}
                  className="text-center transition-transform transform hover:scale-105 hover:shadow-lg"
               >
                  <CardHeader>
                     <img
                        src={image}
                        alt={title}
                        className="mx-auto h-16 w-16 object-contain mb-2"
                     />
                     <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-600">{desc}</CardContent>
               </Card>
            ))}
         </div>
      </section>
   );
};

export default FeaturesSection;
