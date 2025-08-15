import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { 
   Search, 
   MapPin, 
   Phone, 
   Star, 
   Filter,
   X,
   Send,
   Building2,
   Award,
   Briefcase,
   Users,
   FileText,
   ChevronDown,
   ChevronUp
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import EnhancedJobRequestForm from "@/features/JobRequest/EnhancedJobRequestForm";
import { useNavigate } from "react-router-dom";
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
   const [showFilters, setShowFilters] = useState(false);
   const [expandedCards, setExpandedCards] = useState(new Set());
   const navigate=useNavigate();

   // Filter states
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
         const locationMatch = profile?.companyLocation
            ?.toLowerCase()
            .includes(searchLocation.toLowerCase());
         const serviceMatch = profile?.serviceDetails?.some((s) =>
            s?.name?.toLowerCase().includes(searchService.toLowerCase())
         );
         const specializationMatch = Array.isArray(profile?.companySpecialization)
            ? profile.companySpecialization.some((spec) =>
                 spec?.toLowerCase().includes(searchSpecialization.toLowerCase())
              )
            : profile?.companySpecialization
                 ?.toLowerCase()
                 .includes(searchSpecialization.toLowerCase());

         const companyCertMatch = profile?.certificates?.some((c) =>
            (c?.certificateName || c)
               ?.toLowerCase()
               .includes(searchCompanyCert.toLowerCase())
         );

         const personnelCertMatch = profile?.personnelQualifications?.some((p) =>
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

   const clearFilters = () => {
      setSearchName("");
      setSearchLocation("");
      setSearchService("");
      setSearchSpecialization("");
      setSearchCompanyCert("");
      setSearchPersonnelCert("");
      toast.success("Filters cleared");
   };

   const handleBack = () => {
      // Navigate to the previous page or dashboard
      window.history.back(); // or use router.push('/dashboard')
   };

   const handleRequestService = (providerId, providerName) => {
      // Navigate to request service page - replace with your routing logic
      toast.success(`Redirecting to request service from ${providerName}`);
      // navigate(`/request-service/${providerId}`);
      navigate(`/request-service/${providerId}`, {
         state: { providerName }, // optional: pass extra data
      });
      // <JobRequestForm providerId={providerId} providerName={providerName} onBack={handleBack}/>
       <EnhancedJobRequestForm providerId={12121121212} providerName={"Rohan"} onBack={handleBack}/>
      console.log("Requesting service from provider:", providerId);

   };

   const toggleCardExpansion = (profileId) => {
      const newExpanded = new Set(expandedCards);
      if (newExpanded.has(profileId)) {
         newExpanded.delete(profileId);
      } else {
         newExpanded.add(profileId);
      }
      setExpandedCards(newExpanded);
   };

   const getRatingStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      
      for (let i = 0; i < fullStars; i++) {
         stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      }
      
      if (hasHalfStar) {
         stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
      }
      
      const remainingStars = 5 - Math.ceil(rating);
      for (let i = 0; i < remainingStars; i++) {
         stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
      }
      
      return stars;
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         <NavbarSection/>
         <div className="bg-white shadow-sm border-b mt-3">
            <div className="max-w-7xl mx-auto px-6 py-6">
               <div className="flex items-center justify-between">
                  <div>
                     <h1 className="text-3xl font-bold text-[#004aad]">Find Service Providers</h1>
                     <p className="text-gray-600 mt-1">Discover qualified NDT professionals for your projects</p>
                  </div>
                  <Button
                     onClick={() => setShowFilters(!showFilters)}
                     variant="outline"
                     className="flex items-center gap-2"
                  >
                     <Filter className="w-4 h-4" />
                     Filters
                     {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Search and Filters */}
            <div className={`bg-white rounded-xl shadow-lg border transition-all duration-300 ${showFilters ? 'p-6' : 'p-4'}`}>
               {/* Quick Search */}
               <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <Input
                        className="pl-10"
                        placeholder="Search by company or inspector name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                     />
                  </div>
                  <div className="flex-1 relative">
                     <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <Input
                        className="pl-10"
                        placeholder="Location..."
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                     />
                  </div>
               </div>

               {/* Advanced Filters */}
               {showFilters && (
                  <div className="space-y-4 pt-4 border-t">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                        <Button
                           onClick={clearFilters}
                           variant="ghost"
                           size="sm"
                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                           <X className="w-4 h-4 mr-1" />
                           Clear All
                        </Button>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select value={searchService} onValueChange={setSearchService}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="NDT Service" />
                           </SelectTrigger>
                           <SelectContent>
                              {ndtServices.map((service) => (
                                 <SelectItem key={service._id} value={service.name.toLowerCase()}>
                                    {service.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        <Input
                           placeholder="Specialization (RT, UT, VT...)"
                           value={searchSpecialization}
                           onChange={(e) => setSearchSpecialization(e.target.value)}
                           className="w-full"
                        />

                        <Select value={searchCompanyCert} onValueChange={setSearchCompanyCert}>
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

                        {/* <Select value={searchPersonnelCert} onValueChange={setSearchPersonnelCert}>
                           <SelectTrigger>
                              <SelectValue placeholder="Personnel Certification" />
                           </SelectTrigger>
                           <SelectContent>
                              {PREDEFINED_PERSONNEL_CERTS.map((cert) => (
                                 <SelectItem key={cert} value={cert.toLowerCase()}>
                                    {cert}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select> */}
                     </div>
                  </div>
               )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
               <p className="text-gray-600">
                  Found <span className="font-semibold text-[#004aad]">{filteredProfiles.length}</span> provider{filteredProfiles.length !== 1 ? 's' : ''}
               </p>
            </div>

            {/* Provider Cards */}
            {filteredProfiles.length === 0 ? (
               <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                     <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No providers found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing filters</p>
                  <Button onClick={clearFilters} variant="outline">
                     Clear Filters
                  </Button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredProfiles.map((profile) => {
                     const isExpanded = expandedCards.has(profile._id);
                     
                     return (
                        <Card key={profile._id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
                           <div className="relative">
                              {profile.user?.isPremium && (
                                 <div className="absolute top-4 right-4 z-10">
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                       Premium
                                    </Badge>
                                 </div>
                              )}
                              
                              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                                 <div className="flex items-start gap-4 pt-4">
                                    <div className="flex-shrink-0">
                                       {profile.companyLogoUrl ? (
                                          <img
                                             src={profile.companyLogoUrl}
                                             alt={`${profile.companyName} logo`}
                                             className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-md"
                                          />
                                       ) : (
                                          <div className="w-16 h-16 rounded-lg bg-[#004aad] flex items-center justify-center">
                                             <Building2 className="w-8 h-8 text-white" />
                                          </div>
                                       )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                       <CardTitle className="text-lg font-bold text-gray-900 truncate">
                                          {profile.companyName}
                                       </CardTitle>
                                       
                                       <div className="flex items-center gap-2 mt-1">
                                          <MapPin className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">{profile.businessLocation || profile.companyLocation}</span>
                                       </div>
                                       
                                       <div className="flex items-center gap-2 mt-1">
                                          <Phone className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">{profile.contactNumber}</span>
                                       </div>
                                       
                                       {profile.rating > 0 && (
                                          <div className="flex items-center gap-2 mt-2">
                                             <div className="flex">{getRatingStars(profile.rating)}</div>
                                             <span className="text-sm font-medium text-gray-700">
                                                {profile.rating.toFixed(1)}
                                             </span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </CardHeader>
                           </div>

                           <CardContent className="p-6 space-y-4">
                              {profile.companyDescription && (
                                 <p className="text-gray-700 text-sm leading-relaxed">
                                    {isExpanded 
                                       ? profile.companyDescription 
                                       : `${profile.companyDescription.slice(0, 120)}${profile.companyDescription.length > 120 ? '...' : ''}`
                                    }
                                 </p>
                              )}

                              {/* Specializations */}
                              {profile.companySpecialization && (
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                       <Award className="w-4 h-4 text-[#004aad]" />
                                       <span className="font-medium text-gray-900">Specializations</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                       {(Array.isArray(profile.companySpecialization) 
                                          ? profile.companySpecialization 
                                          : profile.companySpecialization.split(',')
                                       ).map((spec, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs">
                                             {spec.trim()}
                                          </Badge>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* Services */}
                              {profile.serviceDetails?.length > 0 && (
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                       <Briefcase className="w-4 h-4 text-green-600" />
                                       <span className="font-medium text-gray-900">Services & Pricing</span>
                                    </div>
                                    <div className="space-y-1">
                                       {profile.serviceDetails.slice(0, isExpanded ? undefined : 2).map((service, i) => {
                                          const serviceCharge = profile.services?.find(s => s?.serviceId === service._id);
                                          return (
                                             <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">{service.name}</span>
                                                {serviceCharge && (
                                                   <span className="font-medium text-[#004aad]">
                                                      ${serviceCharge.charge} {serviceCharge.unit}
                                                   </span>
                                                )}
                                             </div>
                                          );
                                       })}
                                       {!isExpanded && profile.serviceDetails.length > 2 && (
                                          <p className="text-xs text-gray-500">
                                             +{profile.serviceDetails.length - 2} more services
                                          </p>
                                       )}
                                    </div>
                                 </div>
                              )}

                              {/* Certifications */}
                              {profile.certificates?.length > 0 && isExpanded && (
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                       <FileText className="w-4 h-4 text-purple-600" />
                                       <span className="font-medium text-gray-900">Certifications</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                       {profile.certificates.map((cert, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                             {cert?.certificateName || cert}
                                          </Badge>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 pt-4 border-t">
                                 <Button
                                    onClick={() => handleRequestService(profile.userId, profile.companyName)}
                                    className="flex-1 bg-[#004aad]"
                                 >
                                    <Send className="w-4 h-4 mr-2" />
                                    Request Service
                                 </Button>
                                 
                                 <Button
                                    onClick={() => toggleCardExpansion(profile._id)}
                                    variant="outline"
                                    size="sm"
                                 >
                                    {isExpanded ? (
                                       <ChevronUp className="w-4 h-4" />
                                    ) : (
                                       <ChevronDown className="w-4 h-4" />
                                    )}
                                 </Button>
                              </div>
                           </CardContent>
                        </Card>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
   );
};

export default FindProvider;