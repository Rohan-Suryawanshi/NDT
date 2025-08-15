import React, { useState, useEffect, useCallback } from "react";
import {
   Search,
   Filter,
   Calendar,
   MapPin,
   DollarSign,
   Clock,
   User,
   Eye,
   MessageCircle,
   CheckCircle2,
   XCircle,
   AlertCircle,
   TrendingUp,
   FileText,
   Send,
   Edit,
   RefreshCw,
   Download,
   Star,
   Award,
   Building2,
   Phone,
   Mail,
   Calendar as CalendarIcon,
   Banknote,
   Activity,
   Quote,
   ArrowRight,
   ThumbsUp,
   ThumbsDown,
   Handshake,
   Clock3,
   CheckCheck,
   X,
   FileSpreadsheet,
   Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { BACKEND_URL } from "@/constant/Global";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "react-hot-toast";

const NOTE_TYPES = [
   { value: "general", label: "General", icon: MessageCircle },
   { value: "technical", label: "Technical", icon: AlertCircle },
   { value: "commercial", label: "Commercial", icon: DollarSign },
   { value: "logistics", label: "Logistics", icon: MapPin },
];

const STATUS_CONFIG = {
   draft: {
      label: "Draft",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Edit,
   },
   open: {
      label: "Open",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock3,
   },
   quoted: {
      label: "Quoted",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: Quote,
   },
   negotiating: {
      label: "Negotiating",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Handshake,
   },
   accepted: {
      label: "Accepted",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: CheckCheck,
   },
   in_progress: {
      label: "In Progress",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: Activity,
   },
   completed: {
      label: "Completed",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
   },
   delivered: {
      label: "Delivered",
      color: "bg-teal-100 text-teal-800 border-teal-200",
      icon: Send,
   },
   closed: {
      label: "Closed",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
   },
   cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
   },
   rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
   },
   disputed: {
      label: "Disputed",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
   },
   on_hold: {
      label: "On Hold",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
   },
};

const QUOTATION_STATUS = {
   pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
   },
   accepted: {
      label: "Accepted",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
   },
   rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
   },
   negotiating: {
      label: "Negotiating",
      color: "bg-blue-100 text-blue-800",
      icon: MessageCircle,
   },
};

const ClientServiceRequest = () => {
   const { user } = useAuth();
   const [requests, setRequests] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [showDetailsModal, setShowDetailsModal] = useState(false);
   const [showNegotiationModal, setShowNegotiationModal] = useState(false);
   const [selectedQuotation, setSelectedQuotation] = useState(null);
   const [error, setError] = useState(null);
   const [actionLoading, setActionLoading] = useState(false);

   // Filter states
   const [filters, setFilters] = useState({
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      location: "",
   });

   // Add noteForm state after negotiationForm (around line 115)
   // Note form state
   const [noteForm, setNoteForm] = useState({
      type: "general",
      content: "",
      isInternal: false,
   });

   // Pagination
   const [pagination, setPagination] = useState({
      currentPage: 1,
      pageSize: 12,
      totalPages: 1,
      totalRequests: 0,
   });

   // Negotiation form
   const [negotiationForm, setNegotiationForm] = useState({
      message: "",
      proposedAmount: "",
      counterOffer: "",
   });
   // Stats
   const [stats, setStats] = useState({
      total: 0,
      open: 0,
      quoted: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
   });
   // Export functionality - using client-side CSV generation

   // Add handleAddNote function after handleNegotiation (around line 326)
   // Handle adding note
   const handleAddNote = async () => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem("accessToken");

         if (!noteForm.content.trim()) {
            toast.error("Note content is required");
            return;
         }

         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedRequest._id}/notes`,
            {
               content: noteForm.content,
               noteType: noteForm.type,
               isInternal: noteForm.isInternal,
            },
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000,
            }
         );

         if (response.data.success) {
            toast.success("Note added successfully");
            setNoteForm({ type: "general", content: "", isInternal: false }); // Reset form
            handleViewDetails(selectedRequest._id); // Refresh details
         } else {
            throw new Error(response.data.message || "Failed to add note");
         }
      } catch (error) {
         console.error("Error adding note:", error);
         toast.error(error.response?.data?.message || "Failed to add note");
      } finally {
         setActionLoading(false);
      }
   };

   const handleExportRequests = useCallback(async () => {
      try {
         setActionLoading(true);

         // Convert current requests to CSV
         const csvHeaders = [
            "Title",
            "Status",
            "Location",
            "Region",
            "Created Date",
            "Estimated Total",
            "Provider",
            "Services",
         ];
         const csvRows = requests.map((request) => [
            request.title,
            request.status,
            request.location,
            request.region,
            new Date(request.createdAt).toLocaleDateString(),
            request.estimatedTotal,
            request.providerName || "Not Assigned",
            request.requiredServices?.map((s) => s.name || s.code).join("; ") ||
               "N/A",
         ]);

         const csvContent = [csvHeaders, ...csvRows]
            .map((row) => row.map((field) => `"${field}"`).join(","))
            .join("\n");

         // Create download
         const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
         });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.setAttribute(
            "download",
            `service-requests-${new Date().toISOString().split("T")[0]}.csv`
         );
         document.body.appendChild(link);
         link.click();
         link.remove();
         window.URL.revokeObjectURL(url);

         toast.success("Service requests exported successfully");
      } catch (error) {
         console.error("Export error:", error);
         toast.error("Failed to export service requests");
      } finally {
         setActionLoading(false);
      }
   }, [requests]); // Fetch client requests
   const fetchRequests = useCallback(async () => {
      try {
         setLoading(true);
         setError(null);
         const accessToken = localStorage.getItem("accessToken");

         if (!accessToken) {
            throw new Error("No access token found");
         }

         // Use the client-specific endpoint for better performance
         const params = new URLSearchParams({
            page: pagination.currentPage,
            limit: pagination.pageSize,
            search: filters.search,
            ...Object.fromEntries(
               Object.entries(filters).filter(
                  ([, v]) => v !== "all" && v !== ""
               )
            ),
         });

         // Use the general endpoint since it filters by clientId automatically for client role
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests?${params}`,
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 10000, // 10 second timeout
            }
         );

         if (response.data.success) {
            const data = response.data.data;
            setRequests(data.jobRequests || []);

            // Update pagination with backend response
            setPagination((prev) => ({
               ...prev,
               currentPage: data.pagination.currentPage,
               totalPages: data.pagination.totalPages,
               totalRequests: data.pagination.totalJobs,
            }));
            // Calculate stats from all requests
            const requestData = data.jobRequests || [];
            console.log("Fetched requests:", requestData);
            const newStats = {
               total: requestData.length,
               open: requestData.filter((r) =>
                  ["draft", "open"].includes(r.status)
               ).length,
               quoted: requestData.filter((r) =>
                  ["quoted", "negotiating"].includes(r.status)
               ).length,
               inProgress: requestData.filter((r) =>
                  ["accepted", "in_progress"].includes(r.status)
               ).length,
               completed: requestData.filter((r) =>
                  ["completed", "delivered", "closed"].includes(r.status)
               ).length,
               cancelled: requestData.filter((r) =>
                  ["cancelled", "rejected", "disputed"].includes(r.status)
               ).length,
            };
            setStats(newStats);
         } else {
            throw new Error(
               response.data.message || "Failed to fetch requests"
            );
         }
      } catch (error) {
         console.error("Error fetching requests:", error);
         const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch service requests";
         setError(errorMessage);

         if (error.response?.status === 401) {
            toast.error("Session expired. Please login again.");
            // Redirect to login if needed
         } else {
            toast.error(errorMessage);
         }
      } finally {
         setLoading(false);
      }
   }, [pagination.currentPage, pagination.pageSize, filters]);

   // Retry fetch with exponential backoff
   const retryFetch = useCallback(
      async (retryCount = 0) => {
         const maxRetries = 3;
         const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

         try {
            await fetchRequests();
            setError(null);
         } catch (fetchError) {
            console.error("Retry fetch error:", fetchError);
            if (retryCount < maxRetries) {
               setTimeout(() => retryFetch(retryCount + 1), delay);
            } else {
               setError(
                  "Failed to load service requests after multiple attempts"
               );
            }
         }
      },
      [fetchRequests]
   );

   useEffect(() => {
      if (user?._id) {
         fetchRequests();
      }
   }, [fetchRequests, user]);

   // Handle request details
   const handleViewDetails = async (requestId) => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests/${requestId}`,
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000,
            }
         );

         if (response.data.success) {
            setSelectedRequest(response.data.data);
            setShowDetailsModal(true);
         } else {
            throw new Error(
               response.data.message || "Failed to fetch request details"
            );
         }
      } catch (error) {
         console.error("Error fetching request details:", error);
         toast.error(
            error.response?.data?.message || "Failed to fetch request details"
         );
      } finally {
         setActionLoading(false);
      }
   };

   // Handle quotation actions
   const handleQuotationAction = async (quotationId, action, message = "") => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem("accessToken");
         const response = await axios.patch(
            `${BACKEND_URL}/api/v1/job-requests/${selectedRequest._id}/quotations/${quotationId}`,
            {
               status: action,
               clientMessage: message,
            },
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000,
            }
         );

         if (response.data.success) {
            toast.success(`Quotation ${action} successfully`);
            handleViewDetails(selectedRequest._id); // Refresh details
            fetchRequests(); // Refresh list
         } else {
            throw new Error(
               response.data.message || `Failed to ${action} quotation`
            );
         }
      } catch (error) {
         console.error("Error updating quotation:", error);
         toast.error(
            error.response?.data?.message || `Failed to ${action} quotation`
         );
      } finally {
         setActionLoading(false);
      }
   };

   // Handle negotiation
   const handleNegotiation = async () => {
      try {
         setActionLoading(true);
         const accessToken = localStorage.getItem("accessToken");

         if (!negotiationForm.message.trim()) {
            toast.error("Message is required for negotiation");
            return;
         }

         const response = await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedRequest._id}/quotations/${selectedQuotation._id}/negotiate`,
            negotiationForm,
            {
               headers: { Authorization: `Bearer ${accessToken}` },
               timeout: 5000,
            }
         );
         if (response.data.success) {
            toast.success("Negotiation message sent successfully");
            setShowNegotiationModal(false);
            setNegotiationForm({
               message: "",
               proposedAmount: "",
               counterOffer: "",
            });
            clearDraft(); // Clear the saved draft
            handleViewDetails(selectedRequest._id); // Refresh details
         } else {
            throw new Error(
               response.data.message || "Failed to send negotiation"
            );
         }
      } catch (error) {
         console.error("Error sending negotiation:", error);
         toast.error(
            error.response?.data?.message || "Failed to send negotiation"
         );
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
         const draft = localStorage.getItem(
            `negotiation-draft-${selectedQuotation._id}`
         );
         if (draft) {
            try {
               const draftData = JSON.parse(draft);
               setNegotiationForm(draftData);
            } catch (error) {
               console.error("Error loading draft:", error);
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

   // Format currency
   const formatCurrency = (amount, currency = "USD") => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: currency,
      }).format(amount);
   };

   // Format date
   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   // Keyboard shortcuts
   useEffect(() => {
      const handleKeyDown = (event) => {
         // Only handle shortcuts when modals are not open
         if (showDetailsModal || showNegotiationModal) return;

         if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
               case "r":
                  event.preventDefault();
                  fetchRequests();
                  break;
               case "e":
                  event.preventDefault();
                  if (requests.length > 0) {
                     handleExportRequests();
                  }
                  break;
               case "f": {
                  event.preventDefault();
                  // Focus on search input
                  const searchInput = document.querySelector(
                     'input[placeholder="Search requests..."]'
                  );
                  if (searchInput) {
                     searchInput.focus();
                  }
                  break;
               }
               default:
                  break;
            }
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [
      showDetailsModal,
      showNegotiationModal,
      requests.length,
      handleExportRequests,
      fetchRequests,
   ]);

   // Real-time updates for quotations (polling)
   useEffect(() => {
      if (!user?._id || !selectedRequest) return;

      const pollForUpdates = setInterval(async () => {
         try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(
               `${BACKEND_URL}/api/v1/job-requests/${selectedRequest._id}`,
               {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  timeout: 5000,
               }
            );

            if (response.data.success) {
               const updatedRequest = response.data.data;

               // Check for new quotations
               const currentQuotationCount =
                  selectedRequest.quotationHistory?.length || 0;
               const newQuotationCount =
                  updatedRequest.quotationHistory?.length || 0;

               if (newQuotationCount > currentQuotationCount) {
                  toast.success("New quotation received!");
                  setSelectedRequest(updatedRequest);
               }

               // Check for quotation status updates
               const hasStatusUpdate = updatedRequest.quotationHistory?.some(
                  (newQuot, index) => {
                     const oldQuot = selectedRequest.quotationHistory?.[index];
                     return oldQuot && oldQuot.status !== newQuot.status;
                  }
               );

               if (hasStatusUpdate) {
                  toast.info("Quotation status updated");
                  setSelectedRequest(updatedRequest);
               }
            }
         } catch (error) {
            // Silently fail for polling errors to avoid spam
            console.debug("Polling error:", error);
         }
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollForUpdates);
   }, [user?._id, selectedRequest]);

   // Add online/offline detection
   const [, setIsOnline] = useState(navigator.onLine);

   useEffect(() => {
      const handleOnline = () => {
         fetchRequests(); // Refresh data when back online
      };

      const handleOffline = () => {
         setIsOnline(false);
         toast.error("Connection lost");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
         window.removeEventListener("online", handleOnline);
         window.removeEventListener("offline", handleOffline);
      };
   }, [fetchRequests]);

   if (loading) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
               <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
               <p className="text-gray-600">Loading your service requests...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
         {" "}
         {/* Header */}
         <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center py-6">
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2">
                        <Building2 className="h-8 w-8 text-[#004aad]" />
                        <h1 className="text-3xl font-bold text-[#004aad]">
                           My Service Requests
                        </h1>
                     </div>
                     <Badge variant="secondary" className="text-sm">
                        {stats.total} Total Requests
                     </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                     <Button
                        onClick={handleExportRequests}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading || requests.length === 0}
                     >
                        {actionLoading ? (
                           <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                           <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        Export
                     </Button>
                     <Button
                        onClick={fetchRequests}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                     >
                        <RefreshCw
                           className={`h-4 w-4 mr-2 ${
                              actionLoading ? "animate-spin" : ""
                           }`}
                        />
                        Refresh
                     </Button>
                     <Button
                        className="bg-[#004aad] hover:bg-blue-700"
                        disabled={actionLoading}
                     >
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                     </Button>
                  </div>
               </div>
            </div>
         </header>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {" "}
            {/* Error Display */}
            {error && (
               <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                     <span>{error}</span>
                     <Button
                        onClick={() => retryFetch(0)}
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                     >
                        {actionLoading ? (
                           <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                           "Retry"
                        )}
                     </Button>
                  </AlertDescription>
               </Alert>
            )}{" "}
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
               {Object.entries(stats).map(([key, value]) => {
                  let config, displayLabel;

                  // Map stat keys to appropriate status configs
                  switch (key) {
                     case "total":
                        config = {
                           label: "Total",
                           color: "bg-blue-100 text-blue-800",
                           icon: FileText,
                        };
                        displayLabel = "Total";
                        break;
                     case "open":
                        config = STATUS_CONFIG.open;
                        displayLabel = "Open";
                        break;
                     case "quoted":
                        config = STATUS_CONFIG.quoted;
                        displayLabel = "Quoted";
                        break;
                     case "inProgress":
                        config = STATUS_CONFIG.in_progress;
                        displayLabel = "In Progress";
                        break;
                     case "completed":
                        config = STATUS_CONFIG.completed;
                        displayLabel = "Completed";
                        break;
                     case "cancelled":
                        config = STATUS_CONFIG.cancelled;
                        displayLabel = "Cancelled";
                        break;
                     default:
                        config = {
                           label: key,
                           color: "bg-gray-100 text-gray-800",
                           icon: Activity,
                        };
                        displayLabel = key;
                  }

                  const Icon = config.icon;

                  return (
                     <Card
                        key={key}
                        className="hover:shadow-md transition-shadow"
                     >
                        <CardContent className="p-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-medium text-gray-600 capitalize">
                                    {displayLabel}
                                 </p>
                                 <p className="text-2xl font-bold text-gray-900">
                                    {value}
                                 </p>
                              </div>
                              <Icon className="h-8 w-8 text-blue-600" />
                           </div>
                        </CardContent>
                     </Card>
                  );
               })}
            </div>
            {/* Filters */}
            <Card className="mb-6">
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                     {" "}
                     {/* Search */}
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                           placeholder="Search requests... (Ctrl+F)"
                           className="pl-10 pr-16"
                           value={filters.search}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 search: e.target.value,
                              }))
                           }
                        />
                        <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                           ⌘F
                        </kbd>
                     </div>
                     {/* Status Filter */}
                     <Select
                        value={filters.status}
                        onValueChange={(value) =>
                           setFilters((prev) => ({ ...prev, status: value }))
                        }
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Status</SelectItem>
                           {Object.entries(STATUS_CONFIG).map(
                              ([key, config]) => (
                                 <SelectItem key={key} value={key}>
                                    {config.label}
                                 </SelectItem>
                              )
                           )}
                        </SelectContent>
                     </Select>
                     {/* Date From */}
                     <div>
                        <Input
                           type="date"
                           value={filters.dateFrom}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 dateFrom: e.target.value,
                              }))
                           }
                        />
                     </div>
                     {/* Date To */}
                     <div>
                        <Input
                           type="date"
                           value={filters.dateTo}
                           onChange={(e) =>
                              setFilters((prev) => ({
                                 ...prev,
                                 dateTo: e.target.value,
                              }))
                           }
                        />
                     </div>
                     {/* Clear Filters */}
                     <Button
                        variant="outline"
                        onClick={() =>
                           setFilters({
                              search: "",
                              status: "all",
                              dateFrom: "",
                              dateTo: "",
                              location: "",
                           })
                        }
                     >
                        Clear All
                     </Button>
                  </div>
               </CardContent>
            </Card>
            {/* Request Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {requests.map((request) => {
                  const statusConfig =
                     STATUS_CONFIG[request.status] || STATUS_CONFIG.open;
                  const StatusIcon = statusConfig.icon;
                  const hasQuotations =
                     request.quotationHistory &&
                     request.quotationHistory.length > 0;

                  return (
                     <Card
                        key={request._id}
                        className="hover:shadow-lg transition-shadow duration-200"
                     >
                        <CardContent className="p-6">
                           {/* Header */}
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                       {request.title}
                                    </h3>
                                    {request.isPremium && (
                                       <Badge className="bg-yellow-100 text-yellow-800">
                                          <Star className="h-3 w-3 mr-1" />
                                          Premium
                                       </Badge>
                                    )}
                                 </div>
                                 <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {request.description}
                                 </p>
                              </div>
                              <Badge className={`${statusConfig.color} border`}>
                                 <StatusIcon className="h-3 w-3 mr-1" />
                                 {statusConfig.label}
                              </Badge>
                           </div>
                           {/* Request Info */}
                           <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                 <MapPin className="h-4 w-4 mr-2" />
                                 <span>
                                    {request.location}, {request.region}
                                 </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                 <CalendarIcon className="h-4 w-4 mr-2" />
                                 <span>
                                    Created: {formatDate(request.createdAt)}
                                 </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                 <Clock className="h-4 w-4 mr-2" />
                                 <span>
                                    {request.projectDuration} day
                                    {request.projectDuration > 1 ? "s" : ""}
                                 </span>
                              </div>
                           </div>
                           {/* Cost */}
                           <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">
                                 Estimated Cost:
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                 {formatCurrency(
                                    request.estimatedTotal,
                                    request.costDetails?.currency
                                 )}
                              </span>
                           </div>
                           {/* Quotations Summary */}
                           {hasQuotations && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-900">
                                       {request.quotationHistory.length}{" "}
                                       Quotation
                                       {request.quotationHistory.length > 1
                                          ? "s"
                                          : ""}
                                    </span>
                                    <Quote className="h-4 w-4 text-blue-600" />
                                 </div>
                                 {request.quotationHistory.length > 0 && (
                                    <div className="text-xs text-blue-700 mt-1">
                                       Latest:{" "}
                                       {formatCurrency(
                                          request.quotationHistory[
                                             request.quotationHistory.length - 1
                                          ]?.quotedAmount
                                       )}
                                    </div>
                                 )}
                              </div>
                           )}
                           {/* Services */}
                           <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                 Required Services
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                 {request.requiredServices
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
                                 {request.requiredServices?.length > 3 && (
                                    <Badge
                                       variant="secondary"
                                       className="text-xs"
                                    >
                                       +{request.requiredServices.length - 3}{" "}
                                       more
                                    </Badge>
                                 )}
                              </div>
                           </div>{" "}
                           {/* Actions */}
                           <div className="flex space-x-2 pt-4 border-t border-gray-100">
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="flex-1"
                                 onClick={() => handleViewDetails(request._id)}
                                 disabled={actionLoading}
                              >
                                 {actionLoading ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                 ) : (
                                    <Eye className="h-4 w-4 mr-1" />
                                 )}
                                 View Details
                              </Button>

                              {hasQuotations && (
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() =>
                                       handleViewDetails(request._id)
                                    }
                                    disabled={actionLoading}
                                 >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Quotations (
                                    {request.quotationHistory.length})
                                 </Button>
                              )}
                           </div>
                        </CardContent>
                     </Card>
                  );
               })}
            </div>
            {/* No Results */}
            {requests.length === 0 && (
               <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                     No service requests found
                  </h3>
                  <p className="text-gray-500 mb-4">
                     You haven't created any service requests yet.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                     <FileText className="h-4 w-4 mr-2" />
                     Create Your First Request
                  </Button>
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
                        pagination.totalRequests
                     )}{" "}
                     of {pagination.totalRequests} results
                  </div>
                  <div className="flex space-x-2">
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === 1}
                        onClick={() =>
                           setPagination((prev) => ({
                              ...prev,
                              currentPage: prev.currentPage - 1,
                           }))
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
                           onClick={() =>
                              setPagination((prev) => ({
                                 ...prev,
                                 currentPage: page,
                              }))
                           }
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
                           setPagination((prev) => ({
                              ...prev,
                              currentPage: prev.currentPage + 1,
                           }))
                        }
                     >
                        Next
                     </Button>
                  </div>
               </div>
            )}
         </div>
         {/* Request Details Modal */}
         <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="flex items-center justify-between pr-5">
                     <span>Request Details: {selectedRequest?.title}</span>
                     <Badge
                        className={
                           STATUS_CONFIG[selectedRequest?.status]?.color
                        }
                     >
                        {STATUS_CONFIG[selectedRequest?.status]?.label}
                     </Badge>
                  </DialogTitle>
                  <DialogDescription>
                     Manage your service request and review quotations
                  </DialogDescription>
               </DialogHeader>

               {selectedRequest && (
                  <Tabs defaultValue="overview" className="w-full">
                     <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        {selectedRequest.type === "provider" && (
                           <>
                              <TabsTrigger value="quotations">
                                 Quotations (
                                 {selectedRequest.quotationHistory?.length || 0}
                                 )
                              </TabsTrigger>
                              <TabsTrigger value="cost-breakdown">
                                 Cost Details
                              </TabsTrigger>
                           </>
                        )}
                        <TabsTrigger value="communication">
                           Communication
                        </TabsTrigger>
                     </TabsList>

                     {/* Overview Tab */}
                     <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           {/* Basic Info */}
                           <Card>
                              <CardHeader>
                                 <CardTitle>Request Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                 <div>
                                    <Label>Title</Label>
                                    <p className="font-medium">
                                       {selectedRequest.title}
                                    </p>
                                 </div>
                                 <div>
                                    <Label>Description</Label>
                                    <p className="text-gray-600">
                                       {selectedRequest.description}
                                    </p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <Label>Location</Label>
                                       <p className="font-medium">
                                          {selectedRequest.location}
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Region</Label>
                                       <p className="font-medium">
                                          {selectedRequest.region}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <Label>Duration</Label>
                                       <p className="font-medium">
                                          {selectedRequest.projectDuration} days
                                       </p>
                                    </div>
                                    <div>
                                       <Label>Inspectors</Label>
                                       <p className="font-medium">
                                          {selectedRequest.numInspectors}
                                       </p>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>

                           {/* Provider Info */}
                           {selectedRequest.assignedProviderId && (
                              <Card>
                                 <CardHeader>
                                    <CardTitle>Assigned Provider</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                    <div className="flex items-center space-x-4">
                                       <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                          <Building2 className="w-6 h-6 text-white" />
                                       </div>
                                       <div>
                                          <p className="font-medium">
                                             {selectedRequest.providerName}
                                          </p>
                                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                                             <Award className="w-4 h-4" />
                                             <span>Verified Provider</span>
                                          </div>
                                       </div>
                                    </div>
                                 </CardContent>
                              </Card>
                           )}
                        </div>

                        {/* Services */}
                        <Card>
                           <CardHeader>
                              <CardTitle>Required Services</CardTitle>
                           </CardHeader>
                           <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                 {selectedRequest.requiredServices?.map(
                                    (service) => (
                                       <div
                                          key={service._id}
                                          className="p-3 border rounded-lg"
                                       >
                                          <p className="font-medium text-sm">
                                             {service.name}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                             {service.code}
                                          </p>
                                       </div>
                                    )
                                 )}
                              </div>
                           </CardContent>
                        </Card>
                     </TabsContent>

                     {/* Quotations Tab */}
                     <TabsContent value="quotations" className="space-y-6">
                        {selectedRequest.quotationHistory &&
                        selectedRequest.quotationHistory.length > 0 ? (
                           <div className="space-y-4">
                              {selectedRequest.quotationHistory.map(
                                 (quotation, index) => {
                                    const quotationStatusConfig =
                                       QUOTATION_STATUS[quotation.status] ||
                                       QUOTATION_STATUS.pending;
                                    const StatusIcon =
                                       quotationStatusConfig.icon;

                                    return (
                                       <Card
                                          key={index}
                                          className="border-l-4 border-l-blue-500"
                                       >
                                          <CardContent className="p-6">
                                             <div className="flex items-start justify-between mb-4">
                                                {" "}
                                                <div>
                                                   <div className="flex items-center space-x-2 mb-2">
                                                      <h4 className="text-lg font-semibold text-green-600">
                                                         {formatCurrency(
                                                            quotation.quotedAmount,
                                                            quotation.quotedCurrency
                                                         )}
                                                      </h4>
                                                      <Badge
                                                         className={
                                                            quotationStatusConfig.color
                                                         }
                                                      >
                                                         <StatusIcon className="h-3 w-3 mr-1" />
                                                         {
                                                            quotationStatusConfig.label
                                                         }
                                                      </Badge>
                                                   </div>
                                                   <p className="text-sm text-gray-600">
                                                      Valid until:{" "}
                                                      {quotation.validUntil
                                                         ? formatDate(
                                                              quotation.validUntil
                                                           )
                                                         : "No expiry"}
                                                   </p>
                                                   <p className="text-sm text-gray-600">
                                                      Submitted:{" "}
                                                      {formatDate(
                                                         quotation.quotedAt
                                                      )}
                                                   </p>
                                                </div>
                                                {/* Provider Info */}
                                                <div className="text-right">
                                                   <p className="font-medium">
                                                      {
                                                         quotation.providerId
                                                            ?.companyName
                                                      }
                                                   </p>
                                                   <p className="text-sm text-gray-600">
                                                      {
                                                         quotation.providerId
                                                            ?.email
                                                      }
                                                   </p>
                                                </div>
                                             </div>{" "}
                                             {quotation.quotationDetails && (
                                                <div className="mb-4">
                                                   <Label>Description</Label>
                                                   <p className="text-gray-700">
                                                      {
                                                         quotation.quotationDetails
                                                      }
                                                   </p>
                                                </div>
                                             )}
                                             {quotation.terms && (
                                                <div className="mb-4">
                                                   <Label>
                                                      Terms & Conditions
                                                   </Label>
                                                   <p className="text-gray-700 text-sm">
                                                      {quotation.terms}
                                                   </p>
                                                </div>
                                             )}{" "}
                                             {/* Quotation Actions */}
                                             {quotation.status ===
                                                "pending" && (
                                                <div className="flex space-x-3 mt-4">
                                                   <Button
                                                      onClick={() =>
                                                         handleQuotationAction(
                                                            quotation._id,
                                                            "accepted"
                                                         )
                                                      }
                                                      className="bg-green-600 hover:bg-green-700"
                                                      disabled={actionLoading}
                                                   >
                                                      {actionLoading ? (
                                                         <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                      ) : (
                                                         <ThumbsUp className="h-4 w-4 mr-2" />
                                                      )}
                                                      Accept
                                                   </Button>
                                                   <Button
                                                      variant="outline"
                                                      onClick={() => {
                                                         setSelectedQuotation(
                                                            quotation
                                                         );
                                                         setShowNegotiationModal(
                                                            true
                                                         );
                                                      }}
                                                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                                      disabled={actionLoading}
                                                   >
                                                      <Handshake className="h-4 w-4 mr-2" />
                                                      Negotiate
                                                   </Button>
                                                   <Button
                                                      variant="outline"
                                                      onClick={() =>
                                                         handleQuotationAction(
                                                            quotation._id,
                                                            "rejected"
                                                         )
                                                      }
                                                      className="border-red-500 text-red-600 hover:bg-red-50"
                                                      disabled={actionLoading}
                                                   >
                                                      {actionLoading ? (
                                                         <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                      ) : (
                                                         <ThumbsDown className="h-4 w-4 mr-2" />
                                                      )}
                                                      Reject
                                                   </Button>
                                                </div>
                                             )}
                                             {/* Negotiation Messages */}
                                             {quotation.negotiations &&
                                                quotation.negotiations.length >
                                                   0 && (
                                                   <div className="mt-4 border-t pt-4">
                                                      <Label>
                                                         Negotiation History
                                                      </Label>
                                                      <div className="space-y-2 mt-2">
                                                         {quotation.negotiations.map(
                                                            (
                                                               negotiation,
                                                               negIndex
                                                            ) => (
                                                               <div
                                                                  key={negIndex}
                                                                  className="p-3 bg-gray-50 rounded-lg"
                                                               >
                                                                  <div className="flex justify-between items-start mb-2">
                                                                     <span className="font-medium text-sm">
                                                                        {negotiation.fromClient
                                                                           ? "You"
                                                                           : "Provider"}
                                                                     </span>{" "}
                                                                     <span className="text-xs text-gray-500">
                                                                        {formatDate(
                                                                           negotiation.createdAt
                                                                        )}
                                                                     </span>
                                                                  </div>
                                                                  <p className="text-sm">
                                                                     {
                                                                        negotiation.message
                                                                     }
                                                                  </p>
                                                                  {negotiation.proposedAmount && (
                                                                     <p className="text-sm font-medium text-green-600 mt-1">
                                                                        Proposed:{" "}
                                                                        {formatCurrency(
                                                                           negotiation.proposedAmount
                                                                        )}
                                                                     </p>
                                                                  )}
                                                               </div>
                                                            )
                                                         )}
                                                      </div>
                                                   </div>
                                                )}
                                          </CardContent>
                                       </Card>
                                    );
                                 }
                              )}
                           </div>
                        ) : (
                           <div className="text-center py-8">
                              <Quote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                 No quotations yet
                              </h3>
                              <p className="text-gray-500">
                                 Service providers haven't submitted any
                                 quotations for this request.
                              </p>
                           </div>
                        )}
                     </TabsContent>

                     {/* Cost Breakdown Tab */}
                     <TabsContent value="cost-breakdown">
                        {selectedRequest.costDetails ? (
                           <Card>
                              <CardHeader>
                                 <CardTitle>Detailed Cost Breakdown</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-6">
                                 {/* Services */}
                                 <div>
                                    <h4 className="font-semibold mb-3">
                                       Services
                                    </h4>
                                    <div className="space-y-2">
                                       {selectedRequest.costDetails.services?.map(
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
                                                   </p>
                                                </div>
                                                <div className="text-right">
                                                   <p className="font-medium">
                                                      {formatCurrency(
                                                         service?.baseCost
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
                                 {selectedRequest.costDetails.additional
                                    ?.length > 0 && (
                                    <div>
                                       <h4 className="font-semibold mb-3">
                                          Additional Costs
                                       </h4>
                                       <div className="space-y-2">
                                          {selectedRequest.costDetails.additional.map(
                                             (cost, index) => (
                                                <div
                                                   key={index}
                                                   className="flex justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                   <span>{cost.name}</span>
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
                                             selectedRequest.costDetails?.totals
                                                ?.baseCost
                                          )}
                                       </span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span>Tax:</span>
                                       <span>
                                          {formatCurrency(
                                             selectedRequest.costDetails?.totals
                                                ?.tax
                                          )}
                                       </span>
                                    </div>
                                    {selectedRequest.costDetails?.totals
                                       ?.additional > 0 && (
                                       <div className="flex justify-between">
                                          <span>Additional:</span>
                                          <span>
                                             {formatCurrency(
                                                selectedRequest.costDetails
                                                   .totals.additional
                                             )}
                                          </span>
                                       </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                       <span>Total:</span>
                                       <span className="text-green-600">
                                          {formatCurrency(
                                             selectedRequest.costDetails?.totals
                                                ?.grandTotal
                                          )}
                                       </span>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>
                        ) : (
                           <div className="text-center py-8">
                              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                 No cost details available
                              </h3>
                              <p className="text-gray-500">
                                 Cost breakdown will appear when the request is
                                 processed.
                              </p>
                           </div>
                        )}
                     </TabsContent>

                     {/* Communication Tab */}
                     <TabsContent value="communication" className="space-y-6">
                        {/* Add Note Section */}
                        <Card>
                           <CardHeader>
                              <CardTitle className="flex items-center">
                                 <MessageCircle className="h-5 w-5 mr-2" />
                                 Add Communication Note
                              </CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-4">
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
                                 <Label htmlFor="noteContent">Message *</Label>
                                 <Textarea
                                    id="noteContent"
                                    value={noteForm.content}
                                    onChange={(e) =>
                                       setNoteForm((prev) => ({
                                          ...prev,
                                          content: e.target.value,
                                       }))
                                    }
                                    placeholder="Enter your message or note..."
                                    rows={4}
                                    className="resize-none"
                                 />
                                 <p className="text-xs text-gray-500 mt-1">
                                    This message will be added to the
                                    communication history for this request.
                                 </p>
                              </div>

                              <div className="flex items-center space-x-2 hidden">
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
                                    className="rounded border-gray-300"
                                 />
                                 <Label
                                    htmlFor="isInternal"
                                    className="text-sm"
                                 >
                                    Internal note (visible only to you and
                                    service providers)
                                 </Label>
                              </div>

                              <Button
                                 onClick={handleAddNote}
                                 disabled={
                                    !noteForm.content.trim() || actionLoading
                                 }
                                 className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                 {actionLoading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                 ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                 )}
                                 Add Note
                              </Button>
                           </CardContent>
                        </Card>

                        {/* Existing Notes Section */}
                        <Card>
                           <CardHeader>
                              <CardTitle>Communication History</CardTitle>
                           </CardHeader>
                           <CardContent>
                              {selectedRequest.internalNotes &&
                              selectedRequest.internalNotes.length > 0 ? (
                                 <div className="space-y-4">
                                    {selectedRequest.internalNotes
                                       .sort(
                                          (a, b) =>
                                             new Date(b.addedAt) -
                                             new Date(a.addedAt)
                                       ) // Sort by newest first
                                       .map((note, index) => {
                                          const noteTypeConfig =
                                             NOTE_TYPES.find(
                                                (type) =>
                                                   type.value === note.noteType
                                             ) || NOTE_TYPES[0];
                                          const NoteIcon = noteTypeConfig.icon;

                                          return (
                                             <div
                                                key={index}
                                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                             >
                                                <div className="flex justify-between items-start mb-3">
                                                   <div className="flex items-center space-x-2">
                                                      <Badge
                                                         variant="outline"
                                                         className="flex items-center"
                                                      >
                                                         <NoteIcon className="h-3 w-3 mr-1" />
                                                         {noteTypeConfig.label}
                                                      </Badge>
                                                      {note.isInternal && (
                                                         <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                         >
                                                            Internal
                                                         </Badge>
                                                      )}
                                                   </div>
                                                   <div className="text-right">
                                                      <span className="text-sm text-gray-500">
                                                         {formatDate(
                                                            note.addedAt
                                                         )}
                                                      </span>
                                                      <p className="text-xs text-gray-400">
                                                         {new Date(
                                                            note.addedAt
                                                         ).toLocaleTimeString(
                                                            "en-US",
                                                            {
                                                               hour: "2-digit",
                                                               minute:
                                                                  "2-digit",
                                                            }
                                                         )}
                                                      </p>
                                                   </div>
                                                </div>

                                                <div className="mb-3">
                                                   <p className="text-gray-700 whitespace-pre-wrap">
                                                      {note.note}
                                                   </p>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                   <div className="flex items-center space-x-2 text-gray-500">
                                                      <User className="h-4 w-4" />
                                                      <span>
                                                         By{" "}
                                                         {note.addedBy?.name ||
                                                            "You"}
                                                      </span>
                                                   </div>

                                                   {note.addedBy?._id ===
                                                      user?._id && (
                                                      <Badge
                                                         variant="outline"
                                                         className="text-xs"
                                                      >
                                                         Your Note
                                                      </Badge>
                                                   )}
                                                </div>
                                             </div>
                                          );
                                       })}
                                 </div>
                              ) : (
                                 <div className="text-center py-8">
                                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                       No communication yet
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                       Start the conversation by adding your
                                       first note above.
                                    </p>
                                 </div>
                              )}
                           </CardContent>
                        </Card>
                     </TabsContent>
                  </Tabs>
               )}
            </DialogContent>
         </Dialog>
         {/* Negotiation Modal */}
         <Dialog
            open={showNegotiationModal}
            onOpenChange={setShowNegotiationModal}
         >
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>Negotiate Quotation</DialogTitle>
                  <DialogDescription>
                     Send a counter-offer or message to the service provider
                  </DialogDescription>
               </DialogHeader>

               {selectedQuotation && (
                  <div className="space-y-6">
                     {/* Current Quotation */}
                     <Card className="bg-blue-50">
                        <CardContent className="p-4">
                           <div className="flex justify-between items-center">
                              {" "}
                              <div>
                                 <p className="text-sm text-gray-600">
                                    Current Quotation
                                 </p>
                                 <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(
                                       selectedQuotation.quotedAmount,
                                       selectedQuotation.quotedCurrency
                                    )}
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm text-gray-600">From</p>
                                 <p className="font-medium">
                                    {selectedQuotation.providerId?.companyName}
                                 </p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                     {/* Negotiation Form */}
                     <div className="space-y-4">
                        <div>
                           <Label htmlFor="proposedAmount">
                              Your Counter Offer (Optional)
                           </Label>
                           <Input
                              id="proposedAmount"
                              type="number"
                              placeholder="Enter your proposed amount"
                              value={negotiationForm.proposedAmount}
                              onChange={(e) =>
                                 setNegotiationForm((prev) => ({
                                    ...prev,
                                    proposedAmount: e.target.value,
                                 }))
                              }
                           />
                        </div>{" "}
                        <div>
                           <Label htmlFor="message">Message *</Label>
                           <Textarea
                              id="message"
                              placeholder="Explain your counter-offer or ask questions about the quotation..."
                              value={negotiationForm.message}
                              onChange={(e) =>
                                 setNegotiationForm((prev) => ({
                                    ...prev,
                                    message: e.target.value,
                                 }))
                              }
                              rows={4}
                              required
                              aria-describedby="message-help"
                           />
                           <p
                              id="message-help"
                              className="text-xs text-gray-500 mt-1"
                           >
                              Your message will be sent to the service provider
                              for review.
                           </p>
                        </div>
                        <div>
                           <Label htmlFor="counterOffer">
                              Additional Terms (Optional)
                           </Label>
                           <Textarea
                              id="counterOffer"
                              placeholder="Any additional terms or conditions you'd like to propose..."
                              value={negotiationForm.counterOffer}
                              onChange={(e) =>
                                 setNegotiationForm((prev) => ({
                                    ...prev,
                                    counterOffer: e.target.value,
                                 }))
                              }
                              rows={3}
                           />
                        </div>
                     </div>{" "}
                     {/* Actions */}
                     <div className="flex space-x-3">
                        <Button
                           onClick={handleNegotiation}
                           disabled={
                              !negotiationForm.message.trim() || actionLoading
                           }
                           className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                           {actionLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                           ) : (
                              <Send className="h-4 w-4 mr-2" />
                           )}
                           Send Negotiation
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
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
};

export default ClientServiceRequest;
