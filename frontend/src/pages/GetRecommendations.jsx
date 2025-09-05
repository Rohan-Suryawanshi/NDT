import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
   Star,
   MapPin,
   Search,
   Filter,
   Building2,
   Award,
   Phone,
   Mail,
   RefreshCw,
   TrendingUp,
   Target,
   Users,
   CheckCircle,
   AlertCircle,
   Eye,
   Send,
   DollarSign,
   Clock,
   Shield,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BACKEND_URL } from "@/constant/Global";

import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Location } from "@/constant/Location";
import { Textarea } from "@/components/ui/textarea";

const GetRecommendations = () => {
   // State Management
   const [providers, setProviders] = useState([]);
   const [services, setServices] = useState([]);
   const [recommendations, setRecommendations] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [selectedProvider, setSelectedProvider] = useState(null);
   const [showDetailsModal, setShowDetailsModal] = useState(false);
   const [serviceOptions, setServiceOptions] = useState([]);

   // Job Request Modal State
   const [showRequestModal, setShowRequestModal] = useState(false);
   const [jobRequest, setJobRequest] = useState({
      title: "",
      description: "",
      location: "",
      region: "",
      urgencyLevel: "medium",
      preferredStartDate: "",
      expectedCompletionDate: "",
      requiredServices: [],
      projectDuration: 1,
      numInspectors: 1,
      estimatedTotal: 0,
      isPremium: false,
      complianceRequirements: [],
      attachments: [],
   });

   const URGENCY_LEVELS = [
      {
         value: "low",
         label: "Low Priority",
         color: "bg-green-100 text-green-800",
      },
      {
         value: "medium",
         label: "Medium Priority",
         color: "bg-yellow-100 text-yellow-800",
      },
      {
         value: "high",
         label: "High Priority",
         color: "bg-orange-100 text-orange-800",
      },
      { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
   ];
   const COMPLIANCE_STANDARDS = [
      "ASME Section V",
      "ISO 9712",
      "ASTM E709",
      "EN 473",
      "API 1104",
      "AWS D1.1",
   ];
   const [submitting, setSubmitting] = useState(false);


   // Reset job request form
   const resetJobRequestForm = () => {
      setJobRequest({
         title: "",
         description: "",
         location: "",
         region: "",
         urgencyLevel: "medium",
         preferredStartDate: "",
         expectedCompletionDate: "",
         requiredServices: [],
         projectDuration: 1,
         numInspectors: 1,
         estimatedTotal: 0,
         isPremium: false,
         complianceRequirements: [],
         attachments: [],
      });
   };

   const fetchService = useCallback(async () => {
      try {
         const accessToken = localStorage.getItem("accessToken");

         const response = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
         });

         if (response.data.success) {
            setServiceOptions(response.data.data || []);
         }
      } catch (error) {
         console.error("Error fetching services:", error);
         toast.error("Failed to load services");
      }
   }, []);

   useEffect(() => {
      fetchService();
   }, [fetchService]);

   // Submit job request
   const handleSubmitJobRequest = async () => {
      try {
         if (
            !jobRequest.title ||
            !jobRequest.description ||
            !jobRequest.location ||
            !jobRequest.preferredStartDate
         ) {
            toast.error("Please fill in all required fields");
            return;
         }
         if (jobRequest.requiredServices.length === 0) {
            toast.error("Please select at least one service");
            return;
         }
         setSubmitting(true);
         const accessToken = localStorage.getItem("accessToken");
         const estimatedTotal =
            (selectedProvider.services?.[0]?.charge || 0) *
               jobRequest.projectDuration *
               8 +
            ((selectedProvider.services?.[0]?.charge || 0) / 30) *
               jobRequest.projectDuration *
               jobRequest.numInspectors;
         const requestData = {
            title: jobRequest.title,
            description: jobRequest.description,
            location: jobRequest.location,
            region: jobRequest.region,
            assignedProviderId: selectedProvider.user._id,
            providerName: selectedProvider.companyName,
            requiredServices: jobRequest.requiredServices,
            serviceQuantities: jobRequest.requiredServices.reduce(
               (acc, serviceId) => {
                  acc[serviceId] = 1;
                  return acc;
               },
               {}
            ),
            costDetails: {
               currency: selectedProvider.services?.[0]?.currency || "USD",
            },
            projectDuration: jobRequest.projectDuration,
            numInspectors: jobRequest.numInspectors,
            estimatedTotal: estimatedTotal,
            isPremium: jobRequest.isPremium,
            urgencyLevel: jobRequest.urgencyLevel,
            preferredStartDate: jobRequest.preferredStartDate,
            expectedCompletionDate: jobRequest.expectedCompletionDate,
            complianceRequirements: jobRequest.complianceRequirements.map(
               (standard) => ({
                  standard: standard,
                  mandatory: true,
               })
            ),
            status: "open",
            type: "inspector",
         };

         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests`,
            requestData,
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 15000,
            }
         );

         if (response.data.success) {
            toast.success("Job request sent successfully!");
            setShowRequestModal(false);
            resetJobRequestForm();
         }
      } catch (error) {
         console.error("Error submitting job request:", error);
         toast.error(
            error.response?.data?.message || "Failed to submit job request"
         );
      } finally {
         setSubmitting(false);
      }
   };

   // Filter States
   const [filters, setFilters] = useState({
      selectedService: "all",
      location: "",
      specialization: "",
      minRating: [0],
      maxBudget: [0],
      urgency: "any", // low, medium, high, urgent, any
      verified: "all", // all, verified, unverified
      availability: "all", // all, available, busy
   });

   // Recommendation Criteria
   const [recommendationCriteria, setRecommendationCriteria] = useState({
      prioritizeRating: false,
      prioritizePrice: false,
      prioritizeLocation: false,
      prioritizeExperience: false,
      prioritizeCertifications: false,
   });

   // Fetch Data
   const fetchProviders = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/service-provider/all`,
            {
               headers: { Authorization: `Bearer ${token}` },
               timeout: 10000,
            }
         );

         if (response.data.success) {
            setProviders(response.data.data || []);
         }
      } catch (error) {
         console.error("Error fetching providers:", error);
         setError("Failed to load service providers");
         toast.error("Failed to load providers");
      }
   }, []);

   const fetchServices = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");
         const response = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
         });

         if (response.data.success) {
            setServices(response.data.data || []);
         }
      } catch (error) {
         console.error("Error fetching services:", error);
         toast.error("Failed to load services");
      }
   }, []);

   // Smart Recommendation Algorithm
   const generateRecommendations = useCallback(() => {
      let filtered = [...providers];

      // Basic filtering
      if (filters.selectedService && filters.selectedService !== "all") {
         filtered = filtered.filter((provider) =>
            provider.services?.some(
               (service) => service.serviceId === filters.selectedService
            )
         );
      }

      if (filters.location) {
         filtered = filtered.filter((provider) =>
            provider.companyLocation
               ?.toLowerCase()
               .includes(filters.location.toLowerCase())
         );
      }

      if (filters.specialization) {
         filtered = filtered.filter((provider) =>
            provider.companySpecialization?.some((spec) =>
               spec.toLowerCase().includes(filters.specialization.toLowerCase())
            )
         );
      }

      if (filters.minRating[0] > 0) {
         filtered = filtered.filter(
            (provider) => provider.rating >= filters.minRating[0]
         );
      }

      if (filters.verified !== "all") {
         filtered = filtered.filter((provider) =>
            filters.verified === "verified"
               ? provider.user?.isVerified
               : !provider.user?.isVerified
         );
      }

      // Smart scoring algorithm
      const scoredProviders = filtered.map((provider) => {
         let score = 0;
         let maxScore = 0;

         // Rating score (0-30 points)
         if (recommendationCriteria.prioritizeRating) {
            score += (provider.rating || 0) * 6; // Max 30 points for 5-star rating
            maxScore += 30;
         }

         // Price score (0-25 points) - Lower price = higher score
         if (
            recommendationCriteria.prioritizePrice &&
            filters.selectedService &&
            filters.selectedService !== "all"
         ) {
            const serviceOffering = provider.services?.find(
               (s) => s.serviceId === filters.selectedService
            );
            if (serviceOffering) {
               const priceScore = Math.max(
                  0,
                  25 - (serviceOffering.charge / filters.maxBudget[0]) * 25
               );
               score += priceScore;
            }
            maxScore += 25;
         }

         // Location proximity (0-20 points)
         if (recommendationCriteria.prioritizeLocation && filters.location) {
            const locationMatch = provider.companyLocation
               ?.toLowerCase()
               .includes(filters.location.toLowerCase());
            if (locationMatch) score += 20;
            maxScore += 20;
         }

         // Experience/Certifications (0-15 points)
         if (recommendationCriteria.prioritizeCertifications) {
            const certCount = provider.certificates?.length || 0;
            score += Math.min(15, certCount * 3); // Max 15 points
            maxScore += 15;
         }

         // Specialization match (0-10 points)
         if (filters.specialization) {
            const specMatch = provider.companySpecialization?.some((spec) =>
               spec.toLowerCase().includes(filters.specialization.toLowerCase())
            );
            if (specMatch) score += 10;
            maxScore += 10;
         }

         return {
            ...provider,
            recommendationScore: maxScore > 0 ? (score / maxScore) * 100 : 0,
            matchReasons: getMatchReasons(provider, filters),
         };
      });

      // Sort by recommendation score
      const sorted = scoredProviders.sort(
         (a, b) => b.recommendationScore - a.recommendationScore
      );

      setRecommendations(sorted);
   }, [providers, filters, recommendationCriteria]);

   // Get match reasons for display
   const getMatchReasons = (provider, filters) => {
      const reasons = [];

      if (provider.rating >= 4) reasons.push("High rated");
      if (provider.certificates?.length >= 3) reasons.push("Well certified");
      if (
         filters.location &&
         provider.companyLocation
            ?.toLowerCase()
            .includes(filters.location.toLowerCase())
      ) {
         reasons.push("Local provider");
      }
      if (provider.user?.isVerified) reasons.push("Verified profile");
      if (filters.selectedService && filters.selectedService !== "all") {
         const hasService = provider.services?.some(
            (s) => s.serviceId === filters.selectedService
         );
         if (hasService) reasons.push("Offers requested service");
      }

      return reasons;
   };

   // Effects
   useEffect(() => {
      const loadData = async () => {
         setLoading(true);
         await Promise.all([fetchProviders(), fetchServices()]);
         setLoading(false);
      };
      loadData();
   }, [fetchProviders, fetchServices]);

   useEffect(() => {
      if (providers.length > 0) {
         generateRecommendations();
      }
   }, [providers, filters, recommendationCriteria, generateRecommendations]);

   // Helper Functions
   const getServiceName = (serviceId) => {
      const service = services.find((s) => s._id === serviceId);
      return service?.name || "Unknown Service";
   };

   const renderStars = (rating) => {
      return Array.from({ length: 5 }, (_, index) => (
         <Star
            key={index}
            className={`w-4 h-4 ${
               index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
         />
      ));
   };

   const handleViewDetails = (provider) => {
      setSelectedProvider(provider);
      setShowDetailsModal(true);
   };

   const toggleService = (serviceId) => {
      setJobRequest(prev => ({
         ...prev,
         requiredServices: prev.requiredServices.includes(serviceId)
            ? prev.requiredServices.filter(id => id !== serviceId)
            : [...prev.requiredServices, serviceId]
      }));
   };

   const toggleComplianceStandard = (standard) => {
      setJobRequest(prev => ({
         ...prev,
         complianceRequirements: prev.complianceRequirements.includes(standard)
            ? prev.complianceRequirements.filter(s => s !== standard)
            : [...prev.complianceRequirements, standard]
      }));
   };

   const clearFilters = () => {
      setFilters({
         selectedService: "all",
         location: "",
         specialization: "",
         minRating: [0],
         maxBudget: [0],
         urgency: "any",
         verified: "all",
         availability: "all",
      });
      
      // Also reset recommendation criteria
      setRecommendationCriteria({
         prioritizeRating: false,
         prioritizePrice: false,
         prioritizeLocation: false,
         prioritizeExperience: false,
         prioritizeCertifications: false,
      });
      
      toast.success("All filters and criteria cleared");
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         <NavbarSection />

         {/* Header */}
         <header className="bg-white shadow-sm border-b border-gray-200 mt-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center py-6">
                  <div className="flex items-center space-x-4">
                     <Target className="h-8 w-8 text-[#004aad]" />
                     <h1 className="text-3xl font-bold text-gray-900">
                        Smart Recommendations
                     </h1>
                     <Badge variant="secondary" className="text-sm">
                        {recommendations.length} Recommended
                     </Badge>
                  </div>
                  <Button
                     onClick={() => {
                        fetchProviders();
                        fetchServices();
                     }}
                     variant="outline"
                     disabled={loading}
                  >
                     <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                           loading ? "animate-spin" : ""
                        }`}
                     />
                     Refresh
                  </Button>
               </div>
            </div>
         </header>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Error Alert */}
            {error && (
               <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               {/* Filters Sidebar */}
               <div className="lg:col-span-1">
                  <Card className="sticky top-6">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Filter className="h-5 w-5" />
                           Smart Filters
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-6">
                        {/* Service Selection */}
                        <div>
                           <Label>Required Service</Label>
                           <Select
                              value={filters.selectedService}
                              onValueChange={(value) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    selectedService: value,
                                 }))
                              }
                           >
                              <SelectTrigger className="w-full">
                                 <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="all">
                                    All Services
                                 </SelectItem>
                                 {services.map((service) => (
                                    <SelectItem
                                       key={service._id}
                                       value={service._id}
                                    >
                                       {service.name}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>

                        {/* Location */}
                        <div>
                           <Label>Location </Label>
                           <Input
                              placeholder="Enter city or region"
                              value={filters.location}
                              onChange={(e) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                 }))
                              }
                           />
                        </div>

                        {/* Specialization */}
                        <div>
                           <Label>Specialization</Label>
                           <Input
                              placeholder="e.g., Radiographic Testing"
                              value={filters.specialization}
                              onChange={(e) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    specialization: e.target.value,
                                 }))
                              }
                           />
                        </div>

                        {/* Rating Filter */}
                        <div>
                           <Label>Minimum Rating: {filters.minRating[0]}</Label>
                           <Slider
                              value={filters.minRating}
                              onValueChange={(value) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    minRating: value,
                                 }))
                              }
                              max={5}
                              min={0}
                              step={0.5}
                              className="mt-2"
                           />
                        </div>

                        {/* Budget Filter */}
                        <div>
                           <Label>Max Budget: ${filters.maxBudget[0]}</Label>
                           <Slider
                              value={filters.maxBudget}
                              onValueChange={(value) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    maxBudget: value,
                                 }))
                              }
                              max={20000}
                              min={100}
                              step={100}
                              className="mt-2"
                           />
                        </div>

                        {/* Verified Filter */}
                        <div>
                           <Label>Verification Status</Label>
                           <Select
                              value={filters.verified}
                              onValueChange={(value) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    verified: value,
                                 }))
                              }
                           >
                              <SelectTrigger className="w-full">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="all">
                                    All Providers
                                 </SelectItem>
                                 <SelectItem value="verified">
                                    Verified Only
                                 </SelectItem>
                                 <SelectItem value="unverified">
                                    Unverified
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                        </div>

                        {/* Recommendation Criteria */}
                        <div className="border-t pt-4">
                           <Label className="text-sm font-medium">
                              Prioritize:
                           </Label>
                           <div className="space-y-2 mt-2">
                              {Object.entries(recommendationCriteria).map(
                                 ([key, value]) => (
                                    <div
                                       key={key}
                                       className="flex items-center space-x-2"
                                    >
                                       <Checkbox
                                          id={key}
                                          checked={value}
                                          onCheckedChange={(checked) =>
                                             setRecommendationCriteria(
                                                (prev) => ({
                                                   ...prev,
                                                   [key]: checked === true,
                                                })
                                             )
                                          }
                                       />
                                       <Label htmlFor={key} className="text-sm cursor-pointer">
                                          {key
                                             .replace("prioritize", "")
                                             .replace(/([A-Z])/g, " $1")
                                             .trim()}
                                       </Label>
                                    </div>
                                 )
                              )}
                           </div>
                        </div>

                        <Button
                           onClick={clearFilters}
                           variant="outline"
                           className="w-full"
                        >
                           Clear Filters
                        </Button>
                     </CardContent>
                  </Card>
               </div>

               {/* Recommendations */}
               <div className="lg:col-span-3">
                  {loading ? (
                     <div className="flex justify-center items-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#004aad]" />
                        <span className="ml-2 text-gray-600">
                           Loading recommendations...
                        </span>
                     </div>
                  ) : recommendations.length === 0 ? (
                     <div className="text-center py-12">
                        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                           No recommendations found
                        </h3>
                        <p className="text-gray-500">
                           Try adjusting your filters to see more providers.
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        {/* Recommendation Stats */}
                        <Card>
                           <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                       <TrendingUp className="h-5 w-5 text-green-600" />
                                       <span className="font-medium">
                                          {
                                             recommendations.filter(
                                                (p) =>
                                                   p.recommendationScore >= 80
                                             ).length
                                          }{" "}
                                          Perfect Matches
                                       </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                       <Users className="h-5 w-5 text-[#004aad]" />
                                       <span className="font-medium">
                                          {
                                             recommendations.filter(
                                                (p) =>
                                                   p.recommendationScore >= 60
                                             ).length
                                          }{" "}
                                          Good Matches
                                       </span>
                                    </div>
                                 </div>
                                 <Badge variant="secondary">
                                    Sorted by relevance
                                 </Badge>
                              </div>
                           </CardContent>
                        </Card>

                        {/* Provider Cards */}
                        <div className="grid gap-6 md:grid-cols-2">
                           {recommendations.map((provider) => (
                              <Card
                                 key={provider._id}
                                 className="hover:shadow-lg transition-shadow"
                              >
                                 <CardContent className="p-6">
                                    {/* Header with Score */}
                                    <div className="flex items-start justify-between mb-4">
                                       <div className="flex items-center space-x-3">
                                          <img
                                             src={
                                                provider?.companyLogoUrl ||
                                                "/default-avatar.png"
                                             }
                                             alt={provider?.companyName}
                                             className="w-12 h-12 rounded-full object-cover"
                                          />
                                          <div>
                                             <h3 className="font-bold text-lg">
                                                {provider.companyName}
                                             </h3>
                                             <p className="text-sm text-gray-600 mb-1">
                                                {provider.user?.email}
                                             </p>
                                             <div className="flex items-center space-x-1">
                                                {renderStars(
                                                   provider.rating || 0
                                                )}
                                                <span className="text-sm font-medium ml-1">
                                                   {provider.rating || "New"}
                                                </span>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <Badge
                                             className={
                                                provider.recommendationScore >=
                                                80
                                                   ? "bg-green-100 text-green-800"
                                                   : provider.recommendationScore >=
                                                     60
                                                   ? "bg-blue-100 text-[#004aad]"
                                                   : "bg-gray-100 text-gray-800"
                                             }
                                          >
                                             {Math.round(
                                                provider.recommendationScore
                                             )}
                                             % Match
                                          </Badge>
                                          {provider.user?.isVerified && (
                                             <Badge
                                                variant="outline"
                                                className="bg-green-100 text-green-800 ml-2"
                                             >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Verified
                                             </Badge>
                                          )}
                                       </div>
                                    </div>

                                    {/* Match Reasons */}
                                    <div className="mb-4">
                                       <div className="flex flex-wrap gap-1">
                                          {provider.matchReasons.map(
                                             (reason, index) => (
                                                <Badge
                                                   key={index}
                                                   variant="outline"
                                                   className="text-xs"
                                                >
                                                   {reason}
                                                </Badge>
                                             )
                                          )}
                                       </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4">
                                       <div className="flex items-center space-x-2 text-sm">
                                          <MapPin className="w-4 h-4 text-gray-500" />
                                          <span>
                                             {provider.companyLocation}
                                          </span>
                                       </div>
                                       <div className="flex items-center space-x-2 text-sm">
                                          <Phone className="w-4 h-4 text-gray-500" />
                                          <span>{provider.contactNumber}</span>
                                       </div>
                                    </div>

                                    {/* Services & Pricing */}
                                    {provider.services?.length > 0 && (
                                       <div className="mb-4">
                                          <h4 className="text-sm font-medium mb-2">
                                             Services Offered:
                                          </h4>
                                          <div className="space-y-1">
                                             {provider.services
                                                .slice(0, 3)
                                                .map((service, index) => (
                                                   <div
                                                      key={index}
                                                      className="flex justify-between text-sm"
                                                   >
                                                      <span>
                                                         {getServiceName(
                                                            service.serviceId
                                                         )}
                                                      </span>
                                                      <span className="font-medium">
                                                         ${service.charge}{" "}
                                                         {service.unit}
                                                      </span>
                                                   </div>
                                                ))}
                                             {provider.services.length > 3 && (
                                                <p className="text-xs text-gray-500">
                                                   +
                                                   {provider.services.length -
                                                      3}{" "}
                                                   more services
                                                </p>
                                             )}
                                          </div>
                                       </div>
                                    )}

                                    {/* Certifications */}
                                    {provider.certificates?.length > 0 && (
                                       <div className="mb-4">
                                          <h4 className="text-sm font-medium mb-2 flex items-center">
                                             <Award className="w-4 h-4 mr-1" />
                                             Certifications (
                                             {provider.certificates.length}):
                                          </h4>
                                          <div className="flex flex-wrap gap-1">
                                             {provider.certificates
                                                .slice(0, 3)
                                                .map((cert, index) => (
                                                   <Badge
                                                      key={index}
                                                      variant="outline"
                                                      className="text-xs"
                                                   >
                                                      {cert.certificateName ||
                                                         `Cert ${index + 1}`}
                                                   </Badge>
                                                ))}
                                             {provider.certificates.length >
                                                3 && (
                                                <Badge
                                                   variant="outline"
                                                   className="text-xs"
                                                >
                                                   +
                                                   {provider.certificates
                                                      .length - 3}{" "}
                                                   more
                                                </Badge>
                                             )}
                                          </div>
                                       </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex space-x-2 pt-4 border-t">
                                       <Button
                                          onClick={() =>
                                             handleViewDetails(provider)
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="flex-1"
                                       >
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Details
                                       </Button>
                                       {/* <Button
                                          onClick={() =>
                                             handleRequestService(provider)
                                          }
                                          size="sm"
                                          className="flex-1 bg-[#004aad]"
                                       >
                                          <Send className="w-4 h-4 mr-2" />
                                          Request Service
                                       </Button> */}
                                    </div>
                                 </CardContent>
                              </Card>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Provider Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
               <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle className="flex items-center space-x-3">
                        <img
                           src={
                              selectedProvider?.user?.avatar ||
                              "/default-avatar.png"
                           }
                           alt={selectedProvider?.user?.fullName}
                           className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                           <span>{selectedProvider?.user?.fullName}</span>
                           <p className="text-sm text-gray-600 font-normal">
                              {selectedProvider?.companyName}
                           </p>
                        </div>
                     </DialogTitle>
                  </DialogHeader>

                  {selectedProvider && (
                     <div className="space-y-6">
                        {/* Match Score */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                           <div className="flex items-center justify-between">
                              <div>
                                 <h3 className="font-medium text-gray-900">
                                    Recommendation Score
                                 </h3>
                                 <p className="text-sm text-gray-600">
                                    Based on your criteria
                                 </p>
                              </div>
                              <div className="text-right">
                                 <div className="text-2xl font-bold text-[#004aad]">
                                    {Math.round(
                                       selectedProvider.recommendationScore
                                    )}
                                    %
                                 </div>
                                 <p className="text-sm text-gray-600">Match</p>
                              </div>
                           </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                 <Phone className="w-4 h-4 text-gray-500" />
                                 <span className="text-sm">
                                    {selectedProvider.contactNumber}
                                 </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <Mail className="w-4 h-4 text-gray-500" />
                                 <span className="text-sm">
                                    {selectedProvider.user?.email}
                                 </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <MapPin className="w-4 h-4 text-gray-500" />
                                 <span className="text-sm">
                                    {selectedProvider.companyLocation}
                                 </span>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                 <Star className="w-4 h-4 text-yellow-400" />
                                 <span className="text-sm">
                                    Rating: {selectedProvider.rating || "New"}/5
                                 </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <Building2 className="w-4 h-4 text-gray-500" />
                                 <span className="text-sm">
                                    {selectedProvider.companyName}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Company Description */}
                        <div>
                           <h3 className="text-lg font-semibold mb-2">About</h3>
                           <p className="text-gray-600">
                              {selectedProvider.companyDescription}
                           </p>
                        </div>

                        {/* Specializations */}
                        {selectedProvider.companySpecialization?.length > 0 && (
                           <div>
                              <h3 className="text-lg font-semibold mb-3">
                                 Specializations
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                 {selectedProvider.companySpecialization.map(
                                    (spec, index) => (
                                       <Badge key={index} variant="outline">
                                          {spec}
                                       </Badge>
                                    )
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Services */}
                        {selectedProvider.services?.length > 0 && (
                           <div>
                              <h3 className="text-lg font-semibold mb-3">
                                 Services & Pricing
                              </h3>
                              <div className="grid gap-3">
                                 {selectedProvider.services.map(
                                    (service, index) => (
                                       <div
                                          key={index}
                                          className="flex justify-between items-center p-3 border rounded-lg"
                                       >
                                          <div>
                                             <span className="font-medium">
                                                {getServiceName(
                                                   service.serviceId
                                                )}
                                             </span>
                                             <p className="text-sm text-gray-600">
                                                Unit: {service.unit}
                                             </p>
                                          </div>
                                          <div className="text-right">
                                             <span className="font-bold text-green-600">
                                                ${service.charge}
                                             </span>
                                             <p className="text-xs text-gray-500">
                                                {service.currency}
                                             </p>
                                          </div>
                                       </div>
                                    )
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Certifications */}
                        {selectedProvider.certificates?.length > 0 && (
                           <div>
                              <h3 className="text-lg font-semibold mb-3 flex items-center">
                                 <Award className="w-5 h-5 mr-2" />
                                 Certifications (
                                 {selectedProvider.certificates.length})
                              </h3>
                              <div className="grid gap-3">
                                 {selectedProvider.certificates.map(
                                    (cert, index) => (
                                       <div
                                          key={index}
                                          className="p-3 border rounded-lg"
                                       >
                                          <h4 className="font-medium">
                                             {cert.certificateName}
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                             Issued by: {cert.issuingAuthority}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             Valid until:{" "}
                                             {new Date(
                                                cert.expirationDate
                                             ).toLocaleDateString()}
                                          </p>
                                       </div>
                                    )
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-3 pt-4 border-t">
                           {/* <Button
                              onClick={() => {
                                 setShowDetailsModal(false);
                                 handleRequestService(selectedProvider);
                              }}
                              className="flex-1 bg-[#004aad]"
                           >
                              <Send className="w-4 h-4 mr-2" />
                              Request Service
                           </Button> */}
                           <Button
                              variant="outline"
                              onClick={() => setShowDetailsModal(false)}
                              className="flex-1"
                           >
                              Close
                           </Button>
                        </div>
                     </div>
                  )}
               </DialogContent>
            </Dialog>
         </div>
         {/* Job Request Modal */}
         <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>
                     Request Service from{" "}
                     {selectedProvider?.fullName ||
                        selectedProvider?.companyName}
                     {selectedProvider?.currency}
                  </DialogTitle>
                  <DialogDescription>
                     Fill out the details for your NDT service request
                  </DialogDescription>
               </DialogHeader>

               <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                           id="title"
                           placeholder="e.g., Pipeline Inspection Project"
                           value={jobRequest.title}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 title: e.target.value,
                              }))
                           }
                        />
                     </div>
                     <div>
                        <Label htmlFor="urgencyLevel">Priority Level</Label>
                        <Select
                           value={jobRequest.urgencyLevel}
                           onValueChange={(value) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 urgencyLevel: value,
                              }))
                           }
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {URGENCY_LEVELS.map((level) => (
                                 <SelectItem
                                    key={level.value}
                                    value={level.value}
                                 >
                                    {level.label}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  {/* Location Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="location">Job Location *</Label>
                        <Select
                           value={jobRequest.location}
                           onValueChange={(value) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 location: value,
                              }))
                           }
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select location" />
                           </SelectTrigger>
                           <SelectContent>
                              {Location.map((location) => (
                                 <SelectItem
                                    key={location.id}
                                    value={location.country}
                                 >
                                    {location.country}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div>
                        <Label htmlFor="region">Region</Label>
                        <Input
                           value={jobRequest.region}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 region: e.target.value,
                              }))
                           }
                           placeholder="Enter region"
                        />
                     </div>
                  </div>
                  {/* Description */}
                  <div>
                     <Label htmlFor="description">Project Description *</Label>
                     <Textarea
                        id="description"
                        placeholder="Describe your NDT requirements, scope of work, and any specific instructions..."
                        rows={4}
                        value={jobRequest.description}
                        onChange={(e) =>
                           setJobRequest((prev) => ({
                              ...prev,
                              description: e.target.value,
                           }))
                        }
                     />
                  </div>
                  {/* Project Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="projectDuration">
                           Project Duration (Days) *
                        </Label>
                        <Input
                           id="projectDuration"
                           type="number"
                           min="1"
                           value={jobRequest.projectDuration}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 projectDuration: parseInt(e.target.value) || 1,
                              }))
                           }
                        />
                     </div>
                     <div className="hidden">
                        <Label htmlFor="numInspectors">
                           Number of Inspectors *
                        </Label>
                        <Input
                           id="numInspectors"
                           type="number"
                           min="1"
                           value={jobRequest.numInspectors}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 numInspectors: parseInt(e.target.value) || 1,
                              }))
                           }
                        />
                     </div>
                     <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                           id="isPremium"
                           checked={jobRequest.isPremium}
                           onCheckedChange={(checked) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 isPremium: checked === true, // ensures it's a boolean
                              }))
                           }
                        />
                        <Label htmlFor="isPremium" className="text-sm">
                           Premium Service
                        </Label>
                     </div>
                  </div>
                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="preferredStartDate">
                           Preferred Start Date *
                        </Label>
                        <Input
                           id="preferredStartDate"
                           type="date"
                           value={jobRequest.preferredStartDate}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 preferredStartDate: e.target.value,
                              }))
                           }
                        />
                     </div>
                     <div>
                        <Label htmlFor="expectedCompletionDate">
                           Expected Completion Date
                        </Label>
                        <Input
                           id="expectedCompletionDate"
                           type="date"
                           value={jobRequest.expectedCompletionDate}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 expectedCompletionDate: e.target.value,
                              }))
                           }
                        />
                     </div>
                  </div>{" "}
                  {/* Required Services */}
                  <div>
                     <Label>Required NDT Services *</Label>
                     <div className="grid grid-cols-2 gap-2 mt-2">
                        {serviceOptions.map((service) => (
                           <label
                              key={service._id}
                              className="flex items-center space-x-2 p-3 border rounded cursor-pointer hover:bg-gray-50"
                           >
                              <input
                                 type="checkbox"
                                 checked={jobRequest.requiredServices.includes(
                                    service._id
                                 )}
                                 onChange={() => toggleService(service._id)}
                                 className="rounded"
                              />
                              <span className="text-sm">{service.name}</span>
                           </label>
                        ))}
                     </div>
                     {serviceOptions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                           Loading services...
                        </p>
                     )}
                  </div>
                  {/* Compliance Requirements */}
                  <div className="hidden">
                     <Label>Compliance Standards (Optional)</Label>
                     <div className="grid grid-cols-2 gap-2 mt-2">
                        {COMPLIANCE_STANDARDS.map((standard) => (
                           <label
                              key={standard}
                              className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                           >
                              <input
                                 type="checkbox"
                                 checked={jobRequest.complianceRequirements.includes(
                                    standard
                                 )}
                                 onChange={() =>
                                    toggleComplianceStandard(standard)
                                 }
                                 className="rounded"
                              />
                              <span className="text-sm">{standard}</span>
                           </label>
                        ))}
                     </div>
                  </div>{" "}
                  {/* Cost Estimate Preview */}
                  {selectedProvider && jobRequest.projectDuration > 0 && (
                     <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center">
                           Cost Preview
                        </h4>
                        <div className="text-sm space-y-1">
                           <p>
                              Daily Rate: {selectedProvider.hourlyRate * 8}{" "}
                              {selectedProvider.currency} ×{" "}
                              {jobRequest.projectDuration} days =
                              {selectedProvider.hourlyRate *
                                 8 *
                                 jobRequest.projectDuration}{" "}
                              {selectedProvider.currency}
                           </p>
                           <p>
                              Inspectors: {jobRequest.numInspectors} ×{" "}
                              {selectedProvider.currency}{" "}
                              {(
                                 (selectedProvider.monthlyRate / 30) *
                                 jobRequest.projectDuration
                              ).toFixed(2)}{" "}
                              =
                              {(
                                 (selectedProvider.monthlyRate / 30) *
                                 jobRequest.projectDuration *
                                 jobRequest.numInspectors
                              ).toFixed(0)}{" "}
                              {selectedProvider.currency}
                           </p>

                           {jobRequest.requiredServices.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                 <p className="font-medium text-xs text-gray-700">
                                    Selected Services:
                                 </p>
                                 <div className="flex flex-wrap gap-1 mt-1">
                                    {jobRequest.requiredServices.map(
                                       (serviceId) => {
                                          const service = serviceOptions.find(
                                             (s) => s._id === serviceId
                                          );
                                          return service ? (
                                             <Badge
                                                key={serviceId}
                                                variant="outline"
                                                className="text-xs"
                                             >
                                                {service.code}
                                             </Badge>
                                          ) : null;
                                       }
                                    )}
                                 </div>
                              </div>
                           )}

                           <p className="font-medium border-t pt-1">
                              Total: {selectedProvider.currency}{" "}
                              {(
                                 selectedProvider.hourlyRate *
                                    8 *
                                    jobRequest.projectDuration +
                                 (selectedProvider.monthlyRate / 30) *
                                    jobRequest.projectDuration *
                                    jobRequest.numInspectors
                              ).toFixed(0)}
                           </p>
                           <p className="text-xs text-gray-600">
                              {/* *This is an estimate. Final quote will be provided
                                   by the service provider. */}
                           </p>
                        </div>
                     </div>
                  )}
                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                     <Button
                        onClick={handleSubmitJobRequest}
                        disabled={
                           submitting ||
                           !jobRequest.title ||
                           !jobRequest.description ||
                           !jobRequest.location ||
                           !jobRequest.preferredStartDate ||
                           jobRequest.requiredServices.length === 0
                        }
                        className="flex-1 bg-[#004aad]"
                     >
                        {submitting ? (
                           <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                           <Send className="h-4 w-4 mr-2" />
                        )}
                        Submit Request
                     </Button>
                     <Button
                        variant="outline"
                        onClick={() => {
                           setShowRequestModal(false);
                           resetJobRequestForm();
                        }}
                        className="flex-1"
                        disabled={submitting}
                     >
                        Cancel
                     </Button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
};

export default GetRecommendations;
