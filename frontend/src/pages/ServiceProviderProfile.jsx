import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BACKEND_URL } from "@/constant/Global";

const ServiceProviderProfile = () => {
   const [profiles, setProfiles] = useState([]);
   const [filteredProfiles, setFilteredProfiles] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState("");

   useEffect(() => {
      const fetchProfiles = async () => {
         try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(
               `${BACKEND_URL}/api/v1/service-provider/all`,
               {
                  headers: { Authorization: `Bearer ${accessToken}` },
               }
            );
            setProfiles(res.data?.data || []);
            setFilteredProfiles(res.data?.data || []);
         } catch (err) {
            console.error("Failed to fetch profiles:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchProfiles();
   }, []);

   useEffect(() => {
      if (!filter.trim()) {
         setFilteredProfiles(profiles);
         return;
      }

      const search = filter.toLowerCase();
      const filtered = profiles.filter((profile) => {
         return (
            profile?.companyName?.toLowerCase().includes(search) ||
            profile?.businessLocation?.toLowerCase().includes(search) ||
            profile?.contactNumber?.includes(search) ||
            profile?.services?.some((s) =>
               s?.serviceId?.name?.toLowerCase().includes(search)
            ) ||
            profile?.skillMatrix?.some((s) =>
               s.skill.toLowerCase().includes(search)
            )
         );
      });

      setFilteredProfiles(filtered);
   }, [filter, profiles]);

   if (loading) return <p className="text-center mt-10">Loading...</p>;

   return (
      <section className="max-w-6xl mx-auto p-6 space-y-6">
         <Input
            placeholder="Search by company name, location, skill, or service..."
            className="mb-4 w-full max-w-md mx-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
         />

         {filteredProfiles.length === 0 ? (
            <p className="text-center text-red-500">
               No matching profiles found.
            </p>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredProfiles.map((profile, index) => (
                  <Card key={index} className="h-full">
                     <CardHeader className="flex flex-col items-center text-center">
                        {profile.companyLogoUrl && (
                           <img
                              src={profile.companyLogoUrl}
                              alt="Company Logo"
                              className="w-20 h-20 rounded-md object-cover border mb-2"
                           />
                        )}
                        <CardTitle className="text-blue-600">
                           {profile.companyName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                           {profile.businessLocation}
                        </p>
                        <p className="text-sm text-gray-500">
                           {profile.contactNumber}
                        </p>
                     </CardHeader>
                     <CardContent className="text-sm text-gray-700 space-y-2">
                        {profile.companyDescription && (
                           <p>{profile.companyDescription}</p>
                        )}

                        {profile.services?.length > 0 && (
                           <div>
                              <strong>Services:</strong>
                              <ul className="list-disc pl-4">
                                 {profile.services.map((s, i) => (
                                    <li key={i}>
                                       {s?.serviceId?.name} - ${s.price}
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}

                        {profile.skillMatrix?.length > 0 && (
                           <div>
                              <strong>Skills:</strong>
                              <ul className="list-disc pl-4">
                                 {profile.skillMatrix.map((s, i) => (
                                    <li key={i}>
                                       {s.skill} (
                                       {s.level === 1
                                          ? "Beginner"
                                          : s.level === 2
                                          ? "Intermediate"
                                          : "Expert"}
                                       )
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}

                        {profile.companyCertifications?.length > 0 && (
                           <div className="flex flex-wrap gap-2">
                              {profile.companyCertifications.map((cert, i) => (
                                 <Badge key={i} variant="outline">
                                    {cert?.certificateName || cert}
                                 </Badge>
                              ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}
      </section>
   );
};

export default ServiceProviderProfile;
