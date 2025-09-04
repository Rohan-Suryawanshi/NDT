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
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
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
   ChevronUp,
   Lock,
   CreditCard,
   Mail,
   Eye,
   Map,
   List,
   Grid3X3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import EnhancedJobRequestForm from "@/features/JobRequest/EnhancedJobRequestForm";
import { useNavigate } from "react-router-dom";
import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ContactAccessPayment from "@/components/ContactAccessPayment";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

import {
   MapContainer,
   TileLayer,
   Marker,
   Popup,
   Tooltip,
   useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom CSS for map markers and tooltips
const mapStyles = `
.custom-marker {
  background: transparent !important;
  border: none !important;
}

.highlighted-tooltip {
  background: #004aad !important;
  color: white !important;
  border: none !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
}

.highlighted-tooltip::before {
  border-top-color: #004aad !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = mapStyles;
  document.head.appendChild(styleSheet);
}

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
   iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
   shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

const FindProvider = () => {
   const [profiles, setProfiles] = useState([]);
   const [filteredProfiles, setFilteredProfiles] = useState([]);
   const [ndtServices, setNdtServices] = useState([]);
   const [loading, setLoading] = useState(true);
   const [showFilters, setShowFilters] = useState(false);
   const [expandedCards, setExpandedCards] = useState(new Set());
   const [revealedContacts, setRevealedContacts] = useState(new Set());
   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
   const [selectedProfile, setSelectedProfile] = useState(null);
   const [viewMode, setViewMode] = useState('split'); // 'split', 'list', 'map'
   const [hoveredProvider, setHoveredProvider] = useState(null);
   
   // Auto-adjust view mode for mobile
   useEffect(() => {
      const handleResize = () => {
         if (window.innerWidth < 1024 && viewMode === 'split') {
            setViewMode('list');
         }
      };
      
      window.addEventListener('resize', handleResize);
      handleResize(); // Check on initial load
      
      return () => window.removeEventListener('resize', handleResize);
   }, [viewMode]);
   const navigate = useNavigate();

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

         const companyCertMatch = profile?.certificates?.some((c) =>
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

   const handleContactAccess = (profile) => {
      setSelectedProfile(profile);
      setShowPaymentDialog(true);
   };

   const handlePaymentSuccess = () => {
      // Add the profile to revealed contacts
      const newRevealed = new Set(revealedContacts);
      newRevealed.add(selectedProfile.userId);
      setRevealedContacts(newRevealed);

      setShowPaymentDialog(false);
      setSelectedProfile(null);
      toast.success("Contact information is now available!");
   };

   const handlePaymentCancel = () => {
      setShowPaymentDialog(false);
      setSelectedProfile(null);
   };

   const handleRequestService = (providerId, providerName) => {
      // Navigate to request service page - replace with your routing logic
      toast.success(`Redirecting to request service from ${providerName}`);
      // navigate(`/request-service/${providerId}`);
      navigate(`/request-service/${providerId}`, {
         state: { providerName }, // optional: pass extra data
      });
      // <JobRequestForm providerId={providerId} providerName={providerName} onBack={handleBack}/>
      <EnhancedJobRequestForm
         providerId={12121121212}
         providerName={"Rohan"}
         onBack={handleBack}
      />;
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

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         <NavbarSection />
         <div className="bg-white shadow-sm border-b mt-3">
            <div className="max-w-7xl mx-auto px-6 py-6">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                     <h1 className="text-3xl font-bold text-[#004aad]">
                        Find Service Providers
                     </h1>
                     <p className="text-gray-600 mt-1">
                        Discover qualified NDT professionals for your projects
                     </p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                     {/* View Mode Toggle */}
                     <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-1 sm:flex-initial">
                        <button
                           onClick={() => setViewMode('list')}
                           className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                              viewMode === 'list'
                                 ? 'bg-white text-[#004aad] shadow-sm'
                                 : 'text-gray-600 hover:text-gray-900'
                           }`}
                        >
                           <List className="w-4 h-4 mr-1 inline" />
                           List
                        </button>
                        <button
                           onClick={() => setViewMode('split')}
                           className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial hidden lg:block ${
                              viewMode === 'split'
                                 ? 'bg-white text-[#004aad] shadow-sm'
                                 : 'text-gray-600 hover:text-gray-900'
                           }`}
                        >
                           <Grid3X3 className="w-4 h-4 mr-1 inline" />
                           Split
                        </button>
                        <button
                           onClick={() => setViewMode('map')}
                           className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                              viewMode === 'map'
                                 ? 'bg-white text-[#004aad] shadow-sm'
                                 : 'text-gray-600 hover:text-gray-900'
                           }`}
                        >
                           <Map className="w-4 h-4 mr-1 inline" />
                           Map
                        </button>
                     </div>
                     
                     <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        className="flex items-center gap-2 whitespace-nowrap"
                     >
                        <Filter className="w-4 h-4" />
                        Filters
                        {showFilters ? (
                           <ChevronUp className="w-4 h-4" />
                        ) : (
                           <ChevronDown className="w-4 h-4" />
                        )}
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Search and Filters */}
            <div
               className={`bg-white rounded-xl shadow-lg border transition-all duration-300 ${
                  showFilters ? "p-6" : "p-4"
               }`}
            >
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
                        <h3 className="text-lg font-semibold text-gray-900">
                           Advanced Filters
                        </h3>
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

                        <Input
                           placeholder="Specialization (RT, UT, VT...)"
                           value={searchSpecialization}
                           onChange={(e) =>
                              setSearchSpecialization(e.target.value)
                           }
                           className="w-full"
                        />

                        <Select
                           value={searchCompanyCert}
                           onValueChange={setSearchCompanyCert}
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Company Certification" />
                           </SelectTrigger>
                           <SelectContent>
                              {PREDEFINED_CERTIFICATIONS.map((cert) => (
                                 <SelectItem
                                    key={cert}
                                    value={cert.toLowerCase()}
                                 >
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
                  Found{" "}
                  <span className="font-semibold text-[#004aad]">
                     {filteredProfiles.length}
                  </span>{" "}
                  provider{filteredProfiles.length !== 1 ? "s" : ""}
               </p>
            </div>

            {/* Zillow-like Layout */}
            {filteredProfiles.length === 0 ? (
               <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                     <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                     No providers found
                  </h3>
                  <p className="text-gray-600 mb-4">
                     Try adjusting your search criteria or clearing filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                     Clear Filters
                  </Button>
               </div>
            ) : (
               <>
                  {/* Map Only View */}
                  {viewMode === 'map' && (
                     <div className="h-[80vh]">
                        <ProviderMap
                           providers={filteredProfiles}
                           onRequestService={handleRequestService}
                           hoveredProvider={hoveredProvider}
                           onProviderHover={setHoveredProvider}
                        />
                     </div>
                  )}

                  {/* List Only View */}
                  {viewMode === 'list' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredProfiles.map((profile) => (
                           <ProviderCard
                              key={profile._id}
                              profile={profile}
                              isExpanded={expandedCards.has(profile._id)}
                              onToggleExpansion={() => toggleCardExpansion(profile._id)}
                              onRequestService={handleRequestService}
                              onProviderHover={setHoveredProvider}
                              revealedContacts={revealedContacts}
                              onContactAccess={handleContactAccess}
                           />
                        ))}
                     </div>
                  )}

                  {/* Split View (Zillow-style) */}
                  {viewMode === 'split' && (
                     <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">
                        {/* Left side - Provider List */}
                        <div className="flex-1 lg:max-w-2xl overflow-y-auto pr-0 lg:pr-4">
                           <div className="space-y-6">
                              {filteredProfiles.map((profile) => (
                                 <ProviderCard
                                    key={profile._id}
                                    profile={profile}
                                    isExpanded={expandedCards.has(profile._id)}
                                    onToggleExpansion={() => toggleCardExpansion(profile._id)}
                                    onRequestService={handleRequestService}
                                    onProviderHover={setHoveredProvider}
                                    revealedContacts={revealedContacts}
                                    onContactAccess={handleContactAccess}
                                    isCompact={true}
                                 />
                              ))}
                           </div>
                        </div>

                        {/* Right side - Map */}
                        <div className="flex-1 h-96 lg:h-full lg:sticky lg:top-0">
                           <ProviderMap
                              providers={filteredProfiles}
                              onRequestService={handleRequestService}
                              hoveredProvider={hoveredProvider}
                              onProviderHover={setHoveredProvider}
                           />
                        </div>
                     </div>
                  )}
               </>
            )}
         </div>

         {/* Payment Dialog */}
         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent
               className="w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl 
               max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            >
               <DialogHeader>
                  <DialogTitle>Contact Access Payment</DialogTitle>
               </DialogHeader>
               {selectedProfile && (
                  <Elements stripe={stripePromise}>
                     <ContactAccessPayment
                        profile={selectedProfile}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                     />
                  </Elements>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
};

const ProviderCard = ({ 
   profile, 
   isExpanded, 
   onToggleExpansion, 
   onRequestService, 
   onProviderHover, 
   revealedContacts, 
   onContactAccess,
   isCompact = false 
}) => {
   const getRatingStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;

      for (let i = 0; i < fullStars; i++) {
         stars.push(
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
         );
      }

      if (hasHalfStar) {
         stars.push(
            <Star
               key="half"
               className="w-4 h-4 fill-yellow-200 text-yellow-400"
            />
         );
      }

      const remainingStars = 5 - Math.ceil(rating);
      for (let i = 0; i < remainingStars; i++) {
         stars.push(
            <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
         );
      }

      return stars;
   };

   const ContactInfo = ({ profile }) => {
      const isRevealed = revealedContacts.has(profile.userId);

      if (isRevealed) {
         return (
            <div className="space-y-2">
               <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                     Contact Revealed
                  </span>
               </div>

               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-gray-500" />
                     <span className="text-sm text-gray-600">
                        {profile.contactNumber}
                     </span>
                     <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-700"
                     >
                        Premium
                     </Badge>
                  </div>
                  {profile.email && (
                     <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                           {profile.email}
                        </span>
                        <Badge
                           variant="secondary"
                           className="text-xs bg-green-100 text-green-700"
                        >
                           Premium
                        </Badge>
                     </div>
                  )}
               </div>

               <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Contact info visible for this session only. Email copy sent
                  to your inbox.
               </div>
            </div>
         );
      }

      return (
         <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
               <Lock className="w-4 h-4 text-amber-600" />
               <span className="text-sm text-amber-800">
                  Premium Contact Info
               </span>
            </div>

            <div className="space-y-1">
               <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">••• ••• ••••</span>
                  <Lock className="w-3 h-3" />
               </div>
               <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">•••••@••••.com</span>
                  <Lock className="w-3 h-3" />
               </div>
            </div>

            <Button
               onClick={() => onContactAccess(profile)}
               size="sm"
               className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
               <CreditCard className="w-4 h-4 mr-2" />
               Unlock Contact
            </Button>
         </div>
      );
   };

   return (
      <Card
         className={`group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md ${
            isCompact ? 'hover:bg-blue-50' : ''
         }`}
         onMouseEnter={() => onProviderHover && onProviderHover(profile._id)}
         onMouseLeave={() => onProviderHover && onProviderHover(null)}
      >
         <div className="relative">
            {profile.user?.isPremium && (
               <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                     Premium
                  </Badge>
               </div>
            )}

            <CardHeader className={`bg-gradient-to-r from-blue-50 to-indigo-50 ${isCompact ? 'pb-2' : 'pb-4'}`}>
               <div className="flex items-start gap-4 pt-4">
                  <div className="flex-shrink-0">
                     {profile.companyLogoUrl ? (
                        <img
                           src={profile.companyLogoUrl}
                           alt={`${profile.companyName} logo`}
                           className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg object-cover border-2 border-white shadow-md`}
                        />
                     ) : (
                        <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg bg-[#004aad] flex items-center justify-center`}>
                           <Building2 className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                        </div>
                     )}
                  </div>

                  <div className="flex-1 min-w-0">
                     <CardTitle className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-gray-900 truncate`}>
                        {profile.companyName}
                     </CardTitle>

                     <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                           {profile.businessLocation || profile.companyLocation}
                        </span>
                     </div>

                     {!isCompact && (
                        <div className="mt-2">
                           <ContactInfo profile={profile} />
                        </div>
                     )}

                     {profile.rating !== undefined && profile.rating !== null && (
                        <div className="flex items-center gap-2 mt-2">
                           <div className="flex">
                              {getRatingStars(profile.rating)}
                           </div>
                           <span className="text-sm font-medium text-gray-700">
                              {profile.rating.toFixed(1)}
                           </span>
                        </div>
                     )}
                  </div>
               </div>
            </CardHeader>
         </div>

         <CardContent className={`${isCompact ? 'p-4' : 'p-6'} space-y-4`}>
            {profile.companyDescription && (
               <p className="text-gray-700 text-sm leading-relaxed">
                  {isExpanded
                     ? profile.companyDescription
                     : `${profile.companyDescription.slice(0, isCompact ? 80 : 120)}${
                          profile.companyDescription.length > (isCompact ? 80 : 120) ? "..." : ""
                       }`}
               </p>
            )}

            {/* Specializations */}
            {profile.companySpecialization && (
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <Award className="w-4 h-4 text-[#004aad]" />
                     <span className="font-medium text-gray-900">
                        Specializations
                     </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {(Array.isArray(profile.companySpecialization)
                        ? profile.companySpecialization
                        : profile.companySpecialization.split(",")
                     ).map((spec, i) => (
                        <Badge
                           key={i}
                           variant="secondary"
                           className="text-xs"
                        >
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
                     <span className="font-medium text-gray-900">
                        Services & Pricing
                     </span>
                  </div>
                  <div className="space-y-1">
                     {profile.serviceDetails
                        .slice(0, isExpanded ? undefined : (isCompact ? 1 : 2))
                        .map((service, i) => {
                           const serviceCharge = profile.services?.find(
                              (s) => s?.serviceId === service._id
                           );
                           return (
                              <div
                                 key={i}
                                 className="flex items-center justify-between text-sm"
                              >
                                 <span className="text-gray-700">
                                    {service.name}
                                 </span>
                                 {serviceCharge && (
                                    <span className="font-medium text-[#004aad]">
                                       {serviceCharge.charge}{" "}
                                       {serviceCharge.currency}{" "}
                                       {serviceCharge.unit}
                                    </span>
                                 )}
                              </div>
                           );
                        })}
                     {!isExpanded && profile.serviceDetails.length > (isCompact ? 1 : 2) && (
                        <p className="text-xs text-gray-500">
                           +{profile.serviceDetails.length - (isCompact ? 1 : 2)} more services
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
                     <span className="font-medium text-gray-900">
                        Certifications
                     </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                     {profile.certificates.map((cert, i) => (
                        <Badge
                           key={i}
                           variant="outline"
                           className="text-xs"
                        >
                           {cert?.certificateName || cert}
                        </Badge>
                     ))}
                  </div>
               </div>
            )}

            {/* Show contact info in compact mode */}
            {isCompact && (
               <div className="pt-2 border-t">
                  <ContactInfo profile={profile} />
               </div>
            )}

            {/* Action Buttons */}
            <div className={`flex items-center gap-3 pt-4 border-t ${isCompact ? 'flex-col' : ''}`}>
               <Button
                  onClick={() => onRequestService(profile.userId, profile.companyName)}
                  className={`${isCompact ? 'w-full' : 'flex-1'} bg-[#004aad]`}
                  size={isCompact ? 'sm' : 'default'}
               >
                  <Send className="w-4 h-4 mr-2" />
                  Request Service
               </Button>

               <Button
                  onClick={onToggleExpansion}
                  variant="outline"
                  size="sm"
                  className={isCompact ? 'w-full' : ''}
               >
                  {isExpanded ? (
                     <>
                        <ChevronUp className="w-4 h-4" />
                        {isCompact && <span className="ml-2">Show Less</span>}
                     </>
                  ) : (
                     <>
                        <ChevronDown className="w-4 h-4" />
                        {isCompact && <span className="ml-2">Show More</span>}
                     </>
                  )}
               </Button>
            </div>
         </CardContent>
      </Card>
   );
};

const ProviderMap = ({ providers, onRequestService, hoveredProvider, onProviderHover }) => {
   const center = providers.length
      ? [providers[0].companyLat || 0, providers[0].companyLng || 0]
      : [-25.2744, 133.7751]; // Default: center of Australia

   // Component to handle map centering
   const MapController = () => {
      const map = useMap();
      
      useEffect(() => {
         if (hoveredProvider) {
            const provider = providers.find(p => p._id === hoveredProvider);
            if (provider && provider.companyLat && provider.companyLng) {
               map.flyTo([provider.companyLat, provider.companyLng], 12, {
                  duration: 0.5
               });
            }
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [hoveredProvider, map]);
      
      return null;
   };

   // Custom icon for highlighted provider
   const createCustomIcon = (isHighlighted = false) => {
      return L.divIcon({
         className: 'custom-marker',
         html: `<div style="
            background-color: ${isHighlighted ? '#ff6b35' : '#004aad'};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transform: ${isHighlighted ? 'scale(1.3)' : 'scale(1)'};
            transition: all 0.2s ease;
            position: relative;
            z-index: ${isHighlighted ? '1000' : '100'};
         "></div>`,
         iconSize: [24, 24],
         iconAnchor: [12, 12],
      });
   };

   return (
      <div className="h-full rounded-xl overflow-hidden border shadow-lg bg-white">
         <MapContainer
            center={center}
            zoom={4.5}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
         >
            <MapController />
            <TileLayer
               attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
            />

            {providers.map((provider) => {
               if (provider.companyLat == null || provider.companyLng == null)
                  return null;

               const isHighlighted = hoveredProvider === provider._id;

               return (
                  <Marker
                     key={provider._id}
                     position={[provider.companyLat, provider.companyLng]}
                     icon={createCustomIcon(isHighlighted)}
                     eventHandlers={{
                        mouseover: () => onProviderHover && onProviderHover(provider._id),
                        mouseout: () => onProviderHover && onProviderHover(null),
                     }}
                  >
                     <Tooltip 
                        direction="top" 
                        offset={[0, -10]} 
                        opacity={0.9}
                        permanent={isHighlighted}
                        className={isHighlighted ? 'highlighted-tooltip' : ''}
                     >
                        <div className="text-sm font-medium text-blue-800">
                           {provider.companyName}
                        </div>
                     </Tooltip>

                     <Popup maxWidth={300} closeButton={true}>
                        <div className="space-y-3 w-72 p-2">
                           <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                 {provider.companyLogoUrl ? (
                                    <img
                                       src={provider.companyLogoUrl}
                                       alt={`${provider.companyName} logo`}
                                       className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                                    />
                                 ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[#004aad] flex items-center justify-center">
                                       <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                 )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <div className="font-semibold text-[#004aad] text-lg">
                                    {provider.companyName}
                                 </div>
                                 <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {provider.companyLocation}
                                 </div>
                                 
                                 {provider.rating !== undefined && provider.rating !== null && (
                                    <div className="flex items-center gap-1 mt-1">
                                       <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                       <span className="text-sm font-medium">
                                          {provider.rating.toFixed(1)}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {provider.companySpecialization && (
                              <div className="text-sm">
                                 <span className="font-medium text-gray-700">Specializations: </span>
                                 <span className="text-gray-600">
                                    {Array.isArray(provider.companySpecialization)
                                       ? provider.companySpecialization.slice(0, 3).join(", ")
                                       : provider.companySpecialization.split(",").slice(0, 3).join(", ")
                                    }
                                    {(Array.isArray(provider.companySpecialization) 
                                       ? provider.companySpecialization.length > 3
                                       : provider.companySpecialization.split(",").length > 3
                                    ) && "..."}
                                 </span>
                              </div>
                           )}

                           {provider.serviceDetails?.length > 0 && (
                              <div className="text-sm">
                                 <span className="font-medium text-gray-700">Services: </span>
                                 <span className="text-gray-600">
                                    {provider.serviceDetails
                                       .slice(0, 2)
                                       .map((s) => s.name)
                                       .join(", ")}
                                    {provider.serviceDetails.length > 2 && "..."}
                                 </span>
                              </div>
                           )}

                           <Button
                              size="sm"
                              className="bg-[#004aad] w-full hover:bg-[#003285]"
                              onClick={() =>
                                 onRequestService(
                                    provider.userId,
                                    provider.companyName
                                 )
                              }
                           >
                              <Send className="w-4 h-4 mr-2" />
                              Request Service
                           </Button>
                        </div>
                     </Popup>
                  </Marker>
               );
            })}
         </MapContainer>
      </div>
   );
};

export default FindProvider;
