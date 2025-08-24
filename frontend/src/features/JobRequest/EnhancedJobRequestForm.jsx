import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
   Building2,
   MapPin,
   FileText,
   Send,
   Star,
   ArrowLeft,
   CheckCircle,
   AlertCircle,
   Loader2,
   X,
   Calculator,
   DollarSign,
   Clock,
   Users,
   Plus,
   Minus,
   Eye,
} from "lucide-react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "@/constant/Global";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Location } from "@/constant/Location";

// Mock data - replace with your actual API calls
const MOCK_SERVICES = [
   {
      _id: "686fbb30dddbdaf54bdde7a6",
      name: "Radiographic Testing (RT)",
      code: "RT",
      isPremium: false,
      charge: 100,
      unit: "Per Day",
      currency: "USD",
      tax: 15,
   },
   {
      _id: "686fbb3adddbdaf54bdde7aa",
      name: "Magnetic Particle Testing (MT)",
      code: "MT",
      isPremium: false,
      charge: 120,
      unit: "Per Unit",
      currency: "USD",
      tax: 10,
   },
   {
      _id: "686fbb3adddbdaf54bdde7ab",
      name: "Ultrasonic Testing (UT)",
      code: "UT",
      isPremium: false,
      charge: 80,
      unit: "Per Hour",
      currency: "USD",
      tax: 12,
   },
   {
      _id: "4",
      name: "Liquid Penetrant Testing (PT)",
      code: "PT",
      isPremium: false,
      charge: 90,
      unit: "Per Day",
      currency: "USD",
      tax: 18,
   },
   {
      _id: "5",
      name: "Visual Testing (VT)",
      code: "VT",
      isPremium: false,
      charge: 60,
      unit: "Per Day",
      currency: "USD",
      tax: 8,
   },
   {
      _id: "6",
      name: "Eddy Current Testing (ET)",
      code: "ET",
      isPremium: true,
      charge: 150,
      unit: "Per Hour",
      currency: "USD",
      tax: 20,
   },
   {
      _id: "7",
      name: "Thermographic Testing (TT)",
      code: "TT",
      isPremium: true,
      charge: 200,
      unit: "Per Day",
      currency: "USD",
      tax: 22,
   },
];

const ADDITIONAL_COST_FACTORS = [
   {
      id: "travel",
      name: "Travel & Accommodation",
      type: "percentage",
      defaultValue: 10,
   },
   {
      id: "equipment",
      name: "Equipment Setup",
      type: "fixed",
      defaultValue: 50,
   },
   {
      id: "rush",
      name: "Rush Job (24-48 hrs)",
      type: "percentage",
      defaultValue: 25,
   },
   {
      id: "weekend",
      name: "Weekend/Holiday Work",
      type: "percentage",
      defaultValue: 20,
   },
   {
      id: "certification",
      name: "Report Certification",
      type: "fixed",
      defaultValue: 30,
   },
];

const EnhancedJobRequestForm = () => {
   const { providerId } = useParams();
   const location = useLocation();
   const navigate = useNavigate();
   const providerName = location.state?.providerName;
   const [formData, setFormData] = useState({
      title: "",
      description: "",
      location: "",
      region: "",
      requiredServices: [],
      isPremium: false,
      projectDuration: 1,
      numInspectors: 1,
   });

   const [quantities, setQuantities] = useState({});
   const [additionalCosts, setAdditionalCosts] = useState({});
   const [costBreakdown, setCostBreakdown] = useState(null);
   const [showCostBreakdown, setShowCostBreakdown] = useState(false);
   const [loading, setLoading] = useState(false);
   const [services, setServices] = useState([]);
   const [servicesLoading, setServicesLoading] = useState(true);
   const [errors, setErrors] = useState({});
   const [currency, setCurrency] = useState("");

   // Mock provider data - replace with actual API call
   const [providerInfo, setProviderInfo] = useState({
      _id: providerId,
      companyName: providerName || "Selected Provider",
      companyLocation: "Pune, Maharashtra",
      companyLogoUrl: "",
      rating: 4.5,
      specializations: ["RT", "UT", "MT"],
      isVerified: true,
   });

   const user = JSON.parse(localStorage.getItem("user"));

   useEffect(() => {
      const fetchData = async () => {
         try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(
               `${BACKEND_URL}/api/v1/service-provider/profile/${providerId}`,
               {
                  headers: { Authorization: `Bearer ${accessToken}` },
               }
            );
            setProviderInfo(res.data?.data || []);
         } catch (err) {
            console.error("Failed to fetch providers:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [providerId]);

   // Fetch available services
   useEffect(() => {
      const fetchServices = async () => {
         try {
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(
               `${BACKEND_URL}/api/v1/offered-services/provider/${providerId}`,
               {
                  headers: { Authorization: `Bearer ${accessToken}` },
               }
            );
            setServices(res.data?.data || MOCK_SERVICES);
            if (res.data?.data.length > 0) {
               setCurrency(res.data?.data[0].currency);
            }
         } catch (err) {
            console.error("Failed to fetch services:", err);
            // Fallback to mock data if API fails
            setServices(MOCK_SERVICES);
         } finally {
            setServicesLoading(false);
         }
      };
      fetchServices();
   }, []);

   // Initialize quantities for each service
   useEffect(() => {
      const initialQuantities = {};
      services.forEach((service) => {
         initialQuantities[service.serviceId?._id] = 1;
      });
      setQuantities(initialQuantities);
   }, [services]);

   const handleInputChange = (field, value) => {
      setFormData((prev) => ({
         ...prev,
         [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
         setErrors((prev) => ({
            ...prev,
            [field]: "",
         }));
      }
   };

   const handleServiceToggle = (serviceId, checked) => {
      setFormData((prev) => ({
         ...prev,
         requiredServices: checked
            ? [...prev.requiredServices, serviceId]
            : prev.requiredServices.filter((id) => id !== serviceId),
      }));
   };

   const updateQuantity = (serviceId, quantity) => {
      setQuantities((prev) => ({
         ...prev,
         [serviceId]: Math.max(1, quantity),
      }));
   };

   const toggleAdditionalCost = (costId, enabled) => {
      setAdditionalCosts((prev) => ({
         ...prev,
         [costId]: enabled
            ? ADDITIONAL_COST_FACTORS.find((c) => c.id === costId).defaultValue
            : 0,
      }));
   };

   const updateAdditionalCost = (costId, value) => {
      setAdditionalCosts((prev) => ({
         ...prev,
         [costId]: Math.max(0, value),
      }));
   };
   useEffect(() => {
      const calculateCosts = () => {
         if (formData.requiredServices.length === 0) {
            setCostBreakdown(null);
            return;
         }

         let totalBaseCost = 0;
         let totalTax = 0;
         let serviceBreakdown = []; // Calculate base service costs
         formData.requiredServices.forEach((serviceId) => {
            const service = services.find(
               (s) => s.serviceId?._id === serviceId
            );

            if (service) {
               const quantity = quantities[serviceId] || 1;
               let multiplier = 1;

               // Apply multipliers based on unit type
               if (service.unit === "Per Day") {
                  multiplier = formData.projectDuration;
               } else if (service.unit === "Per Hour") {
                  multiplier = formData.projectDuration * 8; // Assuming 8 hours per day
               } else if (service.unit === "Per Inspector") {
                  multiplier = formData.numInspectors;
               }

               const baseCost = service.charge * quantity * multiplier;
               const taxAmount = (baseCost * service.tax) / 100;

               totalBaseCost += baseCost;
               totalTax += taxAmount;

               serviceBreakdown.push({
                  serviceId: service.serviceId?._id,
                  serviceName: service.serviceId?.name,
                  serviceCode: service.serviceId?.code,
                  charge: service.charge,
                  unit: service.unit,
                  quantity,
                  multiplier,
                  baseCost,
                  taxRate: service.tax,
                  taxAmount,
                  subtotal: baseCost + taxAmount,
               });
            }
         });

         // Calculate additional costs
         let additionalTotal = 0;
         let additionalBreakdown = [];

         Object.entries(additionalCosts).forEach(([costId, value]) => {
            if (value > 0) {
               const factor = ADDITIONAL_COST_FACTORS.find(
                  (f) => f.id === costId
               );
               let amount = 0;

               if (factor.type === "percentage") {
                  amount = (totalBaseCost * value) / 100;
               } else {
                  amount = value;
               }

               additionalTotal += amount;
               additionalBreakdown.push({
                  factorId: factor.id,
                  name: factor.name,
                  type: factor.type,
                  value,
                  amount,
               });
            }
         });

         const grandTotal = totalBaseCost + totalTax + additionalTotal;

         setCostBreakdown({
            services: serviceBreakdown,
            additional: additionalBreakdown,
            currency,
            totals: {
               baseCost: totalBaseCost,
               tax: totalTax,
               additional: additionalTotal,
               grandTotal,
            },
         });
      };

      calculateCosts();
   }, [
      formData.requiredServices,
      quantities,
      additionalCosts,
      formData.projectDuration,
      formData.numInspectors,
      services,
   ]);

   const validateForm = () => {
      const newErrors = {};

      if (!formData.title.trim()) {
         newErrors.title = "Job title is required";
      }

      if (!formData.description.trim()) {
         newErrors.description = "Job description is required";
      }

      if (!formData.location.trim()) {
         newErrors.location = "Location is required";
      }

      if (!formData.region) {
         newErrors.region = "Region is required";
      }

      if (formData.requiredServices.length === 0) {
         newErrors.requiredServices = "Please select at least one service";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
         // Show cost breakdown when there are validation errors but services are selected
         if (formData.requiredServices.length > 0) {
            setShowCostBreakdown(true);
         }
         return;
      }

      setLoading(true);

      try {
         // Prepare job request with cost details
         const jobRequest = {
            ...formData,
            assignedProviderId: providerId,
            status: "open",
            costDetails: costBreakdown,
            serviceQuantities: quantities,
            additionalCostFactors: additionalCosts,
            estimatedTotal: costBreakdown?.totals?.grandTotal || 0,
            clientName: user.name,
            providerName: providerInfo.companyName,
         };

         // Make API call to create job request
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests`,
            jobRequest,
            {
               headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
               },
            }
         );

         // Show success message
         toast.success("Job request submitted successfully!");

         // Navigate back to previous page or dashboard
         setTimeout(() => {
            navigate(-1); // Go back to previous page
         }, 1500);
      } catch (error) {
         console.error("Error submitting job request:", error);

         // Show error message
         const errorMessage =
            error.response?.data?.message ||
            "Failed to submit job request. Please try again.";
         toast.error(errorMessage);
      } finally {
         setLoading(false);
      }
   };
   // const formatCurrency = (amount) => {
   //    return new Intl.NumberFormat("en-US", {
   //       style: "currency",
   //       currency: currency,
   //    }).format(amount);
   // };

   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

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

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         {/* Header */}{" "}
         <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-6">
               <div className="flex items-center gap-4">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => navigate(-1)}
                     className="flex items-center gap-2"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     Back
                  </Button>
                  <div>
                     <h1 className="text-3xl font-bold text-gray-900">
                        Request Service
                     </h1>
                  </div>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
               {/* Provider Info Sidebar */}
               <div className="xl:col-span-1">
                  <Card className="sticky top-6">
                     <CardHeader className="text-center">
                        <div className="flex flex-col items-center space-y-4">
                           {providerInfo.companyLogoUrl ? (
                              <img
                                 src={providerInfo.companyLogoUrl}
                                 alt={`${providerInfo.companyName} logo`}
                                 className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                              />
                           ) : (
                              <div className="w-20 h-20 rounded-lg bg-blue-600 flex items-center justify-center">
                                 <Building2 className="w-10 h-10 text-white" />
                              </div>
                           )}

                           <div className="text-center">
                              <CardTitle className="text-xl text-gray-900">
                                 {providerInfo.companyName}
                              </CardTitle>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                 <MapPin className="w-4 h-4 text-gray-500" />
                                 <span className="text-sm text-gray-600">
                                    {providerInfo.companyLocation}
                                 </span>
                              </div>

                              {providerInfo.rating > 0 && (
                                 <div className="flex items-center justify-center gap-2 mt-2">
                                    <div className="flex">
                                       {getRatingStars(providerInfo.rating)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                       {providerInfo.rating.toFixed(1)}
                                    </span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </CardHeader>

                     <CardContent className="space-y-4">
                        {providerInfo.isVerified && (
                           <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                 Verified Provider
                              </span>
                           </div>
                        )}

                        <div>
                           <h4 className="font-medium text-gray-900 mb-2">
                              Specializations
                           </h4>
                           <div className="flex flex-wrap gap-2">
                              {providerInfo.companySpecialization?.map(
                                 (spec, i) => (
                                    <Badge
                                       key={i}
                                       variant="secondary"
                                       className="text-xs"
                                    >
                                       {spec}
                                    </Badge>
                                 )
                              )}
                           </div>
                        </div>

                        {/* Cost Breakdown Toggle */}
                        {costBreakdown && (
                           <div className="pt-4 border-t">
                              <Button
                                 onClick={() =>
                                    setShowCostBreakdown(!showCostBreakdown)
                                 }
                                 variant="outline"
                                 size="sm"
                                 className="w-full"
                              >
                                 <Eye className="w-4 h-4 mr-2" />
                                 {showCostBreakdown ? "Hide" : "Show"} Cost
                                 Details
                              </Button>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>

               {/* Main Form */}
               <div className="xl:col-span-2">
                  <form onSubmit={handleSubmit} className="space-y-6">
                     {/* Job Details Card */}
                     <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-[#004aad]" />
                              Job Request Details
                           </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                           {/* Job Title */}
                           <div className="space-y-2">
                              <Label htmlFor="title">Job Title *</Label>
                              <Input
                                 id="title"
                                 placeholder="e.g., Industrial Pipeline Inspection"
                                 value={formData.title}
                                 onChange={(e) =>
                                    handleInputChange("title", e.target.value)
                                 }
                                 className={
                                    errors.title ? "border-red-500" : ""
                                 }
                              />
                              {errors.title && (
                                 <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.title}
                                 </p>
                              )}
                           </div>

                           {/* Job Description */}
                           <div className="space-y-2">
                              <Label htmlFor="description">
                                 Job Description *
                              </Label>
                              <Textarea
                                 id="description"
                                 placeholder="Provide detailed information about the inspection requirements, materials, timeline, and any specific conditions..."
                                 value={formData.description}
                                 onChange={(e) =>
                                    handleInputChange(
                                       "description",
                                       e.target.value
                                    )
                                 }
                                 className={`min-h-[120px] ${
                                    errors.description ? "border-red-500" : ""
                                 }`}
                              />
                              {errors.description && (
                                 <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.description}
                                 </p>
                              )}
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label htmlFor="location">
                                    Job Location *
                                 </Label>
                                 <Select
                                    value={formData.location}
                                    onValueChange={(value) =>
                                       handleInputChange("location", value)
                                    }
                                 >
                                    <SelectTrigger
                                       className={
                                          errors.location
                                             ? "border-red-500 w-full"
                                             : "w-full"
                                       }
                                    >
                                       <SelectValue placeholder="Select city" />
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
                                 {errors.location && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                       <AlertCircle className="w-4 h-4" />
                                       {errors.location}
                                    </p>
                                 )}
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="region">Region *</Label>
                                 <Input
                                    id="region"
                                    placeholder="Enter region"
                                    value={formData.region}
                                    onChange={(e) =>
                                       handleInputChange(
                                          "region",
                                          e.target.value
                                       )
                                    }
                                    className={
                                       errors.region ? "border-red-500" : ""
                                    }
                                 />
                                 {errors.region && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                       <AlertCircle className="w-4 h-4" />
                                       {errors.region}
                                    </p>
                                 )}
                              </div>
                           </div>

                           {/* Project Parameters */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label htmlFor="duration">
                                    Project Duration (Days)
                                 </Label>
                                 <Input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    value={formData.projectDuration}
                                    onChange={(e) =>
                                       handleInputChange(
                                          "projectDuration",
                                          parseInt(e.target.value) || 1
                                       )
                                    }
                                 />
                              </div>
                              <div className="space-y-2 hidden">
                                 <Label htmlFor="inspectors">
                                    Number of Inspectors
                                 </Label>
                                 <Input
                                    id="inspectors"
                                    type="number"
                                    min="1"
                                    value={formData.numInspectors}
                                    onChange={(e) =>
                                       handleInputChange(
                                          "numInspectors",
                                          parseInt(e.target.value) || 1
                                       )
                                    }
                                 />
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Services Selection Card */}
                     <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                 <Calculator className="w-5 h-5 text-purple-600" />
                                 Select Services & Calculate Costs *
                              </span>
                              {costBreakdown && (
                                 <Badge
                                    variant="outline"
                                    className="text-lg px-3 py-1"
                                 >
                                    Total:{" "}
                                    {formatCurrency(
                                       costBreakdown.totals.grandTotal
                                    )}
                                 </Badge>
                              )}
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {servicesLoading ? (
                              <div className="flex items-center justify-center py-8">
                                 <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                 <span>Loading services...</span>
                              </div>
                           ) : (
                              <div className="grid grid-cols-1 gap-4">
                                 {services.map((service) => {
                                    const isSelected =
                                       formData.requiredServices.includes(
                                          service.serviceId?._id
                                       );

                                    return (
                                       <div
                                          key={service.serviceId?._id}
                                          className={`p-4 border rounded-lg transition-all ${
                                             isSelected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                          }`}
                                       >
                                          <div className="flex items-start justify-between">
                                             <div className="flex items-start gap-3 flex-1">
                                                <Checkbox
                                                   id={`service-${service.serviceId?._id}`}
                                                   checked={isSelected}
                                                   onCheckedChange={(checked) =>
                                                      handleServiceToggle(
                                                         service.serviceId?._id,
                                                         checked
                                                      )
                                                   }
                                                   className="mt-1"
                                                />
                                                <div className="flex-1">
                                                   <label
                                                      htmlFor={`service-${service.serviceId?._id}`}
                                                      className="text-sm font-medium text-gray-900 cursor-pointer"
                                                   >
                                                      {service.serviceId?.name}
                                                   </label>
                                                   <div className="flex items-center gap-2 mt-1">
                                                      <Badge
                                                         variant="outline"
                                                         className="text-xs"
                                                      >
                                                         {service.charge}{" "}
                                                         {service.currency}{" "}
                                                         {service.unit}
                                                      </Badge>
                                                      <Badge
                                                         variant="secondary"
                                                         className="text-xs"
                                                      >
                                                         Tax: {service.tax}%
                                                      </Badge>
                                                      {service.isPremium && (
                                                         <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                                            Premium
                                                         </Badge>
                                                      )}
                                                   </div>
                                                </div>
                                             </div>

                                             {isSelected && (
                                                <div className="flex items-center gap-2 ml-4">
                                                   <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() =>
                                                         updateQuantity(
                                                            service.serviceId
                                                               ?._id,
                                                            (quantities[
                                                               service.serviceId
                                                                  ?._id
                                                            ] || 1) - 1
                                                         )
                                                      }
                                                   >
                                                      <Minus className="w-4 h-4" />
                                                   </Button>
                                                   <span className="w-12 text-center font-medium">
                                                      {quantities[
                                                         service.serviceId?._id
                                                      ] || 1}
                                                   </span>
                                                   <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() =>
                                                         updateQuantity(
                                                            service.serviceId
                                                               ?._id,
                                                            (quantities[
                                                               service.serviceId
                                                                  ?._id
                                                            ] || 1) + 1
                                                         )
                                                      }
                                                   >
                                                      <Plus className="w-4 h-4" />
                                                   </Button>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           )}

                           {errors.requiredServices && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                 <AlertCircle className="w-4 h-4" />
                                 {errors.requiredServices}
                              </p>
                           )}

                           {/* Additional Cost Factors */}
                           {formData.requiredServices.length > 0 && (
                              <div className="border-t pt-6">
                                 <h4 className="font-medium text-gray-900 mb-4">
                                    Additional Cost Factors (Optional)
                                 </h4>
                                 <div className="space-y-3">
                                    {ADDITIONAL_COST_FACTORS.map((factor) => {
                                       const isEnabled =
                                          additionalCosts[factor.id] > 0;

                                       return (
                                          <div
                                             key={factor.id}
                                             className="flex items-center justify-between p-3 border rounded-lg"
                                          >
                                             <div className="flex items-center gap-3">
                                                <Checkbox
                                                   checked={isEnabled}
                                                   onCheckedChange={(checked) =>
                                                      toggleAdditionalCost(
                                                         factor.id,
                                                         checked
                                                      )
                                                   }
                                                />
                                                <div>
                                                   <span className="font-medium text-sm">
                                                      {factor.name}
                                                   </span>
                                                   <p className="text-xs text-gray-600">
                                                      {factor.type ===
                                                      "percentage"
                                                         ? "Percentage of base cost"
                                                         : "Fixed amount"}
                                                   </p>
                                                </div>
                                             </div>

                                             {isEnabled && (
                                                <div className="flex items-center gap-2">
                                                   <Input
                                                      type="number"
                                                      min="0"
                                                      value={
                                                         additionalCosts[
                                                            factor.id
                                                         ]
                                                      }
                                                      onChange={(e) =>
                                                         updateAdditionalCost(
                                                            factor.id,
                                                            parseFloat(
                                                               e.target.value
                                                            ) || 0
                                                         )
                                                      }
                                                      className="w-20"
                                                   />
                                                   <span className="text-sm">
                                                      {factor.type ===
                                                      "percentage"
                                                         ? "%"
                                                         : "$"}
                                                   </span>
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           )}

                           {/* Premium Request */}
                           <div className="flex items-center space-x-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                              <Checkbox
                                 id="isPremium"
                                 checked={formData.isPremium}
                                 onCheckedChange={(checked) =>
                                    handleInputChange("isPremium", checked)
                                 }
                              />
                              <div>
                                 <label
                                    htmlFor="isPremium"
                                    className="text-sm font-medium text-yellow-800 cursor-pointer"
                                 >
                                    Premium Request
                                 </label>
                                 <p className="text-xs text-yellow-700 mt-1">
                                    Get priority handling and faster response
                                    times
                                 </p>
                              </div>
                           </div>

                           {/* Submit Button */}
                           <div className="flex items-center justify-end gap-4 pt-6 border-t">
                              <Button
                                 type="button"
                                 variant="outline"
                                 disabled={loading}
                                 onClick={() => navigate("/find-providers")}
                              >
                                 Cancel
                              </Button>
                              <Button
                                 type="submit"
                                 disabled={loading}
                                 className="bg-[#004aad] min-w-[140px]"
                              >
                                 {loading ? (
                                    <>
                                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                       Submitting...
                                    </>
                                 ) : (
                                    <>
                                       <Send className="w-4 h-4 mr-2" />
                                       Submit Request
                                    </>
                                 )}
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  </form>
               </div>

               {/* Cost Breakdown Sidebar */}
               {showCostBreakdown && costBreakdown && (
                  <div className="xl:col-span-1">
                     <Card className="sticky top-6">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-green-600" />
                              Cost Breakdown
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                              {/* Service Costs */}
                              <div>
                                 <h4 className="font-semibold text-gray-900 mb-3">
                                    Selected Services
                                 </h4>
                                 <div className="space-y-2">
                                    {costBreakdown.services.map(
                                       (service, index) => (
                                          <div key={index} className="text-sm">
                                             <div className="flex justify-between items-start">
                                                {" "}
                                                <div className="flex-1">
                                                   <p className="font-medium">
                                                      {service.name}
                                                   </p>
                                                   <p className="text-gray-600">
                                                      {formatCurrency(
                                                         service.charge
                                                      )}{" "}
                                                      × {service.quantity}
                                                      {service.multiplier >
                                                         service.quantity && (
                                                         <span>
                                                            {" "}
                                                            ×{" "}
                                                            {service.multiplier /
                                                               service.quantity}
                                                         </span>
                                                      )}
                                                   </p>
                                                </div>
                                                <div className="text-right">
                                                   <p className="font-medium">
                                                      {formatCurrency(
                                                         service.baseCost
                                                      )}
                                                   </p>
                                                   <p className="text-gray-600">
                                                      +
                                                      {formatCurrency(
                                                         service.taxAmount
                                                      )}{" "}
                                                      tax
                                                   </p>
                                                </div>
                                             </div>
                                          </div>
                                       )
                                    )}
                                 </div>
                              </div>

                              {/* Additional Costs */}
                              {costBreakdown.additional.length > 0 && (
                                 <div className="border-t pt-3">
                                    <h4 className="font-semibold text-gray-900 mb-3">
                                       Additional Costs
                                    </h4>
                                    <div className="space-y-2">
                                       {costBreakdown.additional.map(
                                          (cost, index) => (
                                             <div
                                                key={index}
                                                className="flex justify-between text-sm"
                                             >
                                                <span>{cost.name}</span>
                                                <span className="font-medium">
                                                   {formatCurrency(cost.amount)}
                                                </span>
                                             </div>
                                          )
                                       )}
                                    </div>
                                 </div>
                              )}

                              {/* Totals */}
                              <div className="border-t pt-3 space-y-2">
                                 <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>
                                       {formatCurrency(
                                          costBreakdown.totals.baseCost
                                       )}
                                    </span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>
                                       {formatCurrency(
                                          costBreakdown.totals.tax
                                       )}
                                    </span>
                                 </div>
                                 {costBreakdown.totals.additional > 0 && (
                                    <div className="flex justify-between text-sm">
                                       <span>Additional</span>
                                       <span>
                                          {formatCurrency(
                                             costBreakdown.totals.additional
                                          )}
                                       </span>
                                    </div>
                                 )}
                                 <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Total</span>
                                    <span className="text-blue-600">
                                       {formatCurrency(
                                          costBreakdown.totals.grandTotal
                                       )}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default EnhancedJobRequestForm;
