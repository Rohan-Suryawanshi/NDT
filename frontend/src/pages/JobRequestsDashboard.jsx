import React, { useState, useEffect, useCallback } from "react";
import {
   MapPin,
   Calendar,
   DollarSign,
   Users,
   Clock,
   CheckCircle,
   AlertCircle,
   Mail,
   Building,
   FileText,
   Filter,
   Search,
   Plus,
   Eye,
   Edit,
   Trash2,
   Download,
   Upload,
   MessageSquare,
   Quote,
   Star,
   ChevronDown,
   ChevronUp,
   X,
   Send,
   Paperclip,
   Tag,
   CalendarDays,
   User,
   Award,
   Loader2,
   RefreshCw,
   Settings,
   ExternalLink,
   TrendingUp,
   Activity,
   Handshake,
   ThumbsUp,
   ThumbsDown,
   CheckCheck,
   XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { BACKEND_URL } from "@/constant/Global";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "react-hot-toast";

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

const STATUS_OPTIONS = [
   {
      value: "draft",
      label: "Draft",
      color: "bg-gray-100 text-gray-800 border-gray-200",
   }, // Created but not submitted
   {
      value: "open",
      label: "Open",
      color: "bg-green-100 text-green-800 border-green-200",
   }, // Submitted and waiting for provider response
   {
      value: "quoted",
      label: "Quoted",
      color: "bg-blue-100 text-blue-800 border-blue-200",
   }, // Provider has provided quotation
   {
      value: "negotiating",
      label: "Negotiating",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
   }, // In negotiation phase
   {
      value: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-800 border-green-200",
   }, // Quote accepted, work can begin
   {
      value: "in_progress",
      label: "In Progress",
      color: "bg-orange-100 text-orange-800 border-orange-200",
   }, // Work is ongoing
   {
      value: "completed",
      label: "Completed",
      color: "bg-purple-100 text-purple-800 border-purple-200",
   }, // Work completed
   {
      value: "delivered",
      label: "Delivered",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
   }, // Report/results delivered
   {
      value: "closed",
      label: "Closed",
      color: "bg-green-100 text-green-800 border-green-200",
   }, // Job closed successfully
   {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800 border-red-200",
   }, // Cancelled by client
   {
      value: "rejected",
      label: "Rejected",
      color: "bg-red-100 text-red-800 border-red-200",
   }, // Rejected by provider
   {
      value: "disputed",
      label: "Disputed",
      color: "bg-pink-100 text-pink-800 border-pink-200",
   }, // In dispute
   {
      value: "on_hold",
      label: "On Hold",
      color: "bg-gray-100 text-gray-800 border-gray-200",
   }, // Temporarily on hold
];

const NOTE_TYPES = [
   { value: "general", label: "General", icon: MessageSquare },
   { value: "technical", label: "Technical", icon: Settings },
   { value: "commercial", label: "Commercial", icon: DollarSign },
   { value: "logistics", label: "Logistics", icon: MapPin },
];

const ATTACHMENT_CATEGORIES = [
   { value: "specification", label: "Specification" },
   { value: "drawing", label: "Drawing" },
   { value: "report", label: "Report" },
   { value: "certificate", label: "Certificate" },
   { value: "photo", label: "Photo" },
   { value: "other", label: "Other" },
];

const QUOTATION_STATUS = {
   pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
   accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
   rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
   negotiating: { label: 'Negotiating', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
};

const JobRequestsDashboard = () => {
   const { user } = useAuth();
   const [jobRequests, setJobRequests] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [filters, setFilters] = useState({
      status: "all",
      region: "all",
      location: "all",
      isPremium: "all",
      dateFrom: "",
      dateTo: "",
   });
   const [pagination, setPagination] = useState({
      currentPage: 1,
      pageSize: 12,
      totalPages: 1,
      totalJobs: 0,
   });
   const [selectedJob, setSelectedJob] = useState(null);
   const [showQuotationModal, setShowQuotationModal] = useState(false);
   const [showNotesModal, setShowNotesModal] = useState(false);
   const [showAttachmentModal, setShowAttachmentModal] = useState(false);
   const [expandedCostBreakdown, setExpandedCostBreakdown] = useState({});

   // Form states
   const [quotationForm, setQuotationForm] = useState({
      amount: "",
      currency: "USD",
      validUntil: "",
      description: "",
      terms: "",
      breakdownItems: [],
   });
   const [noteForm, setNoteForm] = useState({
      content: "",
      type: "general",
      isInternal: false,
   });   const [attachmentForm, setAttachmentForm] = useState({
      files: [],
      category: "other",
      description: "",
   });

   // Negotiation states
   const [showNegotiationModal, setShowNegotiationModal] = useState(false);
   const [selectedQuotation, setSelectedQuotation] = useState(null);
   const [negotiationForm, setNegotiationForm] = useState({
      message: "",
      proposedAmount: "",
      counterOffer: "",
   });
   const [actionLoading, setActionLoading] = useState(false);

   // Fetch job requests
   const fetchJobRequests = useCallback(async () => {
      try {
         setLoading(true);
         const accessToken = localStorage.getItem("accessToken");
         const params = new URLSearchParams({
            page: pagination.currentPage,
            limit: pagination.pageSize,
            search: searchTerm,
            ...Object.fromEntries(
               Object.entries(filters).filter(
                  ([, v]) => v !== "all" && v !== ""
               )
            ),
         });

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
         );

         if (response.data.success) {
            setJobRequests(response.data.data.jobRequests || []);
            setPagination((prev) => ({
               ...prev,
               ...response.data.data.pagination,
            }));
         }
      } catch (error) {
         console.error("Error fetching job requests:", error);
         toast.error("Failed to fetch job requests");
      } finally {
         setLoading(false);
      }
   }, [pagination.currentPage, pagination.pageSize, searchTerm, filters]);
   useEffect(() => {
      fetchJobRequests();
   }, [fetchJobRequests]);

   // Get status configuration
   const getStatusConfig = (status) => {
      return (
         STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
      );
   };

   const getUrgencyColor = (urgency) => {
      switch (urgency) {
         case "high":
            return "text-red-600";
         case "medium":
            return "text-yellow-600";
         case "low":
            return "text-green-600";
         default:
            return "text-gray-600";
      }
   };

   // Handle job actions
   const handleViewDetails = async (jobId) => {
      try {
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests/${jobId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
         );

         if (response.data.success) {
            setSelectedJob(response.data.data);
         }
      } catch (error) {
         console.error("Error fetching job details:", error);
         toast.error("Failed to fetch job details");
      }
   };

   const handleStatusUpdate = async (jobId, newStatus) => {
      try {
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.patch(
            `${BACKEND_URL}/api/v1/job-requests/${jobId}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${accessToken}` } }
         );

         if (response.data.success) {
            toast.success("Status updated successfully");
            fetchJobRequests();
            if (selectedJob && selectedJob._id === jobId) {
               setSelectedJob((prev) => ({ ...prev, status: newStatus }));
            }
         }
      } catch (error) {
         console.error("Error updating status:", error);
         toast.error(
            error.response?.data?.message || "Failed to update status"
         );
      }
   };

   // Quotation functions
   const handleAddQuotation = async () => {
      try {
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/quotations`,
            quotationForm,
            { headers: { Authorization: `Bearer ${accessToken}` } }
         );

         if (response.data.success) {
            toast.success("Quotation added successfully");
            setShowQuotationModal(false);
            setQuotationForm({
               amount: "",
               currency: "USD",
               validUntil: "",
               description: "",
               terms: "",
               breakdownItems: [],
            });
            fetchJobRequests();
            handleViewDetails(selectedJob._id);
         }
      } catch (error) {
         console.error("Error adding quotation:", error);
         toast.error(
            error.response?.data?.message || "Failed to add quotation"
         );
      }   };

   // Negotiation functions
   const handleQuotationAction = async (quotationId, action, message = '') => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem('accessToken');
         const response = await axios.patch(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/quotations/${quotationId}`,
            { 
               status: action,
               clientMessage: message 
            },
            { 
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000
            }
         );

         if (response.data.success) {
            toast.success(`Quotation ${action} successfully`);
            handleViewDetails(selectedJob._id); // Refresh details
            fetchJobRequests(); // Refresh list
         } else {
            throw new Error(response.data.message || `Failed to ${action} quotation`);
         }
      } catch (error) {
         console.error('Error updating quotation:', error);
         toast.error(error.response?.data?.message || `Failed to ${action} quotation`);
      } finally {
         setActionLoading(false);
      }
   };

   const handleNegotiation = async () => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem('accessToken');
         
         if (!negotiationForm.message.trim()) {
            toast.error('Message is required for negotiation');
            return;
         }

         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/quotations/${selectedQuotation._id}/negotiate`,
            negotiationForm,
            { 
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000
            }
         );

         if (response.data.success) {
            toast.success('Negotiation message sent successfully');
            setShowNegotiationModal(false);
            setNegotiationForm({ message: '', proposedAmount: '', counterOffer: '' });
            clearDraft(); // Clear the saved draft
            handleViewDetails(selectedJob._id); // Refresh details
         } else {
            throw new Error(response.data.message || 'Failed to send negotiation');
         }
      } catch (error) {
         console.error('Error sending negotiation:', error);
         toast.error(error.response?.data?.message || 'Failed to send negotiation');
      } finally {
         setActionLoading(false);
      }
   };

   // Save negotiation draft to localStorage
   const saveDraft = useCallback(() => {
      if (selectedQuotation && negotiationForm.message.trim()) {
         localStorage.setItem(
            `negotiation-draft-${selectedQuotation._id}`,
            JSON.stringify(negotiationForm)
         );
      }
   }, [selectedQuotation, negotiationForm]);

   // Load negotiation draft from localStorage
   const loadDraft = useCallback(() => {
      if (selectedQuotation) {
         const draft = localStorage.getItem(`negotiation-draft-${selectedQuotation._id}`);
         if (draft) {
            try {
               const draftData = JSON.parse(draft);
               setNegotiationForm(draftData);
            } catch (error) {
               console.error('Error loading draft:', error);
            }
         }
      }
   }, [selectedQuotation]);

   // Clear negotiation draft
   const clearDraft = useCallback(() => {
      if (selectedQuotation) {
         localStorage.removeItem(`negotiation-draft-${selectedQuotation._id}`);
      }
   }, [selectedQuotation]);

   // Auto-save draft as user types
   useEffect(() => {
      const timer = setTimeout(saveDraft, 1000); // Save after 1 second of inactivity
      return () => clearTimeout(timer);
   }, [saveDraft]);

   // Load draft when quotation is selected
   useEffect(() => {
      if (selectedQuotation) {
         loadDraft();
      }
   }, [selectedQuotation, loadDraft]);

   // Notes functions
   const handleAddNote = async () => {
      try {
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/notes`,
            noteForm,
            { headers: { Authorization: `Bearer ${accessToken}` } }
         );

         if (response.data.success) {
            toast.success("Note added successfully");
            setShowNotesModal(false);
            setNoteForm({ content: "", type: "general", isInternal: false });
            handleViewDetails(selectedJob._id);
         }
      } catch (error) {
         console.error("Error adding note:", error);
         toast.error(error.response?.data?.message || "Failed to add note");
      }
   };

   // Attachment functions
   const handleAddAttachment = async () => {
      try {
         const accessToken = localStorage.getItem("accessToken");
         const formData = new FormData();

         attachmentForm.files.forEach((file) => {
            formData.append("attachment", file);
         });
         formData.append("category", attachmentForm.category);
         formData.append("description", attachmentForm.description);

         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/attachments`,
            formData,
            {
               headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "multipart/form-data",
               },
            }
         );

         if (response.data.success) {
            toast.success("Attachments uploaded successfully");
            setShowAttachmentModal(false);
            setAttachmentForm({
               files: [],
               category: "other",
               description: "",
            });
            handleViewDetails(selectedJob._id);
         }
      } catch (error) {
         console.error("Error uploading attachments:", error);
         toast.error(
            error.response?.data?.message || "Failed to upload attachments"
         );
      }
   };

   // Filter functions
   const handleFilterChange = (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
   };

   const handlePageChange = (newPage) => {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
   };

   const toggleCostBreakdown = (jobId) => {
      setExpandedCostBreakdown((prev) => ({
         ...prev,
         [jobId]: !prev[jobId],
      }));
   };

   const formatCurrency = (amount, currency = "USD") => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: currency,
      }).format(amount);
   };

   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   const canEditJob = (job) => {
      return (
         user?.role === "admin" ||
         (user?.role === "client" && job.clientId._id === user._id) ||
         (user?.role === "provider" && job.assignedProviderId === user._id)
      );
   };

   const canAddQuotation = (job) => {
      return (
         user?.role === "provider" &&
         (job.assignedProviderId === user._id || job.status === "open")
      );
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5cb5]"></div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
         {/* Header */}
         <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2">
                        <Building className="h-8 w-8 text-[#004aad]" />
                        <h1 className="text-2xl font-bold text-[#004aad]">
                           Job Requests
                        </h1>
                     </div>
                     <span className="bg-blue-100 text-[#004aad] text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {pagination.totalJobs}{" "}
                        {pagination.totalJobs === 1 ? "Request" : "Requests"}
                     </span>
                  </div>
                  <div className="flex items-center space-x-3">
                     <Button
                        onClick={fetchJobRequests}
                        variant="outline"
                        size="sm"
                     >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                     </Button>
                  </div>
               </div>
            </div>
         </header>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Advanced Filters */}
            <Card className="mb-6">
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                     {/* Search */}
                     <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                           placeholder="Search jobs, clients, providers..."
                           className="pl-10"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>

                     {/* Status Filter */}
                     <Select
                        value={filters.status}
                        onValueChange={(value) =>
                           handleFilterChange("status", value)
                        }
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Status</SelectItem>
                           {STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                 key={status.value}
                                 value={status.value}
                              >
                                 {status.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     {/* Region Filter */}
                     <Select
                        value={filters.region}
                        onValueChange={(value) =>
                           handleFilterChange("region", value)
                        }
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="Region" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Regions</SelectItem>
                           {REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>
                                 {region}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     {/* Location Filter */}
                     <Select
                        value={filters.location}
                        onValueChange={(value) =>
                           handleFilterChange("location", value)
                        }
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Cities</SelectItem>
                           {MAJOR_CITIES.map((city) => (
                              <SelectItem key={city} value={city}>
                                 {city}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>

                     {/* Premium Filter */}
                     <Select
                        value={filters.isPremium}
                        onValueChange={(value) =>
                           handleFilterChange("isPremium", value)
                        }
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="Premium" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Jobs</SelectItem>
                           <SelectItem value="true">Premium Only</SelectItem>
                           <SelectItem value="false">Standard Only</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                     <div>
                        <Label htmlFor="dateFrom">From Date</Label>
                        <Input
                           id="dateFrom"
                           type="date"
                           value={filters.dateFrom}
                           onChange={(e) =>
                              handleFilterChange("dateFrom", e.target.value)
                           }
                        />
                     </div>
                     <div>
                        <Label htmlFor="dateTo">To Date</Label>
                        <Input
                           id="dateTo"
                           type="date"
                           value={filters.dateTo}
                           onChange={(e) =>
                              handleFilterChange("dateTo", e.target.value)
                           }
                        />
                     </div>
                     <div className="flex items-end">
                        <Button
                           variant="outline"
                           onClick={() => {
                              setFilters({
                                 status: "all",
                                 region: "all",
                                 location: "all",
                                 isPremium: "all",
                                 dateFrom: "",
                                 dateTo: "",
                              });
                              setSearchTerm("");
                           }}
                        >
                           Clear Filters
                        </Button>
                     </div>
                     {/* <div className="flex items-end justify-end">
<Button variant="outline" size="sm">
<Download className="h-4 w-4 mr-2" />
Export
</Button>
</div> */}
                  </div>
               </CardContent>
            </Card>

            {/* Job Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {jobRequests.map((job) => (
                  <Card
                     key={job._id}
                     className="hover:shadow-lg transition-shadow duration-200"
                  >
                     <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                 <h3 className="text-lg font-semibold text-gray-900">
                                    {job.title}
                                 </h3>
                                 {job.isPremium && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                       <Star className="h-3 w-3 mr-1" />
                                       Premium
                                    </Badge>
                                 )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                 {job.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                 <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{job.location}</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>{formatDate(job.createdAt)}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col items-end space-y-2">
                              <Badge
                                 className={getStatusConfig(job.status).color}
                              >
                                 {getStatusConfig(job.status).label}
                              </Badge>
                              <div
                                 className={`flex items-center space-x-1 text-xs ${getUrgencyColor(
                                    job.urgencyLevel
                                 )}`}
                              >
                                 <AlertCircle className="h-3 w-3" />
                                 <span>{job.urgencyLevel}</span>
                              </div>
                           </div>
                        </div>

                        {/* Client Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                           <div className="flex items-center justify-between">
                              <div>
                                 <div className="flex items-center space-x-2 mb-1">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                       {job.clientName}
                                    </span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                       {job.clientEmail}
                                    </span>
                                 </div>
                              </div>
                              {job.assignedProviderId && (
                                 <Badge variant="outline">
                                    <Award className="h-3 w-3 mr-1" />
                                    Assigned
                                 </Badge>
                              )}
                           </div>
                        </div>

                        {/* Services */}
                        <div className="mb-4">
                           <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Required Services
                           </h4>
                           <div className="flex flex-wrap gap-1">
                              {job.requiredServices
                                 ?.slice(0, 3)
                                 .map((service) => (
                                    <Badge
                                       key={service._id}
                                       variant="secondary"
                                       className="text-xs"
                                    >
                                       {service.code}
                                    </Badge>
                                 ))}
                              {job.requiredServices?.length > 3 && (
                                 <Badge variant="secondary" className="text-xs">
                                    +{job.requiredServices.length - 3} more
                                 </Badge>
                              )}
                           </div>
                        </div>

                        {/* Cost Summary */}
                        <div className="mb-4">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                 Cost Summary
                              </span>
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => toggleCostBreakdown(job._id)}
                              >
                                 {expandedCostBreakdown[job._id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                 ) : (
                                    <ChevronDown className="h-4 w-4" />
                                 )}
                              </Button>
                           </div>

                           <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                 <span>Total Cost:</span>
                                 <span className="font-semibold text-green-600">
                                    {formatCurrency(
                                       job.estimatedTotal,
                                       job.costDetails?.currency
                                    )}
                                 </span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-600">
                                 <span>Duration:</span>
                                 <span>
                                    {job.projectDuration} day
                                    {job.projectDuration > 1 ? "s" : ""}
                                 </span>
                              </div>
                           </div>

                           {/* Expanded Cost Breakdown */}
                           {expandedCostBreakdown[job._id] &&
                              job.costDetails && (
                                 <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                                    <div className="text-xs font-medium text-gray-700 mb-2">
                                       Detailed Breakdown
                                    </div>
                                    <div className="space-y-1 text-xs">
                                       <div className="flex justify-between">
                                          <span>Base Cost:</span>
                                          <span>
                                             {formatCurrency(
                                                job.costDetails.totals.baseCost
                                             )}
                                          </span>
                                       </div>
                                       <div className="flex justify-between">
                                          <span>Tax:</span>
                                          <span>
                                             {formatCurrency(
                                                job.costDetails.totals.tax
                                             )}
                                          </span>
                                       </div>
                                       {job.costDetails.totals.additional >
                                          0 && (
                                          <div className="flex justify-between">
                                             <span>Additional:</span>
                                             <span>
                                                {formatCurrency(
                                                   job.costDetails.totals
                                                      .additional
                                                )}
                                             </span>
                                          </div>
                                       )}
                                       <div className="flex justify-between border-t pt-1 font-semibold">
                                          <span>Total:</span>
                                          <span>
                                             {formatCurrency(
                                                job.costDetails.totals
                                                   .grandTotal
                                             )}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              )}
                        </div>                        {/* Quotations Summary */}
                        {job.quotationHistory?.length > 0 && (
                           <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-[#004aad]">
                                    {job.quotationHistory.length} Quotation
                                    {job.quotationHistory.length > 1 ? "s" : ""}
                                 </span>
                                 <Quote className="h-4 w-4 text-[#004aad]" />
                              </div>
                              <div className="text-xs text-[#004aad] mt-1">
                                 Latest:{" "}
                                 {formatCurrency(
                                    job.quotationHistory[
                                       job.quotationHistory.length - 1
                                    ]?.quotedAmount
                                 )}
                              </div>
                              {/* Show negotiation indicator */}
                              {job.quotationHistory.some(q => q.negotiations && q.negotiations.length > 0) && (
                                 <div className="flex items-center mt-2 text-xs text-orange-600">
                                    <Handshake className="h-3 w-3 mr-1" />
                                    <span>Has negotiations</span>
                                 </div>
                              )}                              {/* Show negotiating status */}
                              {job.quotationHistory.some(q => q.status === 'negotiating') && (
                                 <div className="flex items-center justify-between mt-1">
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                       <MessageSquare className="h-3 w-3 mr-1" />
                                       Negotiating
                                    </Badge>
                                    {/* Show if provider needs to respond */}
                                    {user?.role === 'provider' && 
                                     job.quotationHistory.some(q => 
                                        q.providerId === user._id && 
                                        q.status === 'negotiating' && 
                                        q.negotiations?.some(n => n.fromClient) &&
                                        !q.negotiations?.slice().reverse().find(n => !n.fromClient)
                                     ) && (
                                       <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                          Response Needed
                                       </Badge>
                                     )}
                                 </div>
                              )}
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2 pt-4 border-t border-gray-100">
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewDetails(job._id)}
                           >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                           </Button>

                           {canAddQuotation(job) && (
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="flex-1"
                                 onClick={() => {
                                    setSelectedJob(job);
                                    setShowQuotationModal(true);
                                 }}
                              >
                                 <Quote className="h-4 w-4 mr-1" />
                                 Quote
                              </Button>
                           )}

                           {canEditJob(job) && (
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                    // Navigate to edit page or open edit modal
                                    toast.success(`Edit job ${job._id}`);
                                 }}
                              >
                                 <Edit className="h-4 w-4" />
                              </Button>
                           )}
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>

            {/* No Results */}
            {jobRequests.length === 0 && (
               <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                     No job requests found
                  </h3>
                  <p className="text-gray-500">
                     Try adjusting your search or filter criteria.
                  </p>
               </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
               <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-700">
                     Showing{" "}
                     {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                     {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.totalJobs
                     )}{" "}
                     of {pagination.totalJobs} results
                  </div>
                  <div className="flex space-x-2">
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === 1}
                        onClick={() =>
                           handlePageChange(pagination.currentPage - 1)
                        }
                     >
                        Previous
                     </Button>
                     {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                     ).map((page) => (
                        <Button
                           key={page}
                           variant={
                              page === pagination.currentPage
                                 ? "default"
                                 : "outline"
                           }
                           size="sm"
                           onClick={() => handlePageChange(page)}
                        >
                           {page}
                        </Button>
                     ))}
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={
                           pagination.currentPage === pagination.totalPages
                        }
                        onClick={() =>
                           handlePageChange(pagination.currentPage + 1)
                        }
                     >
                        Next
                     </Button>
                  </div>
               </div>
            )}
         </div>

         {/* Job Details Modal */}
         {selectedJob && (
            <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                           Job Details
                        </h2>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setSelectedJob(null)}
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                           {/* Job Info */}
                           <Card>
                              <CardHeader>
                                 <CardTitle className="flex items-center justify-between">
                                    <span>{selectedJob.title}</span>
                                    <Badge
                                       className={
                                          getStatusConfig(selectedJob.status)
                                             .color
                                       }
                                    >
                                       {
                                          getStatusConfig(selectedJob.status)
                                             .label
                                       }
                                    </Badge>
                                 </CardTitle>
                              </CardHeader>
                              <CardContent>
                                 <p className="text-gray-600 mb-4">
                                    {selectedJob.description}
                                 </p>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <Label>Location</Label>
                                       <p className="font-medium">
                                          {selectedJob.location},{" "}
                                          {selectedJob.region}
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Duration</Label>
                                       <p className="font-medium">
                                          {selectedJob.projectDuration} day
                                          {selectedJob.projectDuration > 1
                                             ? "s"
                                             : ""}
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Inspectors Required</Label>
                                       <p className="font-medium">
                                          {selectedJob.numInspectors}
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Created</Label>
                                       <p className="font-medium">
                                          {formatDate(selectedJob.createdAt)}
                                       </p>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>

                           {/* Detailed Cost Breakdown */}
                           {selectedJob.costDetails && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle>Cost Breakdown</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <div className="space-y-4">
                                       {/* Services */}
                                       <div>
                                          <h4 className="font-semibold mb-3">
                                             Services
                                          </h4>
                                          <div className="space-y-2">
                                             {selectedJob.costDetails.services?.map(
                                                (service, index) => (
                                                   <div
                                                      key={index}
                                                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                                   >
                                                      <div>
                                                         <p className="font-medium">
                                                            {service.name}
                                                         </p>
                                                         <p className="text-sm text-gray-600">
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
                                                         <p className="text-sm text-gray-600">
                                                            +
                                                            {formatCurrency(
                                                               service.taxAmount
                                                            )}{" "}
                                                            tax
                                                         </p>
                                                      </div>
                                                   </div>
                                                )
                                             )}
                                          </div>
                                       </div>

                                       {/* Additional Costs */}
                                       {selectedJob.costDetails.additional
                                          ?.length > 0 && (
                                          <div>
                                             <h4 className="font-semibold mb-3">
                                                Additional Costs
                                             </h4>
                                             <div className="space-y-2">
                                                {selectedJob.costDetails.additional.map(
                                                   (cost, index) => (
                                                      <div
                                                         key={index}
                                                         className="flex justify-between p-3 bg-gray-50 rounded-lg"
                                                      >
                                                         <span>
                                                            {cost.name}
                                                         </span>
                                                         <span className="font-medium">
                                                            {formatCurrency(
                                                               cost.amount
                                                            )}
                                                         </span>
                                                      </div>
                                                   )
                                                )}
                                             </div>
                                          </div>
                                       )}

                                       {/* Totals */}
                                       <div className="border-t pt-4 space-y-2">
                                          <div className="flex justify-between">
                                             <span>Subtotal:</span>
                                             <span>
                                                {formatCurrency(
                                                   selectedJob.costDetails
                                                      .totals.baseCost
                                                )}
                                             </span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span>Tax:</span>
                                             <span>
                                                {formatCurrency(
                                                   selectedJob.costDetails
                                                      .totals.tax
                                                )}
                                             </span>
                                          </div>
                                          {selectedJob.costDetails.totals
                                             .additional > 0 && (
                                             <div className="flex justify-between">
                                                <span>Additional:</span>
                                                <span>
                                                   {formatCurrency(
                                                      selectedJob.costDetails
                                                         .totals.additional
                                                   )}
                                                </span>
                                             </div>
                                          )}
                                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                                             <span>Total:</span>
                                             <span className="text-green-600">
                                                {formatCurrency(
                                                   selectedJob.costDetails
                                                      .totals.grandTotal
                                                )}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 </CardContent>
                              </Card>
                           )}                           {/* Quotations */}
                           {selectedJob.quotationHistory?.length > 0 && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle>Quotations</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <div className="space-y-4">
                                       {selectedJob.quotationHistory.map(
                                          (quotation, index) => {
                                             const quotationStatusConfig = QUOTATION_STATUS[quotation.status] || QUOTATION_STATUS.pending;
                                             const StatusIcon = quotationStatusConfig.icon;
                                             
                                             return (
                                                <div
                                                   key={index}
                                                   className="p-4 border rounded-lg border-l-4 border-l-blue-500"
                                                >
                                                   <div className="flex justify-between items-start mb-4">
                                                      <div>
                                                         <div className="flex items-center space-x-2 mb-2">
                                                            <p className="font-semibold text-lg text-green-600">
                                                               {formatCurrency(
                                                                  quotation.quotedAmount,
                                                                  quotation.currency
                                                               )}
                                                            </p>
                                                            <Badge className={quotationStatusConfig.color}>
                                                               <StatusIcon className="h-3 w-3 mr-1" />
                                                               {quotationStatusConfig.label}
                                                            </Badge>
                                                         </div>
                                                         <p className="text-sm text-gray-600">
                                                            Valid until:{" "}
                                                            {quotation.validUntil ? formatDate(quotation.validUntil) : 'No expiry'}
                                                         </p>
                                                         <p className="text-sm text-gray-600">
                                                            Submitted: {formatDate(quotation.quotedAt)}
                                                         </p>
                                                      </div>
                                                      
                                                      {/* Provider Info */}
                                                      <div className="text-right">
                                                         <p className="font-medium">{quotation.providerId?.companyName}</p>
                                                         <p className="text-sm text-gray-600">{quotation.providerId?.email}</p>
                                                      </div>
                                                   </div>

                                                   {quotation.quotationDetails && (
                                                      <div className="mb-4">
                                                         <Label>Description</Label>
                                                         <p className="text-gray-700">{quotation.quotationDetails}</p>
                                                      </div>
                                                   )}

                                                   {quotation.terms && (
                                                      <div className="mb-4">
                                                         <Label>Terms & Conditions</Label>
                                                         <p className="text-gray-700 text-sm">{quotation.terms}</p>
                                                      </div>
                                                   )}                                                   {/* Quotation Actions */}
                                                   {user?.role === 'client' && quotation.status === 'pending' && (
                                                      <div className="flex space-x-3 mt-4">
                                                         <Button
                                                            onClick={() => handleQuotationAction(quotation._id, 'accepted')}
                                                            className="bg-green-600 hover:bg-green-700"
                                                            disabled={actionLoading}
                                                            size="sm"
                                                         >
                                                            {actionLoading ? (
                                                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                               <ThumbsUp className="h-4 w-4 mr-2" />
                                                            )}
                                                            Accept
                                                         </Button>
                                                         <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                               setSelectedQuotation(quotation);
                                                               setShowNegotiationModal(true);
                                                            }}
                                                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                                            disabled={actionLoading}
                                                            size="sm"
                                                         >
                                                            <Handshake className="h-4 w-4 mr-2" />
                                                            Negotiate
                                                         </Button>
                                                         <Button
                                                            variant="outline"
                                                            onClick={() => handleQuotationAction(quotation._id, 'rejected')}
                                                            className="border-red-500 text-red-600 hover:bg-red-50"
                                                            disabled={actionLoading}
                                                            size="sm"
                                                         >
                                                            {actionLoading ? (
                                                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                               <ThumbsDown className="h-4 w-4 mr-2" />
                                                            )}
                                                            Reject
                                                         </Button>
                                                      </div>
                                                   )}                                                   {/* Provider Negotiation Actions */}
                                                   {user?.role === 'provider' && 
                                                    quotation.providerId?._id === user._id && 
                                                    (quotation.status === 'pending' || quotation.status === 'negotiating') && (
                                                      <div className="flex space-x-3 mt-4">                                                         {(() => {
                                                            const hasClientMessages = quotation.negotiations?.some(n => n.fromClient);
                                                            const needsResponse = hasClientMessages && quotation.status === 'negotiating';
                                                            
                                                            return (
                                                               <Button
                                                                  variant={needsResponse ? "default" : "outline"}
                                                                  onClick={() => {
                                                                     setSelectedQuotation(quotation);
                                                                     setShowNegotiationModal(true);
                                                                  }}
                                                                  className={needsResponse 
                                                                     ? "bg-orange-600 hover:bg-orange-700 text-white" 
                                                                     : "border-blue-500 text-blue-600 hover:bg-blue-50"
                                                                  }
                                                                  disabled={actionLoading}
                                                                  size="sm"
                                                               >
                                                                  <MessageSquare className="h-4 w-4 mr-2" />
                                                                  {needsResponse ? 'Respond to Client' : 
                                                                   quotation.status === 'negotiating' ? 'Continue Negotiation' : 'Start Negotiation'}
                                                                  {needsResponse && (
                                                                     <Badge className="ml-2 bg-red-500 text-white text-xs px-1">
                                                                        New
                                                                     </Badge>
                                                                  )}
                                                               </Button>
                                                            );
                                                         })()}
                                                      </div>
                                                   )}

                                                   {/* Negotiation Messages */}
                                                   {quotation.negotiations && quotation.negotiations.length > 0 && (
                                                      <div className="mt-4 border-t pt-4">
                                                         <Label>Negotiation History</Label>
                                                         <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                                            {quotation.negotiations.map((negotiation, negIndex) => (
                                                               <div key={negIndex} className="p-3 bg-gray-50 rounded-lg">
                                                                  <div className="flex justify-between items-start mb-2">
                                                                     <span className="font-medium text-sm">
                                                                        {negotiation.fromClient ? 'Client' : 'Provider'}
                                                                     </span>
                                                                     <span className="text-xs text-gray-500">
                                                                        {formatDate(negotiation.createdAt)}
                                                                     </span>
                                                                  </div>
                                                                  <p className="text-sm">{negotiation.message}</p>
                                                                  {negotiation.proposedAmount && (
                                                                     <p className="text-sm font-medium text-green-600 mt-1">
                                                                        Proposed: {formatCurrency(negotiation.proposedAmount)}
                                                                     </p>
                                                                  )}
                                                                  {negotiation.counterOffer && (
                                                                     <p className="text-sm text-gray-600 mt-1">
                                                                        Terms: {negotiation.counterOffer}
                                                                     </p>
                                                                  )}
                                                               </div>
                                                            ))}
                                                         </div>
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                          }
                                       )}
                                    </div>
                                 </CardContent>
                              </Card>
                           )}

                           {/* Notes */}
                           {selectedJob.internalNotes?.length > 0 && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <div className="space-y-3">
                                       {selectedJob.internalNotes.map((note, index) => (
                                          <div
                                             key={index}
                                             className="p-3 border-l-4 border-blue-500 bg-blue-50"
                                          >
                                             <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline">
                                                   {note.noteType}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                   {formatDate(note.addedAt)}
                                                </span>
                                             </div>
                                             <p className="text-sm">
                                                {note.note}
                                             </p>
                                             <p className="text-xs text-gray-600 mt-1">
                                                By{" "}
                                                {note.addedBy?.name ||
                                                   "Unknown"}
                                             </p>
                                          </div>
                                       ))}
                                    </div>
                                 </CardContent>
                              </Card>
                           )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                           {/* Status Update */}
                           {canEditJob(selectedJob) && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle>Update Status</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <Select
                                       value={selectedJob.status}
                                       onValueChange={(value) =>
                                          handleStatusUpdate(
                                             selectedJob._id,
                                             value
                                          )
                                       }
                                    >
                                       <SelectTrigger>
                                          <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                          {STATUS_OPTIONS.map((status) => (
                                             <SelectItem
                                                key={status.value}
                                                value={status.value}
                                             >
                                                {status.label}
                                             </SelectItem>
                                          ))}
                                       </SelectContent>
                                    </Select>
                                 </CardContent>
                              </Card>
                           )}

                           {/* Client Info */}
                           <Card>
                              <CardHeader>
                                 <CardTitle>Client Information</CardTitle>
                              </CardHeader>
                              <CardContent>
                                 <div className="space-y-2">
                                    <div>
                                       <Label>Name</Label>
                                       <p className="font-medium">
                                          {selectedJob.clientName}
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Email</Label>
                                       <p className="font-medium">
                                          {selectedJob.clientEmail}
                                       </p>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>

                           {/* Actions */}
                           <Card>
                              <CardHeader>
                                 <CardTitle>Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                 {canAddQuotation(selectedJob) && (
                                    <Button
                                       className="w-full"
                                       onClick={() =>
                                          setShowQuotationModal(true)
                                       }
                                    >
                                       <Quote className="h-4 w-4 mr-2" />
                                       Add Quotation
                                    </Button>
                                 )}

                                 <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowNotesModal(true)}
                                 >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Add Note
                                 </Button>

                                 <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowAttachmentModal(true)}
                                 >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Add Attachment
                                 </Button>

                                 {/* <Button variant="outline" className="w-full">
<Download className="h-4 w-4 mr-2" />
Export Details
</Button> */}
                              </CardContent>
                           </Card>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Quotation Modal */}
         {showQuotationModal && selectedJob && (
            <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                  <div className="p-6">
                     <h3 className="text-xl font-bold mb-4">Add Quotation</h3>
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <Label htmlFor="amount" className="mb-2">Amount *</Label>
                              <Input
                                 id="amount"
                                 type="number"
                                 value={quotationForm.amount}
                                 onChange={(e) =>
                                    setQuotationForm((prev) => ({
                                       ...prev,
                                       amount: e.target.value,
                                    }))
                                 }
                                 placeholder="0.00"
                              />
                           </div>
                           <div>
                              <Label htmlFor="currency" className="mb-2">Currency</Label>
                              <Select
                                 value={quotationForm.currency}
                                 onValueChange={(value) =>
                                    setQuotationForm((prev) => ({
                                       ...prev,
                                       currency: value,
                                    }))
                                 }
                              >
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="INR">INR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>

                        <div>
                           <Label htmlFor="validUntil" className="mb-2">Valid Until *</Label>
                           <Input
                              id="validUntil"
                              type="date"
                              value={quotationForm.validUntil}
                              onChange={(e) =>
                                 setQuotationForm((prev) => ({
                                    ...prev,
                                    validUntil: e.target.value,
                                 }))
                              }
                           />
                        </div>

                        <div>
                           <Label htmlFor="description">Description</Label>
                           <Textarea
                              id="description"
                              value={quotationForm.description}
                              onChange={(e) =>
                                 setQuotationForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                 }))
                              }
                              placeholder="Brief description of the quotation..."
                           />
                        </div>

                        <div>
                           <Label htmlFor="terms">Terms & Conditions</Label>
                           <Textarea
                              id="terms"
                              value={quotationForm.terms}
                              onChange={(e) =>
                                 setQuotationForm((prev) => ({
                                    ...prev,
                                    terms: e.target.value,
                                 }))
                              }
                              placeholder="Payment terms, delivery conditions, etc..."
                           />
                        </div>

                        <div className="flex space-x-3 pt-4">
                           <Button
                              onClick={handleAddQuotation}
                              className="flex-1"
                           >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Quotation
                           </Button>
                           <Button
                              variant="outline"
                              onClick={() => setShowQuotationModal(false)}
                              className="flex-1"
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Notes Modal */}
         {showNotesModal && selectedJob && (
            <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl max-w-lg w-full">
                  <div className="p-6">
                     <h3 className="text-xl font-bold mb-4">Add Note</h3>
                     <div className="space-y-4">
                        <div>
                           <Label htmlFor="noteType">Note Type</Label>
                           <Select
                              value={noteForm.type}
                              onValueChange={(value) =>
                                 setNoteForm((prev) => ({
                                    ...prev,
                                    type: value,
                                 }))
                              }
                           >
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {NOTE_TYPES.map((type) => (
                                    <SelectItem
                                       key={type.value}
                                       value={type.value}
                                    >
                                       <div className="flex items-center">
                                          <type.icon className="h-4 w-4 mr-2" />
                                          {type.label}
                                       </div>
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>

                        <div>
                           <Label htmlFor="noteContent">Content *</Label>
                           <Textarea
                              id="noteContent"
                              value={noteForm.content}
                              onChange={(e) =>
                                 setNoteForm((prev) => ({
                                    ...prev,
                                    content: e.target.value,
                                 }))
                              }
                              placeholder="Enter your note..."
                              rows={4}
                           />
                        </div>

                        <div className="flex items-center space-x-2 ">
                           <input
                              type="checkbox"
                              id="isInternal"
                              checked={noteForm.isInternal}
                              onChange={(e) =>
                                 setNoteForm((prev) => ({
                                    ...prev,
                                    isInternal: e.target.checked,
                                 }))
                              }
                           />
                           <Label htmlFor="isInternal" className="mb-0">
                              Internal note (not visible to client)
                           </Label>
                        </div>

                        <div className="flex space-x-3 pt-4">
                           <Button onClick={handleAddNote} className="flex-1">
                              <Send className="h-4 w-4 mr-2" />
                              Add Note
                           </Button>
                           <Button
                              variant="outline"
                              onClick={() => setShowNotesModal(false)}
                              className="flex-1"
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Attachment Modal */}
         {showAttachmentModal && selectedJob && (
            <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl max-w-lg w-full">
                  <div className="p-6">
                     <h3 className="text-xl font-bold mb-4">Add Attachment</h3>
                     <div className="space-y-4">
                        <div>
                           <Label htmlFor="files" className="mb-2">Files *</Label>
                           <Input
                              id="files"
                              type="file"
                              multiple
                              onChange={(e) =>
                                 setAttachmentForm((prev) => ({
                                    ...prev,
                                    files: Array.from(e.target.files),
                                 }))
                              }
                           />
                           {attachmentForm.files.length > 0 && (
                              <div className="mt-2 space-y-1">
                                 {attachmentForm.files.map((file, index) => (
                                    <div
                                       key={index}
                                       className="text-sm text-gray-600 flex items-center"
                                    >
                                       <Paperclip className="h-3 w-3 mr-1" />
                                       {file.name} (
                                       {(file.size / 1024).toFixed(1)} KB)
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        <div>
                           <Label htmlFor="category">Category</Label>
                           <Select
                              value={attachmentForm.category}
                              onValueChange={(value) =>
                                 setAttachmentForm((prev) => ({
                                    ...prev,
                                    category: value,
                                 }))
                              }
                           >
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {ATTACHMENT_CATEGORIES.map((category) => (
                                    <SelectItem
                                       key={category.value}
                                       value={category.value}
                                    >
                                       {category.label}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>

                        <div>
                           <Label htmlFor="attachmentDescription">
                              Description
                           </Label>
                           <Textarea
                              id="attachmentDescription"
                              value={attachmentForm.description}
                              onChange={(e) =>
                                 setAttachmentForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                 }))
                              }
                              placeholder="Brief description of the files..."
                           />
                        </div>

                        <div className="flex space-x-3 pt-4">
                           <Button
                              onClick={handleAddAttachment}
                              className="flex-1"
                              disabled={attachmentForm.files.length === 0}
                           >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Files
                           </Button>
                           <Button
                              variant="outline"
                              onClick={() => setShowAttachmentModal(false)}
                              className="flex-1"
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  </div>               </div>
            </div>
         )}         {/* Negotiation Modal */}
         {showNegotiationModal && selectedQuotation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">
                           {user?.role === 'client' ? 'Negotiate Quotation' : 'Respond to Negotiation'}
                        </h3>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setShowNegotiationModal(false)}
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Quotation Details & Negotiation History */}
                        <div className="space-y-6">
                           {/* Current Quotation */}
                           <Card className="bg-blue-50">
                              <CardContent className="p-4">
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <p className="text-sm text-gray-600">Original Quotation</p>
                                       <p className="text-2xl font-bold text-blue-600">
                                          {formatCurrency(selectedQuotation.quotedAmount, selectedQuotation.quotedCurrency)}
                                       </p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-sm text-gray-600">From</p>
                                       <p className="font-medium">{selectedQuotation.providerId?.companyName}</p>
                                    </div>
                                 </div>
                                 {selectedQuotation.quotationDetails && (
                                    <div className="mt-3 pt-3 border-t">
                                       <p className="text-sm text-gray-600">Description:</p>
                                       <p className="text-sm">{selectedQuotation.quotationDetails}</p>
                                    </div>
                                 )}
                              </CardContent>
                           </Card>

                           {/* Negotiation History */}
                           {selectedQuotation.negotiations && selectedQuotation.negotiations.length > 0 && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle className="text-lg">Negotiation History</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                       {selectedQuotation.negotiations.map((negotiation, index) => (
                                          <div 
                                             key={index} 
                                             className={`p-3 rounded-lg ${
                                                negotiation.fromClient 
                                                   ? 'bg-blue-50 border-l-4 border-blue-500' 
                                                   : 'bg-green-50 border-l-4 border-green-500'
                                             }`}
                                          >
                                             <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center space-x-2">
                                                   <Badge variant={negotiation.fromClient ? "default" : "secondary"}>
                                                      {negotiation.fromClient ? 'Client' : 'Provider'}
                                                   </Badge>
                                                   {negotiation.proposedAmount && (
                                                      <Badge variant="outline" className="text-green-600">
                                                         {formatCurrency(negotiation.proposedAmount)}
                                                      </Badge>
                                                   )}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                   {formatDate(negotiation.createdAt)}
                                                </span>
                                             </div>
                                             <p className="text-sm mb-2">{negotiation.message}</p>
                                             {negotiation.counterOffer && (
                                                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                                   <strong>Terms:</strong> {negotiation.counterOffer}
                                                </div>
                                             )}
                                          </div>
                                       ))}
                                    </div>
                                 </CardContent>
                              </Card>
                           )}
                        </div>

                        {/* Right Column - Negotiation Form */}
                        <div className="space-y-6">
                           <Card>
                              <CardHeader>
                                 <CardTitle className="text-lg">
                                    {user?.role === 'client' ? 'Your Counter Offer' : 'Your Response'}
                                 </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                 {/* Proposed Amount */}
                                 <div>
                                    <Label htmlFor="proposedAmount">
                                       {user?.role === 'client' ? 'Your Counter Offer' : 'Revised Quote'} (Optional)
                                    </Label>
                                    <Input
                                       id="proposedAmount"
                                       type="number"
                                       placeholder={user?.role === 'client' ? 'Enter your proposed amount' : 'Enter revised quote amount'}
                                       value={negotiationForm.proposedAmount}
                                       onChange={(e) => setNegotiationForm(prev => ({ ...prev, proposedAmount: e.target.value }))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                       {user?.role === 'client' 
                                          ? 'Propose a different amount if you want to negotiate the price'
                                          : 'Provide a revised quote if you want to adjust the original amount'
                                       }
                                    </p>
                                 </div>

                                 {/* Message */}
                                 <div>
                                    <Label htmlFor="message">Message *</Label>
                                    <Textarea
                                       id="message"
                                       placeholder={
                                          user?.role === 'client' 
                                             ? 'Explain your counter-offer or ask questions about the quotation...'
                                             : 'Respond to the client\'s negotiation, explain your position...'
                                       }
                                       value={negotiationForm.message}
                                       onChange={(e) => setNegotiationForm(prev => ({ ...prev, message: e.target.value }))}
                                       rows={4}
                                       required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                       {user?.role === 'client' 
                                          ? 'Your message will be sent to the service provider for review.'
                                          : 'Your response will be sent to the client.'
                                       }
                                    </p>
                                 </div>

                                 {/* Additional Terms */}
                                 <div>
                                    <Label htmlFor="counterOffer">
                                       {user?.role === 'client' ? 'Additional Terms' : 'Revised Terms'} (Optional)
                                    </Label>
                                    <Textarea
                                       id="counterOffer"
                                       placeholder={
                                          user?.role === 'client'
                                             ? 'Any additional terms or conditions you\'d like to propose...'
                                             : 'Any revised terms, conditions, or clarifications...'
                                       }
                                       value={negotiationForm.counterOffer}
                                       onChange={(e) => setNegotiationForm(prev => ({ ...prev, counterOffer: e.target.value }))}
                                       rows={3}
                                    />
                                 </div>

                                 {/* Provider Additional Actions */}
                                 {user?.role === 'provider' && (
                                    <div className="border-t pt-4">
                                       <Label className="text-sm font-medium text-gray-700">Quick Actions</Label>
                                       <div className="flex space-x-2 mt-2">
                                          <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => {
                                                setNegotiationForm(prev => ({
                                                   ...prev,
                                                   message: 'I accept your proposed terms and amount. Let\'s proceed with this agreement.'
                                                }));
                                             }}
                                          >
                                             <CheckCircle className="h-4 w-4 mr-1" />
                                             Accept Proposal
                                          </Button>
                                          <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => {
                                                setNegotiationForm(prev => ({
                                                   ...prev,
                                                   message: 'I understand your position, but I need to maintain my original quote due to project requirements and costs.'
                                                }));
                                             }}
                                          >
                                             <XCircle className="h-4 w-4 mr-1" />
                                             Decline Changes
                                          </Button>
                                       </div>
                                    </div>
                                 )}

                                 {/* Actions */}
                                 <div className="flex space-x-3 pt-4">
                                    <Button 
                                       onClick={handleNegotiation}
                                       disabled={!negotiationForm.message.trim() || actionLoading}
                                       className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                       {actionLoading ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                       ) : (
                                          <Send className="h-4 w-4 mr-2" />
                                       )}
                                       {user?.role === 'client' ? 'Send Negotiation' : 'Send Response'}
                                    </Button>
                                    <Button 
                                       variant="outline" 
                                       onClick={() => setShowNegotiationModal(false)}
                                       className="flex-1"
                                       disabled={actionLoading}
                                    >
                                       Cancel
                                    </Button>
                                 </div>
                              </CardContent>
                           </Card>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default JobRequestsDashboard;
