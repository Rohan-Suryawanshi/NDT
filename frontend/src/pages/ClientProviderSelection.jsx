import React, { useState, useEffect, useCallback } from "react";
import {
   Search,
   Filter,
   MapPin,
   Star,
   Clock,
   CheckCircle,
   Building2,
   Phone,
   Mail,
   Award,
   Plus,
   Send,
   X,
   Paperclip,
   Calendar,
   AlertCircle,
   RefreshCw,
   User,
   FileText,
   DollarSign,
   Eye,
   Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import toast from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const ASSOCIATION_TYPES = ["Freelancer", "Company"];

const SUBSCRIPTION_PLANS = ["Free", "Basic", "Premium", "Enterprise"];

const REGIONS = [
   "North India",
   "South India",
   "East India",
   "West India",
   "Central India",
   "Northeast India",
];

const MAJOR_CITIES = [
   "Mumbai",
   "Delhi",
   "Bengaluru",
   "Hyderabad",
   "Ahmedabad",
   "Chennai",
   "Kolkata",
   "Surat",
   "Pune",
   "Jaipur",
];

const COMPLIANCE_STANDARDS = [
   "ASME Section V",
   "ISO 9712",
   "ASTM E709",
   "EN 473",
   "API 1104",
   "AWS D1.1",
];

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

const ClientProviderSelection = () => {
   // State Management
   const [providers, setProviders] = useState([]);
   const [filteredProviders, setFilteredProviders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [selectedProvider, setSelectedProvider] = useState(null);
   const [showRequestModal, setShowRequestModal] = useState(false);
   const [showDetailsModal, setShowDetailsModal] = useState(false);
   const [serviceOptions, setServiceOptions] = useState([]);
   // Filter States
   const [filters, setFilters] = useState({
      search: "",
      associationType: "all",
      hourlyRate: "",
      monthlyRate: "",
      minRating: 0,
      availability: "all",
      verified: "all",
      subscriptionPlan: "all",
   });
   // Job Request Form State
   const [jobRequest, setJobRequest] = useState({
      title: "",
      description: "",
      location: "",
      region: "Central India",
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

   const [submitting, setSubmitting] = useState(false);

   // Fetch Providers
   const fetchProviders = useCallback(async () => {
      try {
         setLoading(true);
         const accessToken = localStorage.getItem("accessToken");

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/inspectors/all`,
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 10000,
            }
         );

         if (response.data.success) {
            setProviders(response.data.data.profiles);
            console.log(response.data.data.profiles);
            setFilteredProviders(response.data.data.profiles);
         }
      } catch (error) {
         console.error("Error fetching providers:", error);
         setError("Failed to load service providers");
         toast.error("Failed to load providers");
      } finally {
         setLoading(false);
      }
   }, []);
   const fetchService = useCallback(async () => {
      try {
         const accessToken = localStorage.getItem("accessToken");

         const response = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
         });

         if (response.data.success) {
            setServiceOptions(response.data.data || []);
            console.log("Services fetched:", response.data.data);
         }
      } catch (error) {
         console.error("Error fetching services:", error);
         toast.error("Failed to load services");
      }
   }, []);

   // Filter Providers
   useEffect(() => {
      let filtered = [...providers];

      // Search filter
      if (filters.search) {
         filtered = filtered.filter(
            (provider) =>
               provider.fullName
                  ?.toLowerCase()
                  .includes(filters.search.toLowerCase()) ||
               provider.companyName
                  ?.toLowerCase()
                  .includes(filters.search.toLowerCase()) ||
               provider.userId?.name
                  ?.toLowerCase()
                  .includes(filters.search.toLowerCase())
         );
      }

      // Association type filter
      if (filters.associationType !== "all") {
         filtered = filtered.filter(
            (provider) => provider.associationType === filters.associationType
         );
      }

      // Hourly rate filter
      if (filters.hourlyRate) {
         filtered = filtered.filter(
            (provider) => provider.hourlyRate <= parseFloat(filters.hourlyRate)
         );
      }

      // Monthly rate filter
      if (filters.monthlyRate) {
         filtered = filtered.filter(
            (provider) =>
               provider.monthlyRate <= parseFloat(filters.monthlyRate)
         );
      }

      // Rating filter
      if (filters.minRating > 0) {
         filtered = filtered.filter(
            (provider) => provider.rating >= filters.minRating
         );
      }

      // Availability filter
      if (filters.availability !== "all") {
         filtered = filtered.filter((provider) =>
            filters.availability === "available"
               ? provider.availability
               : !provider.availability
         );
      }

      // Verified filter
      if (filters.verified !== "all") {
         filtered = filtered.filter((provider) =>
            filters.verified === "verified"
               ? provider.verified
               : !provider.verified
         );
      }

      // Subscription plan filter
      if (filters.subscriptionPlan !== "all") {
         filtered = filtered.filter(
            (provider) => provider.subscriptionPlan === filters.subscriptionPlan
         );
      }

      setFilteredProviders(filtered);
   }, [providers, filters]);
   // Handle Request Service
   const handleRequestService = (provider) => {
      setSelectedProvider(provider);
      setShowRequestModal(true);
   };

   // Handle View Details
   const handleViewDetails = (provider) => {
      setSelectedProvider(provider);
      setShowDetailsModal(true);
   };
   // Handle Job Request Submission
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

         // Calculate estimated total based on provider rates
         const estimatedTotal =
            selectedProvider.hourlyRate * jobRequest.projectDuration * 8 +
            selectedProvider.monthlyRate *
               Math.ceil(jobRequest.projectDuration / 30);
         const requestData = {
            title: jobRequest.title,
            description: jobRequest.description,
            location: jobRequest.location,
            region: jobRequest.region,
            assignedProviderId: selectedProvider.userId._id,
            providerName:
               selectedProvider.fullName || selectedProvider.companyName,
            requiredServices: jobRequest.requiredServices, // These are now proper MongoDB ObjectIds
            serviceQuantities: jobRequest.requiredServices.reduce(
               (acc, serviceId) => {
                  acc[serviceId] = 1; // Default quantity
                  return acc;
               },
               {}
            ),
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

         console.log("Job Request Data:", requestData);
         console.log("Selected Services:", jobRequest.requiredServices);

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

   // Reset job request form
   const resetJobRequestForm = () => {
      setJobRequest({
         title: "",
         description: "",
         location: "",
         region: "Central India",
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
   // Handle Service Selection
   const toggleService = (serviceId) => {
      setJobRequest((prev) => ({
         ...prev,
         requiredServices: prev.requiredServices.includes(serviceId)
            ? prev.requiredServices.filter((s) => s !== serviceId)
            : [...prev.requiredServices, serviceId],
      }));
   };

   // Handle Compliance Standard Selection
   const toggleComplianceStandard = (standard) => {
      setJobRequest((prev) => ({
         ...prev,
         complianceRequirements: prev.complianceRequirements.includes(standard)
            ? prev.complianceRequirements.filter((s) => s !== standard)
            : [...prev.complianceRequirements, standard],
      }));
   }; // Initialize
   useEffect(() => {
      fetchProviders();
      fetchService();
   }, [fetchProviders, fetchService]);

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         {/* Header */}
         <NavbarSection/>
         <header className="bg-white shadow-sm border-b border-gray-200 mt-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center py-6">
                  <div className="flex items-center space-x-4">
                     <Building2 className="h-8 w-8 text-blue-600" />
                     <h1 className="text-3xl font-bold text-[#004aad]">
                        Find NDT Inspector
                     </h1>
                     <Badge variant="secondary" className="text-sm">
                        {filteredProviders.length} Available
                     </Badge>
                  </div>
                  <Button
                     onClick={fetchProviders}
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
            )}{" "}
            {/* Filters */}
            <Card className="mb-6">
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                     {/* Search */}
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                           placeholder="Search providers..."
                           className="pl-10"
                           value={filters.search}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 search: e.target.value,
                              }))
                           }
                        />
                     </div>

                     {/* Association Type Filter */}
                     <Select
                        value={filters.associationType}
                        
                        onValueChange={(value) =>
                           setFilters((prev) => ({
                              ...prev,
                              associationType: value,
                           }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Association Type" />
                        </SelectTrigger>
                        <SelectContent > 
                           <SelectItem value="all" >All Types</SelectItem>
                           {ASSOCIATION_TYPES.map((type) => (
                              <SelectItem key={type} value={type} >
                                 {type}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     {/* Rating Filter */}
                     <Select
                        value={filters.minRating.toString()}
                        onValueChange={(value) =>
                           setFilters((prev) => ({
                              ...prev,
                              minRating: parseInt(value),
                           }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Min Rating" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="0">Any Rating</SelectItem>
                           <SelectItem value="1">1+ Stars</SelectItem>
                           <SelectItem value="2">2+ Stars</SelectItem>
                           <SelectItem value="3">3+ Stars</SelectItem>
                           <SelectItem value="4">4+ Stars</SelectItem>
                           <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                     </Select>

                     {/* Availability Filter */}
                     <Select
                        value={filters.availability}
                        onValueChange={(value) =>
                           setFilters((prev) => ({
                              ...prev,
                              availability: value,
                           }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Availability" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Providers</SelectItem>
                           <SelectItem value="available">
                              Available Now
                           </SelectItem>
                           <SelectItem value="busy">Busy</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     {/* Hourly Rate Filter */}
                     <div>
                        <Label htmlFor="hourlyRate" className="text-sm">
                           Max Hourly Rate (₹)
                        </Label>
                        <Input
                           id="hourlyRate"
                           type="number"
                           placeholder="e.g., 150"
                           value={filters.hourlyRate}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 hourlyRate: e.target.value,
                              }))
                           }
                        />
                     </div>

                     {/* Monthly Rate Filter */}
                     <div>
                        <Label htmlFor="monthlyRate" className="text-sm">
                           Max Monthly Rate (₹)
                        </Label>
                        <Input
                           id="monthlyRate"
                           type="number"
                           placeholder="e.g., 2000"
                           value={filters.monthlyRate}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 monthlyRate: e.target.value,
                              }))
                           }
                        />
                     </div>

                     {/* Verified Filter */}
                     <div>
                      <Label  className="text-sm">
                           Verification
                      </Label>
                     <Select
                        value={filters.verified}
                        onValueChange={(value) =>
                           setFilters((prev) => ({ ...prev, verified: value }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Verification" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Providers</SelectItem>
                           <SelectItem value="verified">
                              Verified Only
                           </SelectItem>
                           <SelectItem value="unverified">
                              Unverified
                           </SelectItem>
                        </SelectContent>
                     </Select>
                     </div>

                     {/* Subscription Plan Filter */}
                     <div>
                       <Label  className="text-sm">
                           Subscription
                      </Label>
                     <Select
                        value={filters.subscriptionPlan}
                        onValueChange={(value) =>
                           setFilters((prev) => ({
                              ...prev,
                              subscriptionPlan: value,
                           }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Subscription" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Plans</SelectItem>
                           {SUBSCRIPTION_PLANS.map((plan) => (
                              <SelectItem key={plan} value={plan}>
                                 {plan}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     </div>
                  </div>

                  <Button
                     variant="outline"
                     onClick={() =>
                        setFilters({
                           search: "",
                           associationType: "all",
                           hourlyRate: "",
                           monthlyRate: "",
                           minRating: 0,
                           availability: "all",
                           verified: "all",
                           subscriptionPlan: "all",
                        })
                     }
                     className="mt-4"
                  >
                     Clear Filters
                  </Button>
               </CardContent>
            </Card>
            {/* Providers Grid */}
            {loading ? (
               <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                     Loading providers...
                  </span>
               </div>
            ) : filteredProviders.length === 0 ? (
               <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                     No providers found
                  </h3>
                  <p className="text-gray-500">
                     Try adjusting your filters to see more providers.
                  </p>
               </div>
            ) : (
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProviders.map((provider) => (
                     <Card
                        key={provider._id}
                        className="hover:shadow-lg transition-shadow"
                     >
                        <CardContent className="p-6">
                           {/* Provider Header */}
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                 <img
                                    src={
                                       provider.userId?.avatar ||
                                       "/default-avatar.png"
                                    }
                                    alt={provider.fullName}
                                    className="w-12 h-12 rounded-full object-cover"
                                 />
                                 <div>
                                    <h3 className="font-bold text-lg">
                                       {provider.fullName}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                       {provider.companyName}
                                    </p>
                                    <div className="flex items-center space-x-1">
                                       {Array.from(
                                          { length: 5 },
                                          (_, index) => (
                                             <Star
                                                key={index}
                                                className={`w-4 h-4 ${
                                                   index < provider.rating
                                                      ? "text-yellow-400 fill-current"
                                                      : "text-gray-300"
                                                }`}
                                             />
                                          )
                                       )}
                                       <span className="text-sm font-medium ml-1">
                                          {provider.rating}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                 <Badge
                                    className={
                                       provider.availability
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                    }
                                 >
                                    {provider.availability
                                       ? "Available"
                                       : "Busy"}
                                 </Badge>
                                 {provider.verified && (
                                    <Badge
                                       variant="outline"
                                       className="bg-blue-100 text-blue-800"
                                    >
                                       Verified
                                    </Badge>
                                 )}
                                 {provider.userId?.isVerified && (
                                    <Badge
                                       variant="outline"
                                       className="bg-green-100 text-green-800"
                                    >
                                       ID Verified
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           {/* Contact Information */}
                           <div className="flex items-center space-x-2 mb-3">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                 {provider.contactNumber}
                              </span>
                           </div>

                           <div className="flex items-center space-x-2 mb-3">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                 {provider.userId?.email}
                              </span>
                           </div>

                           {/* Association Type */}
                           <div className="flex items-center space-x-2 mb-3">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                 {provider.associationType}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                 {provider.subscriptionPlan}
                              </Badge>
                           </div>

                           {/* Certifications */}
                           <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center">
                                 <Award className="w-4 h-4 mr-1" />
                                 Certifications (
                                 {provider.certifications?.length || 0}):
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                 {provider.certifications
                                    ?.slice(0, 3)
                                    .map((cert, index) => (
                                       <Badge
                                          key={index}
                                          variant="outline"
                                          className="text-xs"
                                       >
                                          {cert.name || `Cert ${index + 1}`}
                                       </Badge>
                                    ))}
                                 {provider.certifications?.length > 3 && (
                                    <Badge
                                       variant="outline"
                                       className="text-xs"
                                    >
                                       +{provider.certifications.length - 3}{" "}
                                       more
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           {/* Pricing */}
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex space-x-4">
                                 <div>
                                    <span className="text-xs text-gray-500">
                                       Hourly
                                    </span>
                                    <p className="font-bold text-green-600">
                                       ₹{provider.hourlyRate}/hr
                                    </p>
                                 </div>
                                 <div>
                                    <span className="text-xs text-gray-500">
                                       Monthly
                                    </span>
                                    <p className="font-bold text-blue-600">
                                       ₹{provider.monthlyRate}/month
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                 <Clock className="w-4 h-4" />
                                 <span>24h response</span>
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex space-x-2">
                              <Button
                                 onClick={() => handleRequestService(provider)}
                                 className="flex-1 bg-blue-600 hover:bg-blue-700"
                                 disabled={!provider.availability}
                              >
                                 <Send className="w-4 h-4 mr-2" />
                                 Request Service
                              </Button>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() =>
                                    window.open(provider.resume?.url, "_blank")
                                 }
                                 disabled={!provider.resume?.url}
                              >
                                 <FileText className="w-4 h-4" />
                              </Button>{" "}
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleViewDetails(provider)}
                              >
                                 <Eye className="w-4 h-4" />
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>{" "}
         {/* Job Request Modal */}
         <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>
                     Request Service from{" "}
                     {selectedProvider?.fullName ||
                        selectedProvider?.companyName}
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
                           <SelectTrigger>
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
                        <Input
                           id="location"
                           placeholder="Enter specific location/address"
                           value={jobRequest.location}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 location: e.target.value,
                              }))
                           }
                        />
                     </div>
                     <div>
                        <Label htmlFor="region">Region</Label>
                        <Select
                           value={jobRequest.region}
                           onValueChange={(value) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 region: value,
                              }))
                           }
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {REGIONS.map((region) => (
                                 <SelectItem key={region} value={region}>
                                    {region}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
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
                     <div>
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
                        <input
                           type="checkbox"
                           id="isPremium"
                           checked={jobRequest.isPremium}
                           onChange={(e) =>
                              setJobRequest((prev) => ({
                                 ...prev,
                                 isPremium: e.target.checked,
                              }))
                           }
                           className="rounded"
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
                  <div>
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
                           <DollarSign className="w-4 h-4 mr-1" />
                           Estimated Cost Preview
                        </h4>
                        <div className="text-sm space-y-1">
                           <p>
                              Daily Rate: ₹{selectedProvider.hourlyRate * 8} ×{" "}
                              {jobRequest.projectDuration} days = ₹
                              {selectedProvider.hourlyRate *
                                 8 *
                                 jobRequest.projectDuration}
                           </p>
                           <p>
                              Inspectors: {jobRequest.numInspectors} × ₹
                              {(selectedProvider.monthlyRate / 30) *
                                 jobRequest.projectDuration}{" "}
                              = ₹
                              {(
                                 (selectedProvider.monthlyRate / 30) *
                                 jobRequest.projectDuration *
                                 jobRequest.numInspectors
                              ).toFixed(0)}
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
                              Estimated Total: ₹
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
                              *This is an estimate. Final quote will be provided
                              by the service provider.
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
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
         {/* Provider Details Modal */}
         <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                     <img
                        src={
                           selectedProvider?.userId?.avatar ||
                           "/default-avatar.png"
                        }
                        alt={selectedProvider?.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                     />
                     <div>
                        <span>{selectedProvider?.fullName}</span>
                        <p className="text-sm text-gray-600 font-normal">
                           {selectedProvider?.companyName}
                        </p>
                     </div>
                  </DialogTitle>
               </DialogHeader>

               {selectedProvider && (
                  <div className="space-y-6">
                     {/* Basic Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                           <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                 Type: {selectedProvider.associationType}
                              </span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                 {selectedProvider.contactNumber}
                              </span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                 {selectedProvider.userId?.email}
                              </span>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                 Hourly: ₹{selectedProvider.hourlyRate}
                              </span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                 Monthly: ₹{selectedProvider.monthlyRate}
                              </span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm">
                                 Rating: {selectedProvider.rating}/5
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Status Badges */}
                     <div className="flex flex-wrap gap-2">
                        <Badge
                           className={
                              selectedProvider.availability
                                 ? "bg-green-100 text-green-800"
                                 : "bg-red-100 text-red-800"
                           }
                        >
                           {selectedProvider.availability
                              ? "Available"
                              : "Busy"}
                        </Badge>
                        {selectedProvider.verified && (
                           <Badge className="bg-blue-100 text-blue-800">
                              Verified Provider
                           </Badge>
                        )}
                        {selectedProvider.userId?.isVerified && (
                           <Badge className="bg-green-100 text-green-800">
                              ID Verified
                           </Badge>
                        )}
                        <Badge variant="outline">
                           {selectedProvider.subscriptionPlan} Plan
                        </Badge>
                     </div>

                     {/* Certifications */}
                     <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                           <Award className="w-5 h-5 mr-2" />
                           Certifications (
                           {selectedProvider.certifications?.length || 0})
                        </h3>
                        {selectedProvider.certifications?.length > 0 ? (
                           <div className="grid gap-3">
                              {selectedProvider.certifications.map(
                                 (cert, index) => (
                                    <div
                                       key={index}
                                       className="p-3 border rounded-lg bg-gray-50"
                                    >
                                       <div className="flex items-start justify-between">
                                          <div>
                                             <h4 className="font-medium">
                                                {cert.name ||
                                                   `Certification ${index + 1}`}
                                             </h4>
                                             <p className="text-sm text-gray-600">
                                                {cert.issuedBy ||
                                                   "Professional Body"}
                                             </p>
                                             {cert.level && (
                                                <Badge
                                                   variant="outline"
                                                   className="mt-1"
                                                >
                                                   {cert.level}
                                                </Badge>
                                             )}
                                          </div>
                                          <div className="text-right text-sm text-gray-500">
                                             {cert.issuedDate && (
                                                <p>
                                                   Issued:{" "}
                                                   {new Date(
                                                      cert.issuedDate
                                                   ).toLocaleDateString()}
                                                </p>
                                             )}
                                             {cert.expiryDate && (
                                                <p>
                                                   Expires:{" "}
                                                   {new Date(
                                                      cert.expiryDate
                                                   ).toLocaleDateString()}
                                                </p>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 )
                              )}
                           </div>
                        ) : (
                           <p className="text-gray-500">
                              No certifications available
                           </p>
                        )}
                     </div>

                     {/* Resume */}
                     {selectedProvider.resume?.url && (
                        <div>
                           <h3 className="text-lg font-semibold mb-3 flex items-center">
                              <FileText className="w-5 h-5 mr-2" />
                              Resume
                           </h3>
                           <div className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="font-medium">
                                       Resume Document
                                    </p>
                                    <p className="text-sm text-gray-600">
                                       Uploaded:{" "}
                                       {new Date(
                                          selectedProvider.resume.uploadedAt
                                       ).toLocaleDateString()}
                                    </p>
                                 </div>
                                 <Button
                                    onClick={() =>
                                       window.open(
                                          selectedProvider.resume.url,
                                          "_blank"
                                       )
                                    }
                                    variant="outline"
                                 >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Resume
                                 </Button>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Actions */}
                     <div className="flex space-x-3 pt-4 border-t">
                        <Button
                           onClick={() => {
                              setShowDetailsModal(false);
                              setShowRequestModal(true);
                           }}
                           className="flex-1 bg-blue-600 hover:bg-blue-700"
                           disabled={!selectedProvider.availability}
                        >
                           <Send className="w-4 h-4 mr-2" />
                           Request Service
                        </Button>
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
   );
};

export default ClientProviderSelection;
