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
   User,
   Award,
   Briefcase,
   Clock,
   FileText,
   ChevronDown,
   ChevronUp,
   Lock,
   CreditCard,
   Mail,
   Eye,
   Building2,
   Map,
   List,
   Grid3X3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import { useNavigate } from "react-router-dom";
import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import InspectorContactAccessPayment from "@/components/InspectorContactAccessPayment";

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
//   background: #004aad !important;
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

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const ASSOCIATION_TYPES = [
   "Freelancer",
   "Company Employee"
];

const CERTIFICATION_BODIES = [
   "ASNT",
   "PCN",
   "ACCP",
   "CGSB",
   "BINDT",
   "AINDT",
   "Other"
];

const FindInspector = () => {
   const [inspectors, setInspectors] = useState([]);
   const [filteredInspectors, setFilteredInspectors] = useState([]);
   const [loading, setLoading] = useState(true);
   const [showFilters, setShowFilters] = useState(false);
   const [expandedCards, setExpandedCards] = useState(new Set());
   const [revealedContacts, setRevealedContacts] = useState(new Set());
   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
   const [selectedInspector, setSelectedInspector] = useState(null);
   const [viewMode, setViewMode] = useState('split'); // 'split', 'list', 'map'
   const [hoveredInspector, setHoveredInspector] = useState(null);
   const navigate = useNavigate();
   
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

   // Filter states
   const [searchName, setSearchName] = useState("");
   const [searchAssociationType, setSearchAssociationType] = useState("");
   const [searchCertification, setSearchCertification] = useState("");
   const [minRating, setMinRating] = useState(0);
   const [availabilityFilter, setAvailabilityFilter] = useState("all");

   useEffect(() => {
      const fetchData = async () => {
         try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(
               `${BACKEND_URL}/api/v1/inspectors/all`,
               {
                  headers: { Authorization: `Bearer ${accessToken}` },
               }
            );
            setInspectors(res.data?.data?.profiles || []);
            setFilteredInspectors(res.data?.data?.profiles || []);
         } catch (err) {
            console.error("Failed to fetch inspectors:", err);
            toast.error("Failed to load inspectors");
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   useEffect(() => {
      const filtered = inspectors.filter((inspector) => {
         const nameMatch = inspector?.fullName
            ?.toLowerCase()
            .includes(searchName.toLowerCase());
         
         const associationMatch = searchAssociationType === "" || 
            inspector?.associationType === searchAssociationType;
         
         const certificationMatch = searchCertification === "" ||
            inspector?.certifications?.some(cert =>
               cert?.certificationBody?.toLowerCase().includes(searchCertification.toLowerCase())
            );
         
         const ratingMatch = inspector?.rating >= minRating;
         
         const availabilityMatch = availabilityFilter === "all" ||
            (availabilityFilter === "available" && inspector?.availability) ||
            (availabilityFilter === "unavailable" && !inspector?.availability);

         return nameMatch && associationMatch && certificationMatch && 
                ratingMatch && availabilityMatch;
      });
      setFilteredInspectors(filtered);
   }, [
      searchName,
      searchAssociationType,
      searchCertification,
      minRating,
      availabilityFilter,
      inspectors,
   ]);

   const clearFilters = () => {
      setSearchName("");
      setSearchAssociationType("");
      setSearchCertification("");
      setMinRating(0);
      setAvailabilityFilter("all");
      toast.success("Filters cleared");
   };

   const handleContactAccess = (inspector) => {
      setSelectedInspector(inspector);
      setShowPaymentDialog(true);
   };

   const handlePaymentSuccess = () => {
      // Add the inspector to revealed contacts
      const newRevealed = new Set(revealedContacts);
      newRevealed.add(selectedInspector.userId);
      setRevealedContacts(newRevealed);
      
      setShowPaymentDialog(false);
      setSelectedInspector(null);
      toast.success("Contact information is now available!");
   };

   const handlePaymentCancel = () => {
      setShowPaymentDialog(false);
      setSelectedInspector(null);
   };

   const handleRequestService = (inspectorId, inspectorName) => {
      toast.success(`Redirecting to request service from ${inspectorName}`);
      navigate(`/request-service/${inspectorId}`, {
         state: { providerName: inspectorName, type: "inspector" },
      });
   };

   const toggleCardExpansion = (inspectorId) => {
      const newExpanded = new Set(expandedCards);
      if (newExpanded.has(inspectorId)) {
         newExpanded.delete(inspectorId);
      } else {
         newExpanded.add(inspectorId);
      }
      setExpandedCards(newExpanded);
   };

const InspectorCard = ({ 
   inspector, 
   isExpanded, 
   onToggleExpansion, 
   onRequestService, 
   onInspectorHover, 
   revealedContacts, 
   onContactAccess,
   isCompact = false 
}) => {
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

   const formatCurrency = (amount, currency = "USD") => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

   const ContactInfo = ({ inspector }) => {
      const isRevealed = revealedContacts.has(inspector.userId);

      if (isRevealed) {
         return (
            <div className="space-y-2">
               <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Contact Revealed</span>
               </div>
               
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-gray-500" />
                     <span className="text-sm text-gray-600">{inspector.contactNumber}</span>
                     <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Premium
                     </Badge>
                  </div>
                  {inspector.email && (
                     <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{inspector.email}</span>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                           Premium
                        </Badge>
                     </div>
                  )}
               </div>
               
               <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Contact info visible for this session only. Email copy sent to your inbox.
               </div>
            </div>
         );
      }

      return (
         <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
               <Lock className="w-4 h-4 text-amber-600" />
               <span className="text-sm text-amber-800">Premium Contact Info</span>
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
               onClick={() => onContactAccess(inspector)}
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
         onMouseEnter={() => onInspectorHover && onInspectorHover(inspector._id)}
         onMouseLeave={() => onInspectorHover && onInspectorHover(null)}
      >
         <div className="relative">
            {inspector.verified && (
               <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                     Verified
                  </Badge>
               </div>
            )}
            
            <CardHeader className={`bg-gradient-to-r from-blue-50 to-indigo-50 ${isCompact ? 'pb-2' : 'pb-4'}`}>
               <div className="flex items-start gap-4 pt-4">
                  <div className="flex-shrink-0">
                     {inspector.userId?.avatar ? (
                        <img
                           src={inspector.userId?.avatar}
                           alt={inspector.fullName}
                           className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg object-cover border`}
                        />
                     ) : (
                        <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg bg-[#004aad] flex items-center justify-center`}>
                           <User className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                        </div>
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <CardTitle className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-gray-900 truncate`}>
                        {inspector.fullName}
                     </CardTitle>
                     
                     <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                           {inspector.associationType}
                           {inspector.companyName && ` - ${inspector.companyName}`}
                        </span>
                     </div>
                     
                     {!isCompact && (
                        <div className="mt-2">
                           <ContactInfo inspector={inspector} />
                        </div>
                     )}
                     
                     {inspector.rating >= 0 && (
                        <div className="flex items-center gap-2 mt-2">
                           <div className="flex">{getRatingStars(inspector.rating)}</div>
                           <span className="text-sm font-medium text-gray-700">
                              {inspector.rating.toFixed(1)} ({inspector.totalRatings} reviews)
                           </span>
                        </div>
                     )}
                     
                     <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className={`text-sm ${inspector.availability ? 'text-green-600' : 'text-red-600'}`}>
                           {inspector.availability ? 'Available' : 'Unavailable'}
                        </span>
                     </div>
                  </div>
               </div>
            </CardHeader>
         </div>

         <CardContent className={`${isCompact ? 'p-4' : 'p-6'} space-y-4`}>
            {/* Rates */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">Rates</span>
               </div>
               <div className="space-y-1">
                  {inspector.hourlyRate && (
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Hourly Rate:</span>
                        <span className="font-medium text-[#004aad]">
                           {formatCurrency(inspector.hourlyRate, inspector.currency)}
                        </span>
                     </div>
                  )}
                  {inspector.monthlyRate && !isCompact && (
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Monthly Rate:</span>
                        <span className="font-medium text-[#004aad]">
                           {formatCurrency(inspector.monthlyRate, inspector.currency)}
                        </span>
                     </div>
                  )}
               </div>
            </div>

            {/* Certifications */}
            {inspector.certifications?.length > 0 && (
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <Award className="w-4 h-4 text-[#004aad]" />
                     <span className="font-medium text-gray-900">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {inspector.certifications.slice(0, isExpanded ? undefined : (isCompact ? 2 : 3)).map((cert, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                           {cert.certificationBody} - {cert.level}
                        </Badge>
                     ))}
                     {!isExpanded && inspector.certifications.length > (isCompact ? 2 : 3) && (
                        <Badge variant="outline" className="text-xs">
                           +{inspector.certifications.length - (isCompact ? 2 : 3)} more
                        </Badge>
                     )}
                  </div>
               </div>
            )}

            {/* Subscription Plan */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Plan</span>
               </div>
               <Badge 
                  variant={inspector.subscriptionPlan === 'Pro' ? 'default' : 'secondary'}
                  className={inspector.subscriptionPlan === 'Pro' ? 'bg-purple-600' : ''}
               >
                  {inspector.subscriptionPlan}
               </Badge>
            </div>

            {/* Total Earnings (if expanded) */}
            {isExpanded && inspector.totalEarnings > 0 && (
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <Award className="w-4 h-4 text-green-600" />
                     <span className="font-medium text-gray-900">Total Earnings</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                     {formatCurrency(inspector.totalEarnings, inspector.currency)}
                  </p>
               </div>
            )}

            {/* Show contact info in compact mode */}
            {isCompact && (
               <div className="pt-2 border-t">
                  <ContactInfo inspector={inspector} />
               </div>
            )}

            {/* Action Buttons */}
            <div className={`flex items-center gap-3 pt-4 border-t ${isCompact ? 'flex-col' : ''}`}>
               <Button
                  onClick={() => onRequestService(inspector.userId, inspector.fullName)}
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

const InspectorMap = ({ inspectors, onRequestService, hoveredInspector, onInspectorHover }) => {
   const center = inspectors.length
      ? [inspectors[0].latitude || 0, inspectors[0].longitude || 0]
      : [-25.2744, 133.7751]; // Default: center of Australia

   // Component to handle map centering
   const MapController = () => {
      const map = useMap();
      
      useEffect(() => {
         if (hoveredInspector) {
            const inspector = inspectors.find(p => p._id === hoveredInspector);
            if (inspector && inspector.latitude && inspector.longitude) {
               map.flyTo([inspector.latitude, inspector.longitude], 12, {
                  duration: 0.5
               });
            }
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [hoveredInspector, map]);
      
      return null;
   };

   // Custom icon for highlighted inspector
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

            {inspectors.map((inspector) => {
               if (inspector.latitude == null || inspector.longitude == null)
                  return null;

               const isHighlighted = hoveredInspector === inspector._id;

               return (
                  <Marker
                     key={inspector._id}
                     position={[inspector.latitude, inspector.longitude]}
                     icon={createCustomIcon(isHighlighted)}
                     eventHandlers={{
                        mouseover: () => onInspectorHover && onInspectorHover(inspector._id),
                        mouseout: () => onInspectorHover && onInspectorHover(null),
                     }}
                  >
                     <Tooltip 
                        direction="top" 
                        offset={[0, -10]} 
                        opacity={0.9}
                        permanent={isHighlighted}
                        className={isHighlighted ? 'highlighted-tooltip' : ''}
                     >
                        <div className="text-sm font-medium text-white">
                           {inspector.fullName}
                        </div>
                     </Tooltip>

                     <Popup maxWidth={300} closeButton={true}>
                        <div className="space-y-3 w-72 p-2">
                           <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                 {inspector.userId?.avatar ? (
                                    <img
                                       src={inspector.userId?.avatar}
                                       alt={inspector.fullName}
                                       className="w-12 h-12 rounded-lg object-cover border"
                                    />
                                 ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[#004aad] flex items-center justify-center">
                                       <User className="w-6 h-6 text-white" />
                                    </div>
                                 )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <div className="font-semibold text-[#004aad] text-lg">
                                    {inspector.fullName}
                                 </div>
                                 <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {inspector.associationType}
                                 </div>
                                 
                                 {inspector.rating >= 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                       <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                       <span className="text-sm font-medium">
                                          {inspector.rating.toFixed(1)}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {inspector.certifications?.length > 0 && (
                              <div className="text-sm">
                                 <span className="font-medium text-gray-700">Certifications: </span>
                                 <span className="text-gray-600">
                                    {inspector.certifications
                                       .slice(0, 2)
                                       .map((cert) => `${cert.certificationBody} - ${cert.level}`)
                                       .join(", ")}
                                    {inspector.certifications.length > 2 && "..."}
                                 </span>
                              </div>
                           )}

                           {inspector.hourlyRate && (
                              <div className="text-sm">
                                 <span className="font-medium text-gray-700">Hourly Rate: </span>
                                 <span className="text-[#004aad] font-medium">
                                    ${inspector.hourlyRate}/{inspector.currency || 'USD'}
                                 </span>
                              </div>
                           )}

                           <div className="text-sm">
                              <span className="font-medium text-gray-700">Status: </span>
                              <span className={`${inspector.availability ? 'text-green-600' : 'text-red-600'}`}>
                                 {inspector.availability ? 'Available' : 'Unavailable'}
                              </span>
                           </div>

                           <Button
                              size="sm"
                              className="bg-[#004aad] w-full hover:bg-[#003285]"
                              onClick={() =>
                                 onRequestService(
                                    inspector.userId,
                                    inspector.fullName
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
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                     <h1 className="text-3xl font-bold text-[#004aad]">Find NDT Inspectors</h1>
                     <p className="text-gray-600 mt-1">Discover qualified NDT inspection professionals</p>
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
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     </Button>
                  </div>
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
                        placeholder="Search by inspector name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
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
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={searchAssociationType} onValueChange={setSearchAssociationType}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Association Type" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="">All Types</SelectItem>
                              {ASSOCIATION_TYPES.map((type) => (
                                 <SelectItem key={type} value={type}>
                                    {type}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        <Select value={searchCertification} onValueChange={setSearchCertification}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Certification Body" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="">All Certifications</SelectItem>
                              {CERTIFICATION_BODIES.map((cert) => (
                                 <SelectItem key={cert} value={cert.toLowerCase()}>
                                    {cert}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        <Select value={minRating.toString()} onValueChange={(value) => setMinRating(parseInt(value))}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Minimum Rating" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="0">Any Rating</SelectItem>
                              <SelectItem value="1">1+ Stars</SelectItem>
                              <SelectItem value="2">2+ Stars</SelectItem>
                              <SelectItem value="3">3+ Stars</SelectItem>
                              <SelectItem value="4">4+ Stars</SelectItem>
                              <SelectItem value="5">5 Stars Only</SelectItem>
                           </SelectContent>
                        </Select>

                        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Availability" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Inspectors</SelectItem>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="unavailable">Unavailable</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
               )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
               <p className="text-gray-600">
                  Found <span className="font-semibold text-[#004aad]">{filteredInspectors.length}</span> inspector{filteredInspectors.length !== 1 ? 's' : ''}
               </p>
            </div>

            {/* Zillow-like Layout */}
            {filteredInspectors.length === 0 ? (
               <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                     <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No inspectors found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing filters</p>
                  <Button onClick={clearFilters} variant="outline">
                     Clear Filters
                  </Button>
               </div>
            ) : (
               <>
                  {/* Map Only View */}
                  {viewMode === 'map' && (
                     <div className="h-[80vh]">
                        <InspectorMap
                           inspectors={filteredInspectors}
                           onRequestService={handleRequestService}
                           hoveredInspector={hoveredInspector}
                           onInspectorHover={setHoveredInspector}
                        />
                     </div>
                  )}

                  {/* List Only View */}
                  {viewMode === 'list' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredInspectors.map((inspector) => (
                           <InspectorCard
                              key={inspector._id}
                              inspector={inspector}
                              isExpanded={expandedCards.has(inspector._id)}
                              onToggleExpansion={() => toggleCardExpansion(inspector._id)}
                              onRequestService={handleRequestService}
                              onInspectorHover={setHoveredInspector}
                              revealedContacts={revealedContacts}
                              onContactAccess={handleContactAccess}
                           />
                        ))}
                     </div>
                  )}

                  {/* Split View (Zillow-style) */}
                  {viewMode === 'split' && (
                     <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">
                        {/* Left side - Inspector List */}
                        <div className="flex-1 lg:max-w-2xl overflow-y-auto pr-0 lg:pr-4">
                           <div className="space-y-6">
                              {filteredInspectors.map((inspector) => (
                                 <InspectorCard
                                    key={inspector._id}
                                    inspector={inspector}
                                    isExpanded={expandedCards.has(inspector._id)}
                                    onToggleExpansion={() => toggleCardExpansion(inspector._id)}
                                    onRequestService={handleRequestService}
                                    onInspectorHover={setHoveredInspector}
                                    revealedContacts={revealedContacts}
                                    onContactAccess={handleContactAccess}
                                    isCompact={true}
                                 />
                              ))}
                           </div>
                        </div>

                        {/* Right side - Map */}
                        <div className="flex-1 h-96 lg:h-full lg:sticky lg:top-0">
                           <InspectorMap
                              inspectors={filteredInspectors}
                              onRequestService={handleRequestService}
                              hoveredInspector={hoveredInspector}
                              onInspectorHover={setHoveredInspector}
                           />
                        </div>
                     </div>
                  )}
               </>
            )}
         </div>

         {/* Payment Dialog */}
         <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
           <DialogContent  className="w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl 
               max-h-[90vh] overflow-y-auto p-4 sm:p-6">
               <DialogHeader>
                  <DialogTitle>Inspector Contact Access Payment</DialogTitle>
               </DialogHeader>
               {selectedInspector && (
                  <Elements stripe={stripePromise}>
                     <InspectorContactAccessPayment
                        inspector={selectedInspector}
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

export default FindInspector;
