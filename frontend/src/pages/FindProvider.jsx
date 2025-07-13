import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";
import { Phone, MapPin, Briefcase } from "lucide-react";

export default function FindProviders() {
   const [providers, setProviders] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchProviders = async () => {
         const token = localStorage.getItem("accessToken");
         try {
            const res = await fetch(
               `${BACKEND_URL}/api/v1/service-provider/all`,
               {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               }
            );
            const data = await res.json();

            if (res.ok) {
               setProviders(data.data || []);
            } else {
               toast.error(data.message || "Failed to fetch providers");
            }
         } catch (error) {
            console.error(error);
            toast.error("Error fetching providers");
         } finally {
            setLoading(false);
         }
      };

      fetchProviders();
   }, []);

   return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
         <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-blue-700">
               NDT Service Providers
            </h2>

            {loading ? (
               <p>Loading providers...</p>
            ) : providers.length === 0 ? (
               <p className="text-gray-600">No providers found.</p>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {providers.map((provider) => (
                     <Card
                        key={provider._id}
                        className="shadow hover:shadow-lg transition"
                     >
                        <CardHeader className="flex gap-4 items-center">
                           <img
                              src={provider.companyLogoUrl}
                              alt="logo"
                              className="w-16 h-16 object-cover rounded-md"
                           />
                           <div>
                              <CardTitle className="text-xl font-semibold">
                                 {provider.companyName}
                              </CardTitle>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                 <MapPin className="w-4 h-4" />{" "}
                                 {provider.businessLocation}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                 <Phone className="w-4 h-4" />{" "}
                                 {provider.contactNumber}
                              </div>
                           </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="space-y-3">
                           {/* Services */}
                           <div>
                              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                                 Services Offered:
                              </h4>
                              {provider.services.map((service) => (
                                 <Badge key={service._id} className="mr-2 mb-1">
                                    ${service.price} / {service.unit}
                                 </Badge>
                              ))}
                           </div>

                           {/* Skills */}
                           <div>
                              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                                 Skills:
                              </h4>
                              {provider.skillMatrix.map((skill) => (
                                 <Badge
                                    key={skill._id}
                                    variant="outline"
                                    className="text-blue-600 border-blue-300 mr-2 mb-1"
                                 >
                                    {skill.skill} (Level {skill.level})
                                 </Badge>
                              ))}
                           </div>

                           {/* Certifications */}
                           <div>
                              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                                 Company Certifications:
                              </h4>
                              {provider.companyCertifications.map(
                                 (cert, idx) => (
                                    <Badge
                                       key={idx}
                                       variant="secondary"
                                       className="mr-2 mb-1"
                                    >
                                       {cert}
                                    </Badge>
                                 )
                              )}
                           </div>

                           {/* Personnel Qualifications */}
                           <div>
                              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                                 Personnel Qualifications:
                              </h4>
                              {provider.personnelQualifications.map((qual) => (
                                 <Badge key={qual._id} className="mr-2 mb-1">
                                    {qual.certificationBody} Level {qual.level}
                                 </Badge>
                              ))}
                           </div>

                           {/* Certificate Files */}
                           <div>
                              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                                 Uploaded Certificates:
                              </h4>
                              <div className="flex gap-4">
                                 {provider.certificates?.twic?.fileUrl && (
                                    <img
                                       src={provider.certificates.twic.fileUrl}
                                       alt="TWIC"
                                       className="w-10 h-10 object-cover rounded"
                                    />
                                 )}
                                 {provider.certificates?.gatePass?.fileUrl && (
                                    <img
                                       src={
                                          provider.certificates.gatePass.fileUrl
                                       }
                                       alt="Gate Pass"
                                       className="w-10 h-10 object-cover rounded"
                                    />
                                 )}
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
