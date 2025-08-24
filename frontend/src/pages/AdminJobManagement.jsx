import React, { useState, useEffect, useCallback } from "react";
import {
   Building,
   Search,
   Filter,
   Eye,
   Calendar,
   DollarSign,
   Users,
   MapPin,
   FileText,
   MessageSquare,
   Quote,
   AlertCircle,
   CheckCircle,
   Clock,
   TrendingUp,
   Activity,
   Star,
   User,
   Mail,
   Phone,
   Award,
   Download,
   Upload,
   Edit,
   RefreshCw,
   ChevronDown,
   ChevronUp,
   X,
   ExternalLink,
   Paperclip,
   Tag,
   CalendarDays,
   Shield,
   Crown,
   ThumbsUp,
   ThumbsDown,
   Handshake,
   CheckCheck,
   XCircle,
   MoreHorizontal,
   ChevronLeft,
   ChevronRight,
   Settings,
   BarChart3,
   Loader2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import axios from "axios";
import { toast } from "react-hot-toast";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const STATUS_OPTIONS = [
   {
      value: "draft",
      label: "Draft",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Edit,
   },
   {
      value: "open",
      label: "Open",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
   },
   {
      value: "quoted",
      label: "Quoted",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Quote,
   },
   {
      value: "negotiating",
      label: "Negotiating",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Handshake,
   },
   {
      value: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: ThumbsUp,
   },
   {
      value: "in_progress",
      label: "In Progress",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: Activity,
   },
   {
      value: "completed",
      label: "Completed",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: CheckCheck,
   },
   {
      value: "delivered",
      label: "Delivered",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: Upload,
   },
   {
      value: "closed",
      label: "Closed",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
   },
   {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
   },
   {
      value: "rejected",
      label: "Rejected",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: ThumbsDown,
   },
   {
      value: "disputed",
      label: "Disputed",
      color: "bg-pink-100 text-pink-800 border-pink-200",
      icon: AlertCircle,
   },
   {
      value: "on_hold",
      label: "On Hold",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Clock,
   },
];

const QUOTATION_STATUS = {
   pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
   },
   accepted: {
      label: "Accepted",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
   },
   rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
   },
   negotiating: {
      label: "Negotiating",
      color: "bg-blue-100 text-blue-800",
      icon: MessageSquare,
   },
};

const AdminJobManagement = () => {
   const [jobRequests, setJobRequests] = useState([]);
   const [stats, setStats] = useState({});
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [filters, setFilters] = useState({
      status: "all",
      location: "all",
      isPremium: "all",
      dateFrom: "",
      dateTo: "",
   });
   const [pagination, setPagination] = useState({
      currentPage: 1,
      pageSize: 15,
      totalPages: 1,
      totalJobs: 0,
   });
   const [selectedJob, setSelectedJob] = useState(null);
   const [showJobModal, setShowJobModal] = useState(false);
   const [expandedRows, setExpandedRows] = useState({});

   // Create axios instance with auth header
   const createAxiosInstance = () => {
      const token = localStorage.getItem("accessToken");
      return axios.create({
         baseURL: BACKEND_URL,
         headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
         },
      });
   };

   // Fetch job requests
   const fetchJobRequests = useCallback(async () => {
      try {
         setLoading(true);
         const api = createAxiosInstance();
         const params = new URLSearchParams({
            page: pagination.currentPage,
            limit: pagination.pageSize,
            search: searchTerm,
            sortBy: "createdAt",
            sortOrder: "desc",
            ...Object.fromEntries(
               Object.entries(filters).filter(
                  ([, v]) => v !== "all" && v !== ""
               )
            ),
         });

         const response = await api.get(`/api/v1/job-requests?${params}`);

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

   // Fetch job statistics
   const fetchStats = useCallback(async () => {
      try {
         const api = createAxiosInstance();
         const response = await api.get("/api/v1/job-requests/stats");
         if (response.data.success) {
            setStats(response.data.data.overview || {});
         }
      } catch (error) {
         console.error("Error fetching stats:", error);
      }
   }, []);

   useEffect(() => {
      fetchJobRequests();
      fetchStats();
   }, [fetchJobRequests, fetchStats]);

   // Get job details
   const handleViewDetails = async (jobId) => {
      try {
         const api = createAxiosInstance();
         const response = await api.get(`/api/v1/job-requests/${jobId}`);

         if (response.data.success) {
            setSelectedJob(response.data.data);
            setShowJobModal(true);
         }
      } catch (error) {
         console.error("Error fetching job details:", error);
         toast.error("Failed to fetch job details");
      }
   };

   // Update job status
   const handleStatusUpdate = async (jobId, newStatus, reason = "") => {
      try {
         const api = createAxiosInstance();
         const response = await api.patch(
            `/api/v1/job-requests/${jobId}/status`,
            {
               status: newStatus,
               reason,
            }
         );

         if (response.data.success) {
            toast.success("Status updated successfully");
            fetchJobRequests();
            fetchStats();
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

   // Generate report
   const handleGenerateReport = async (jobId) => {
      try {
         const api = createAxiosInstance();
         const response = await api.get(`/api/v1/job-requests/${jobId}/report`);

         if (response.data.success) {
            // Create and download the report file
            const reportData = JSON.stringify(response.data.data, null, 2);
            const blob = new Blob([reportData], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `job-report-${jobId}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Report downloaded successfully");
         }
      } catch (error) {
         console.error("Error generating report:", error);
         toast.error(
            error.response?.data?.message || "Failed to generate report"
         );
      }
   };

   // Helper functions
   const getStatusConfig = (status) => {
      return (
         STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
      );
   };

 const formatCurrency = (amount, currency = "USD") => {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
};


   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   const toggleRowExpansion = (jobId) => {
      setExpandedRows((prev) => ({
         ...prev,
         [jobId]: !prev[jobId],
      }));
   };

   const handleFilterChange = (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
   };

   const handlePageChange = (newPage) => {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
   };

   if (loading && jobRequests.length === 0) {
      return (
         <>
            <NavbarSection />
            <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5cb5]"></div>
            </div>
         </>
      );
   }

   return (
      <>
         <NavbarSection />
         <div className="min-h-screen bg-gray-50 mt-3">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
                     {/* Left Section */}
                     <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2">
                        <div className="flex items-center space-x-2">
                           <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                              Job Management
                           </h1>
                        </div>

                        <span className="bg-blue-100 text-[#004aad] text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full self-start sm:self-center">
                           {pagination.totalJobs} Total Jobs
                        </span>
                     </div>

                     {/* Right Section */}
                     <div className="flex items-center">
                        <Button
                           onClick={fetchJobRequests}
                           variant="outline"
                           size="sm"
                           className="w-full sm:w-auto"
                        >
                           <RefreshCw className="h-4 w-4 mr-2" />
                           Refresh
                        </Button>
                     </div>
                  </div>
               </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               {/* Statistics Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-sm font-medium text-gray-600">
                                 Total Jobs
                              </p>
                              <p className="text-3xl font-bold text-gray-900">
                                 {stats.totalJobs || 0}
                              </p>
                           </div>
                           <Building className="w-8 h-8 text-blue-600" />
                        </div>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-sm font-medium text-gray-600">
                                 In Progress
                              </p>
                              <p className="text-3xl font-bold text-orange-600">
                                 {stats.inProgressJobs || 0}
                              </p>
                           </div>
                           <Activity className="w-8 h-8 text-orange-600" />
                        </div>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-sm font-medium text-gray-600">
                                 Completed
                              </p>
                              <p className="text-3xl font-bold text-green-600">
                                 {stats.completedJobs || 0}
                              </p>
                           </div>
                           <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-sm font-medium text-gray-600">
                                 Total Value
                              </p>
                              <p className="text-3xl font-bold text-purple-600">
                                 {formatCurrency(stats.totalValue || 0)}
                              </p>
                           </div>
                           <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* Filters */}
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
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Status" />
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
                           value={filters.location}
                           onValueChange={(value) =>
                              handleFilterChange("location", value)
                           }
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Location" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Location</SelectItem>
                              {Location.map((location) => (
                                 <SelectItem key={location.id} value={location.country}>
                                    {location.country}
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
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Types" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="true">Premium Only</SelectItem>
                              <SelectItem value="false">
                                 Standard Only
                              </SelectItem>
                           </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        <Button
                           variant="outline"
                           onClick={() => {
                              setFilters({
                                 status: "all",
                                 region: "all",
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
                     </div>
                  </CardContent>
               </Card>

               {/* Jobs Table */}
               <Card>
                  <CardHeader>
                     <CardTitle>All Job Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {loading ? (
                        <div className="flex justify-center items-center py-8">
                           <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                     ) : (
                        <>
                           <div className="overflow-x-auto">
                              <Table>
                                 <TableHeader>
                                    <TableRow>
                                       <TableHead className="w-10"></TableHead>
                                       <TableHead>Job Details</TableHead>
                                       <TableHead>Client</TableHead>
                                       <TableHead>Status</TableHead>
                                       <TableHead>Value</TableHead>
                                       <TableHead>Progress</TableHead>
                                       <TableHead>Actions</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {jobRequests.map((job) => {
                                       const statusConfig = getStatusConfig(
                                          job.status
                                       );
                                       const StatusIcon = statusConfig.icon;
                                       const isExpanded = expandedRows[job._id];

                                       return (
                                          <React.Fragment key={job._id}>
                                             <TableRow>
                                                <TableCell>
                                                   <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() =>
                                                         toggleRowExpansion(
                                                            job._id
                                                         )
                                                      }
                                                   >
                                                      {isExpanded ? (
                                                         <ChevronUp className="h-4 w-4" />
                                                      ) : (
                                                         <ChevronDown className="h-4 w-4" />
                                                      )}
                                                   </Button>
                                                </TableCell>
                                                <TableCell>
                                                   <div className="space-y-1">
                                                      <div className="flex items-center space-x-2">
                                                         <p className="font-semibold text-gray-900">
                                                            {job.title}
                                                         </p>
                                                         {job.isPremium && (
                                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                               <Star className="h-3 w-3 mr-1" />
                                                               Premium
                                                            </Badge>
                                                         )}
                                                      </div>
                                                      <div className="text-sm text-gray-600">
                                                         <div className="flex items-center space-x-4">
                                                            <span className="flex items-center">
                                                               <MapPin className="h-3 w-3 mr-1" />
                                                               {job.location}
                                                            </span>
                                                            <span className="flex items-center">
                                                               <Calendar className="h-3 w-3 mr-1" />
                                                               {formatDate(
                                                                  job.createdAt
                                                               )}
                                                            </span>
                                                         </div>
                                                      </div>
                                                   </div>
                                                </TableCell>
                                                <TableCell>
                                                   <div className="space-y-1">
                                                      <p className="font-medium text-gray-900">
                                                         {job.clientName}
                                                      </p>
                                                      <p className="text-sm text-gray-600">
                                                         {job.clientEmail}
                                                      </p>
                                                   </div>
                                                </TableCell>
                                                <TableCell>
                                                   <Badge
                                                      className={
                                                         statusConfig.color
                                                      }
                                                   >
                                                      <StatusIcon className="h-3 w-3 mr-1" />
                                                      {statusConfig.label}
                                                   </Badge>
                                                </TableCell>
                                                <TableCell>
                                                   <div className="space-y-1">
                                                      <p className="font-semibold text-green-600">
                                                         {formatCurrency(
                                                            job.estimatedTotal,job.costDetails?.currency
                                                         )}
                                                      </p>
                                                      {job.finalQuotedAmount && (
                                                         <p className="text-sm text-gray-600">
                                                            Final:{" "}
                                                            {formatCurrency(
                                                               job.finalQuotedAmount,selectedJob.costDetails?.currency
                                                            )}
                                                         </p>
                                                      )}
                                                   </div>
                                                </TableCell>
                                                <TableCell>
                                                   <div className="space-y-1">
                                                      {job.quotationHistory
                                                         ?.length > 0 && (
                                                         <div className="flex items-center space-x-1">
                                                            <Quote className="h-3 w-3 text-blue-600" />
                                                            <span className="text-sm text-blue-600">
                                                               {
                                                                  job
                                                                     .quotationHistory
                                                                     .length
                                                               }{" "}
                                                               Quote
                                                               {job
                                                                  .quotationHistory
                                                                  .length > 1
                                                                  ? "s"
                                                                  : ""}
                                                            </span>
                                                         </div>
                                                      )}
                                                      {job.internalNotes
                                                         ?.length > 0 && (
                                                         <div className="flex items-center space-x-1">
                                                            <MessageSquare className="h-3 w-3 text-purple-600" />
                                                            <span className="text-sm text-purple-600">
                                                               {
                                                                  job
                                                                     .internalNotes
                                                                     .length
                                                               }{" "}
                                                               Note
                                                               {job
                                                                  .internalNotes
                                                                  .length > 1
                                                                  ? "s"
                                                                  : ""}
                                                            </span>
                                                         </div>
                                                      )}
                                                   </div>
                                                </TableCell>
                                                <TableCell>
                                                   <DropdownMenu>
                                                      <DropdownMenuTrigger
                                                         asChild
                                                      >
                                                         <Button
                                                            variant="ghost"
                                                            size="sm"
                                                         >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                         </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                         <DropdownMenuItem
                                                            onClick={() =>
                                                               handleViewDetails(
                                                                  job._id
                                                               )
                                                            }
                                                         >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                         </DropdownMenuItem>
                                                         {/* {(job.status ===
                                                            "completed" ||
                                                            job.status ===
                                                               "closed") && (
                                                            <DropdownMenuItem
                                                               onClick={() =>
                                                                  handleGenerateReport(
                                                                     job._id
                                                                  )
                                                               }
                                                            >
                                                               <Download className="h-4 w-4 mr-2" />
                                                               Download Report
                                                            </DropdownMenuItem>
                                                         )} */}
                                                      </DropdownMenuContent>
                                                   </DropdownMenu>
                                                </TableCell>
                                             </TableRow>

                                             {/* Expanded Row Details */}
                                             {isExpanded && (
                                                <TableRow>
                                                   <TableCell colSpan={7}>
                                                      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {/* Project Details */}
                                                            <div className="space-y-2">
                                                               <h4 className="font-semibold text-gray-900">
                                                                  Project
                                                                  Details
                                                               </h4>
                                                               <div className="text-sm space-y-1">
                                                                  <p>
                                                                     <span className="text-gray-600">
                                                                        Duration:
                                                                     </span>{" "}
                                                                     {
                                                                        job.projectDuration
                                                                     }{" "}
                                                                     day
                                                                     {job.projectDuration >
                                                                     1
                                                                        ? "s"
                                                                        : ""}
                                                                  </p>
                                                                  <p>
                                                                     <span className="text-gray-600">
                                                                        Inspectors:
                                                                     </span>{" "}
                                                                     {
                                                                        job.numInspectors
                                                                     }
                                                                  </p>
                                                                  <p>
                                                                     <span className="text-gray-600">
                                                                        Region:
                                                                     </span>{" "}
                                                                     {
                                                                        job.region
                                                                     }
                                                                  </p>
                                                               </div>
                                                            </div>

                                                            {/* Services */}
                                                            <div className="space-y-2">
                                                               <h4 className="font-semibold text-gray-900">
                                                                  Required
                                                                  Services
                                                               </h4>
                                                               <div className="flex flex-wrap gap-1">
                                                                  {job.requiredServices?.map(
                                                                     (
                                                                        service
                                                                     ) => (
                                                                        <Badge
                                                                           key={
                                                                              service._id
                                                                           }
                                                                           variant="secondary"
                                                                           className="text-xs"
                                                                        >
                                                                           {
                                                                              service.code
                                                                           }
                                                                        </Badge>
                                                                     )
                                                                  )}
                                                               </div>
                                                            </div>

                                                            {/* Timeline */}
                                                            <div className="space-y-2">
                                                               <h4 className="font-semibold text-gray-900">
                                                                  Timeline
                                                               </h4>
                                                               <div className="text-sm space-y-1">
                                                                  {job.preferredStartDate && (
                                                                     <p>
                                                                        <span className="text-gray-600">
                                                                           Start:
                                                                        </span>{" "}
                                                                        {formatDate(
                                                                           job.preferredStartDate
                                                                        )}
                                                                     </p>
                                                                  )}
                                                                  {job.expectedCompletionDate && (
                                                                     <p>
                                                                        <span className="text-gray-600">
                                                                           Expected:
                                                                        </span>{" "}
                                                                        {formatDate(
                                                                           job.expectedCompletionDate
                                                                        )}
                                                                     </p>
                                                                  )}
                                                                  {job.actualCompletionDate && (
                                                                     <p>
                                                                        <span className="text-gray-600">
                                                                           Completed:
                                                                        </span>{" "}
                                                                        {formatDate(
                                                                           job.actualCompletionDate
                                                                        )}
                                                                     </p>
                                                                  )}
                                                               </div>
                                                            </div>
                                                         </div>

                                                         {/* Quick Actions */}
                                                         <div className="flex space-x-2 pt-2 border-t">
                                                            <Button
                                                               size="sm"
                                                               variant="outline"
                                                               onClick={() =>
                                                                  handleViewDetails(
                                                                     job._id
                                                                  )
                                                               }
                                                            >
                                                               <Eye className="h-4 w-4 mr-1" />
                                                               Full Details
                                                            </Button>

                                                            {/* Status Update */}
                                                            <Select
                                                               value={
                                                                  job.status
                                                               }
                                                               onValueChange={(
                                                                  value
                                                               ) =>
                                                                  handleStatusUpdate(
                                                                     job._id,
                                                                     value
                                                                  )
                                                               }
                                                            >
                                                               <SelectTrigger className="w-48">
                                                                  <SelectValue />
                                                               </SelectTrigger>
                                                               <SelectContent>
                                                                  {STATUS_OPTIONS.map(
                                                                     (
                                                                        status
                                                                     ) => (
                                                                        <SelectItem
                                                                           key={
                                                                              status.value
                                                                           }
                                                                           value={
                                                                              status.value
                                                                           }
                                                                        >
                                                                           {
                                                                              status.label
                                                                           }
                                                                        </SelectItem>
                                                                     )
                                                                  )}
                                                               </SelectContent>
                                                            </Select>
                                                         </div>
                                                      </div>
                                                   </TableCell>
                                                </TableRow>
                                             )}
                                          </React.Fragment>
                                       );
                                    })}
                                 </TableBody>
                              </Table>
                           </div>

                           {/* Pagination */}
                           {pagination.totalPages > 1 && (
                              <div className="flex items-center justify-between mt-6">
                                 <div className="text-sm text-gray-700">
                                    Showing{" "}
                                    {(pagination.currentPage - 1) *
                                       pagination.pageSize +
                                       1}{" "}
                                    to{" "}
                                    {Math.min(
                                       pagination.currentPage *
                                          pagination.pageSize,
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
                                          handlePageChange(
                                             pagination.currentPage - 1
                                          )
                                       }
                                    >
                                       <ChevronLeft className="h-4 w-4 mr-1" />
                                       Previous
                                    </Button>
                                    <span className="flex items-center text-sm text-gray-500">
                                       Page {pagination.currentPage} of{" "}
                                       {pagination.totalPages}
                                    </span>
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       disabled={
                                          pagination.currentPage ===
                                          pagination.totalPages
                                       }
                                       onClick={() =>
                                          handlePageChange(
                                             pagination.currentPage + 1
                                          )
                                       }
                                    >
                                       Next
                                       <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                 </div>
                              </div>
                           )}
                        </>
                     )}

                     {/* No Results */}
                     {!loading && jobRequests.length === 0 && (
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
                  </CardContent>
               </Card>
            </div>

            {/* Job Details Modal */}
            {selectedJob && showJobModal && (
               <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
                  <DialogContent className="!max-w-6xl max-h-[90vh]  overflow-y-auto">
                     <DialogHeader>
                        <DialogTitle className="flex items-center justify-between mr-4">
                           <span>Job Details: {selectedJob.title}</span>
                           <Badge
                              className={
                                 getStatusConfig(selectedJob.status).color
                              }
                           >
                              {getStatusConfig(selectedJob.status).label}
                           </Badge>
                        </DialogTitle>
                        <DialogDescription>
                           Complete job information including quotations, notes,
                           and progress tracking
                        </DialogDescription>
                     </DialogHeader>

                     <div className="space-y-6">
                        <Tabs defaultValue="overview" className="w-full">
                           <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="overview">
                                 Overview
                              </TabsTrigger>
                              <TabsTrigger value="quotations">
                                 Quotations (
                                 {selectedJob.quotationHistory?.length || 0})
                              </TabsTrigger>
                              <TabsTrigger value="notes">
                                 Notes ({selectedJob.internalNotes?.length || 0}
                                 )
                              </TabsTrigger>
                              <TabsTrigger value="attachments">
                                 Files ({selectedJob.attachments?.length || 0})
                              </TabsTrigger>
                              <TabsTrigger value="timeline">
                                 Timeline
                              </TabsTrigger>
                           </TabsList>

                           {/* Overview Tab */}
                           <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 {/* Basic Information */}
                                 <Card>
                                    <CardHeader>
                                       <CardTitle>Basic Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                       <div>
                                          <Label>Description</Label>
                                          <p className="text-gray-700">
                                             {selectedJob.description}
                                          </p>
                                       </div>
                                       <div className="grid grid-cols-2 gap-4">
                                          <div>
                                             <Label>Location</Label>
                                             <p className="font-medium">
                                                {selectedJob.location}
                                             </p>
                                          </div>
                                          <div>
                                             <Label>Region</Label>
                                             <p className="font-medium">
                                                {selectedJob.region}
                                             </p>
                                          </div>
                                          <div>
                                             <Label>Duration</Label>
                                             <p className="font-medium">
                                                {selectedJob.projectDuration}{" "}
                                                day
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
                                       </div>
                                       <div>
                                          <Label>Required Services</Label>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                             {selectedJob.requiredServices?.map(
                                                (service) => (
                                                   <Badge
                                                      key={service._id}
                                                      variant="secondary"
                                                   >
                                                      {service.name} (
                                                      {service.code})
                                                   </Badge>
                                                )
                                             )}
                                          </div>
                                       </div>
                                    </CardContent>
                                 </Card>

                                 {/* Client Information */}
                                 <Card>
                                    <CardHeader>
                                       <CardTitle>Client Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
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
                                       {selectedJob.clientPhone && (
                                          <div>
                                             <Label>Phone</Label>
                                             <p className="font-medium">
                                                {selectedJob.clientPhone}
                                             </p>
                                          </div>
                                       )}
                                    </CardContent>
                                 </Card>

                                 {/* Cost Information */}
                                 <Card>
                                    <CardHeader>
                                       <CardTitle>Cost Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                       <div className="grid grid-cols-2 gap-4">
                                          <div>
                                             <Label>Estimated Total</Label>
                                             <p className="text-xl font-bold text-green-600">
                                                {formatCurrency(
                                                   selectedJob.estimatedTotal,selectedJob.costDetails?.currency
                                                )}
                                             </p>
                                          </div>
                                          {selectedJob.finalQuotedAmount && (
                                             <div>
                                                <Label>
                                                   Final Quoted Amount
                                                </Label>
                                                <p className="text-xl font-bold text-blue-600">
                                                   {formatCurrency(
                                                      selectedJob.finalQuotedAmount,selectedJob.costDetails?.currency
                                                   )}
                                                </p>
                                             </div>
                                          )}
                                       </div>
                                       {selectedJob.costDetails && (
                                          <div className="space-y-2">
                                             <Label>Cost Breakdown</Label>
                                             <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                                <div className="flex justify-between text-sm">
                                                   <span>Base Cost:</span>
                                                   <span>
                                                      {formatCurrency(
                                                         selectedJob.costDetails
                                                            .totals?.baseCost,
                                                            selectedJob.costDetails?.currency
                                                      )}
                                                   </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                   <span>Tax:</span>
                                                   <span>
                                                      {formatCurrency(
                                                         selectedJob.costDetails
                                                            .totals?.tax,selectedJob.costDetails?.currency
                                                      )}
                                                   </span>
                                                </div>
                                                {selectedJob.costDetails.totals
                                                   ?.additional > 0 && (
                                                   <div className="flex justify-between text-sm">
                                                      <span>Additional:</span>
                                                      <span>
                                                         {formatCurrency(
                                                            selectedJob
                                                               .costDetails
                                                               ?.totals
                                                               ?.additional,selectedJob.costDetails?.currency
                                                         )}
                                                      </span>
                                                   </div>
                                                )}
                                                <div className="flex justify-between font-semibold border-t pt-2">
                                                   <span>Total:</span>
                                                   <span>
                                                      {formatCurrency(
                                                         selectedJob.costDetails
                                                            .totals?.grandTotal,selectedJob.costDetails?.currency
                                                      )}
                                                   </span>
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                    </CardContent>
                                 </Card>

                                 {/* Provider Information */}
                                 {selectedJob.assignedProviderId && (
                                    <Card>
                                       <CardHeader>
                                          <CardTitle>
                                             Assigned Provider
                                          </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-4">
                                          <div>
                                             <Label>Provider Name</Label>
                                             <p className="font-medium">
                                                {selectedJob.providerName}
                                             </p>
                                          </div>
                                          {selectedJob.assignedProviderId && (
                                             <Badge variant="outline">
                                                <Award className="h-3 w-3 mr-1" />
                                                Assigned
                                             </Badge>
                                          )}
                                       </CardContent>
                                    </Card>
                                 )}
                              </div>
                           </TabsContent>

                           {/* Quotations Tab */}
                           <TabsContent
                              value="quotations"
                              className="space-y-4"
                           >
                              {selectedJob.quotationHistory &&
                              selectedJob.quotationHistory.length > 0 ? (
                                 <div className="space-y-4">
                                    {selectedJob.quotationHistory.map(
                                       (quotation, index) => {
                                          const quotationStatusConfig =
                                             QUOTATION_STATUS[
                                                quotation.status
                                             ] || QUOTATION_STATUS.pending;
                                          const StatusIcon =
                                             quotationStatusConfig.icon;

                                          return (
                                             <Card key={index}>
                                                <CardContent className="p-6">
                                                   <div className="flex justify-between items-start mb-4">
                                                      <div>
                                                         <div className="flex items-center space-x-2 mb-2">
                                                            <p className="text-2xl font-bold text-green-600">
                                                               {formatCurrency(
                                                                  quotation.quotedAmount,
                                                                 selectedJob?.costDetails?.currency
                                                               )}
                                                            </p>
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
                                                            Submitted:{" "}
                                                            {formatDate(
                                                               quotation.quotedAt
                                                            )}
                                                         </p>
                                                         {quotation.validUntil && (
                                                            <p className="text-sm text-gray-600">
                                                               Valid until:{" "}
                                                               {formatDate(
                                                                  quotation.validUntil
                                                               )}
                                                            </p>
                                                         )}
                                                      </div>
                                                   </div>

                                                   {quotation.quotationDetails && (
                                                      <div className="mb-4">
                                                         <Label>
                                                            Description
                                                         </Label>
                                                         <p className="text-gray-700">
                                                            {
                                                               quotation.quotationDetails
                                                            }
                                                         </p>
                                                      </div>
                                                   )}

                                                   {/* Negotiation Messages */}
                                                   {quotation.negotiations &&
                                                      quotation.negotiations
                                                         .length > 0 && (
                                                         <div className="mt-4 border-t pt-4">
                                                            <Label className="mb-2 block">
                                                               Negotiation
                                                               History
                                                            </Label>
                                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                               {quotation.negotiations.map(
                                                                  (
                                                                     negotiation,
                                                                     negIndex
                                                                  ) => (
                                                                     <div
                                                                        key={
                                                                           negIndex
                                                                        }
                                                                        className="p-3 bg-gray-50 rounded-lg"
                                                                     >
                                                                        <div className="flex justify-between items-start mb-2">
                                                                           <span className="font-medium text-sm">
                                                                              {negotiation.fromClient
                                                                                 ? "Client"
                                                                                 : "Provider"}
                                                                           </span>
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
                                                                                 negotiation.proposedAmount,selectedJob.costDetails?.currency
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
                                    <p className="text-gray-500">
                                       No quotations submitted yet
                                    </p>
                                 </div>
                              )}
                           </TabsContent>

                           {/* Notes Tab */}
                           <TabsContent value="notes" className="space-y-4">
                              {selectedJob.internalNotes &&
                              selectedJob.internalNotes.length > 0 ? (
                                 <div className="space-y-4">
                                    {selectedJob.internalNotes.map(
                                       (note, index) => (
                                          <Card key={index}>
                                             <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                   <Badge variant="outline">
                                                      {note.noteType}
                                                   </Badge>
                                                   <span className="text-xs text-gray-500">
                                                      {formatDate(note.addedAt)}
                                                   </span>
                                                </div>
                                                <p className="text-gray-700">
                                                   {note.note}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-2">
                                                   By{" "}
                                                   {note.addedBy?.name ||
                                                      "Unknown"}
                                                </p>
                                             </CardContent>
                                          </Card>
                                       )
                                    )}
                                 </div>
                              ) : (
                                 <div className="text-center py-8">
                                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-500">
                                       No notes added yet
                                    </p>
                                 </div>
                              )}
                           </TabsContent>

                           {/* Attachments Tab */}
                           <TabsContent
                              value="attachments"
                              className="space-y-4"
                           >
                              {selectedJob.attachments &&
                              selectedJob.attachments.length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedJob.attachments.map(
                                       (attachment, index) => (
                                          <Card key={index}>
                                             <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                   <div className="flex items-center space-x-2">
                                                      <Paperclip className="h-4 w-4 text-gray-500" />
                                                      <p className="font-medium text-sm">
                                                         {
                                                            attachment.originalFileName
                                                         }
                                                      </p>
                                                   </div>
                                                   <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                   >
                                                      {attachment.category}
                                                   </Badge>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-2">
                                                   Uploaded:{" "}
                                                   {formatDate(
                                                      attachment.uploadedAt
                                                   )}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                   Size:{" "}
                                                   {(
                                                      attachment.fileSize / 1024
                                                   ).toFixed(1)}{" "}
                                                   KB
                                                </p>
                                                <Button
                                                   variant="outline"
                                                   size="sm"
                                                   className="mt-2 w-full"
                                                   onClick={() =>
                                                      window.open(
                                                         attachment.fileUrl,
                                                         "_blank"
                                                      )
                                                   }
                                                >
                                                   <ExternalLink className="h-3 w-3 mr-1" />
                                                   View File
                                                </Button>
                                             </CardContent>
                                          </Card>
                                       )
                                    )}
                                 </div>
                              ) : (
                                 <div className="text-center py-8">
                                    <Paperclip className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-500">
                                       No attachments uploaded yet
                                    </p>
                                 </div>
                              )}
                           </TabsContent>

                           {/* Timeline Tab */}
                           <TabsContent value="timeline" className="space-y-4">
                              <div className="space-y-4">
                                 <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    <div>
                                       <p className="font-medium">
                                          Job Created
                                       </p>
                                       <p className="text-sm text-gray-600">
                                          {formatDate(selectedJob.createdAt)}
                                       </p>
                                    </div>
                                 </div>

                                 {selectedJob.preferredStartDate && (
                                    <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
                                       <Calendar className="h-5 w-5 text-yellow-600" />
                                       <div>
                                          <p className="font-medium">
                                             Preferred Start Date
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {formatDate(
                                                selectedJob.preferredStartDate
                                             )}
                                          </p>
                                       </div>
                                    </div>
                                 )}

                                 {selectedJob.actualStartDate && (
                                    <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                                       <Activity className="h-5 w-5 text-green-600" />
                                       <div>
                                          <p className="font-medium">
                                             Work Started
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {formatDate(
                                                selectedJob.actualStartDate
                                             )}
                                          </p>
                                       </div>
                                    </div>
                                 )}

                                 {selectedJob.expectedCompletionDate && (
                                    <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                                       <Clock className="h-5 w-5 text-purple-600" />
                                       <div>
                                          <p className="font-medium">
                                             Expected Completion
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {formatDate(
                                                selectedJob.expectedCompletionDate
                                             )}
                                          </p>
                                       </div>
                                    </div>
                                 )}

                                 {selectedJob.actualCompletionDate && (
                                    <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                                       <CheckCircle className="h-5 w-5 text-green-600" />
                                       <div>
                                          <p className="font-medium">
                                             Work Completed
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {formatDate(
                                                selectedJob.actualCompletionDate
                                             )}
                                          </p>
                                       </div>
                                    </div>
                                 )}

                                 {selectedJob.updatedAt && (
                                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                       <RefreshCw className="h-5 w-5 text-gray-600" />
                                       <div>
                                          <p className="font-medium">
                                             Last Updated
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {formatDate(selectedJob.updatedAt)}
                                          </p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </TabsContent>
                        </Tabs>
                     </div>

                     <DialogFooter className="flex justify-between">
                        <div className="flex space-x-2">
                           {/* {(selectedJob.status === "completed" ||
                              selectedJob.status === "closed") && (
                              <Button
                                 variant="outline"
                                 onClick={() =>
                                    handleGenerateReport(selectedJob._id)
                                 }
                              >
                                 <Download className="h-4 w-4 mr-2" />
                                 Download Report
                              </Button>
                           )} */}
                        </div>
                        <div className="flex space-x-2">
                           <Select
                              value={selectedJob.status}
                              onValueChange={(value) =>
                                 handleStatusUpdate(selectedJob._id, value)
                              }
                           >
                              <SelectTrigger className="w-48">
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
                           <Button onClick={() => setShowJobModal(false)}>
                              Close
                           </Button>
                        </div>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>
            )}
         </div>
      </>
   );
};

export default AdminJobManagement;
