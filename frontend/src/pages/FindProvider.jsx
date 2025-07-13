import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { BACKEND_URL } from "@/constant/Global";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const PREDEFINED_CERTIFICATIONS = [
   "API Q1",
   "AS9100",
   "IACS - American Bureau of Shipping (ABS)",
   "IACS - Bureau Veritas (BV)",
   "IACS - China Classification Society (CCS)",
   "IACS - Croatian Register of Shipping (CRS)",
   "IACS - DNV",
   "IACS - Indian Register of Shipping (IRS)",
   "IACS - Korean Register of Shipping (KR)",
   "IACS - Lloyd's Register (LR)",
   "IACS - Nippon Kaiji Kyokai (ClassNK)",
   "IACS - Polski Rejestr Statków (PRS)",
   "IACS - RINA Services (RINA)",
   "IACS - Russian Maritime Register of Shipping (RS)",
   "ISO 9001",
   "ISO 14001",
   "ISO 45001",
   "ISO/IEC 17020",
   "ISO/IEC 17024",
   "ISO/IEC 17025",
   "Nadcap",
   "NAS 410",
];

const PREDEFINED_PERSONNEL_CERTS = [
   "ACCP",
   "ASNT",
   "CGSB",
   "CSWIP",
   "EN 4179",
   "ISO 9712",
   "NAS 410",
   "PCN",
   "SNT-TC-1A",
];

const FindProvider = () => {
   const [profiles, setProfiles] = useState([]);
   const [filteredProfiles, setFilteredProfiles] = useState([]);
   const [ndtServices, setNdtServices] = useState([]);
   const [loading, setLoading] = useState(true);

   const [searchName, setSearchName] = useState("");
   const [searchLocation, setSearchLocation] = useState("");
   const [searchService, setSearchService] = useState("");
   const [searchSpecialization, setSearchSpecialization] = useState("");
   const [searchCompanyCert, setSearchCompanyCert] = useState("");
   const [searchPersonnelCert, setSearchPersonnelCert] = useState("");

   useEffect(() => {
      const fetchData = async () => {
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
            console.error("Failed to fetch providers:", err);
         } finally {
            setLoading(false);
         }
      };

      const fetchServices = async () => {
         try {
            const res = await axios.get(`${BACKEND_URL}/api/v1/service`);
            setNdtServices(res.data?.data || []);
         } catch (err) {
            console.error("Failed to fetch services:", err);
         }
      };

      fetchData();
      fetchServices();
   }, []);

   useEffect(() => {
      const filtered = profiles.filter((profile) => {
         const nameMatch = profile?.companyName
            ?.toLowerCase()
            .includes(searchName.toLowerCase());
         const locationMatch = profile?.businessLocation
            ?.toLowerCase()
            .includes(searchLocation.toLowerCase());
         const serviceMatch = profile?.services?.some((s) =>
            s?.serviceId?.name
               ?.toLowerCase()
               .includes(searchService.toLowerCase())
         );
         const specializationMatch = Array.isArray(
            profile?.companySpecialization
         )
            ? profile.companySpecialization.some((spec) =>
                 spec
                    ?.toLowerCase()
                    .includes(searchSpecialization.toLowerCase())
              )
            : profile?.companySpecialization
                 ?.toLowerCase()
                 .includes(searchSpecialization.toLowerCase());

         const companyCertMatch = profile?.companyCertifications?.some((c) =>
            (c?.certificateName || c)
               ?.toLowerCase()
               .includes(searchCompanyCert.toLowerCase())
         );

         const personnelCertMatch = profile?.personnelQualifications?.some(
            (p) =>
               p?.certificationBody
                  ?.toLowerCase()
                  .includes(searchPersonnelCert.toLowerCase())
         );

         return (
            (!searchName || nameMatch) &&
            (!searchLocation || locationMatch) &&
            (!searchService || serviceMatch) &&
            (!searchSpecialization || specializationMatch) &&
            (!searchCompanyCert || companyCertMatch) &&
            (!searchPersonnelCert || personnelCertMatch)
         );
      });
      setFilteredProfiles(filtered);
   }, [
      searchName,
      searchLocation,
      searchService,
      searchSpecialization,
      searchCompanyCert,
      searchPersonnelCert,
      profiles,
   ]);

   if (loading) return <p className="text-center mt-10">Loading...</p>;

   return (
      <>
      <NavbarSection/>
         <section className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md border">
               <h2 className="text-xl font-semibold mb-4">
                  Find Service Providers
               </h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  <div className="w-full">
                     <Input
                        className="w-full"
                        placeholder="Company / Inspector Name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                     />
                  </div>
                  <div className="w-full">
                     <Input
                        className="w-full"
                        placeholder="Location"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                     />
                  </div>
                  <div className="w-full">
                     <Select
                        value={searchService}
                        onValueChange={setSearchService}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="NDT Service" />
                        </SelectTrigger>
                        <SelectContent>
                           {ndtServices.map((service) => (
                              <SelectItem
                                 key={service._id}
                                 value={service.name.toLowerCase()}
                              >
                                 {service.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="w-full">
                     <Input
                        className="w-full"
                        placeholder="Specialization"
                        value={searchSpecialization}
                        onChange={(e) =>
                           setSearchSpecialization(e.target.value)
                        }
                     />
                  </div>
                  <div className="w-full">
                     <Select
                        value={searchCompanyCert}
                        onValueChange={setSearchCompanyCert}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Company Certification" />
                        </SelectTrigger>
                        <SelectContent>
                           {PREDEFINED_CERTIFICATIONS.map((cert) => (
                              <SelectItem key={cert} value={cert.toLowerCase()}>
                                 {cert}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="w-full">
                     <Select
                        value={searchPersonnelCert}
                        onValueChange={setSearchPersonnelCert}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Personnel Certification" />
                        </SelectTrigger>
                        <SelectContent>
                           {PREDEFINED_PERSONNEL_CERTS.map((cert) => (
                              <SelectItem key={cert} value={cert.toLowerCase()}>
                                 {cert}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </div>

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
                                 {profile.companyCertifications.map(
                                    (cert, i) => (
                                       <Badge key={i} variant="outline">
                                          {cert?.certificateName || cert}
                                       </Badge>
                                    )
                                 )}
                              </div>
                           )}
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </section>
      </>
   );
};

export default FindProvider;
