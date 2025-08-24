import React, { useState, useEffect, useCallback } from "react";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   Download,
   CreditCard,
   FileText,
   Star,
   CheckCircle,
   Clock,
   DollarSign,
   User,
   MapPin,
   Calendar,
   Paperclip,
   Search,
   Filter,
   RefreshCw,
   Shield,
   Award,
   MessageCircle,
   AlertTriangle,
   Loader2,
   Check,
   X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import StripePaymentForm from "@/components/StripePaymentForm";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const DownloadReport = () => {
   const [jobs, setJobs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedJob, setSelectedJob] = useState(null);
   const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
   const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
   const [filters, setFilters] = useState({
      search: "",
      dateFrom: "",
      dateTo: "",
   });
   const [rating, setRating] = useState(0);
   const [review, setReview] = useState("");
   const [hoveredStar, setHoveredStar] = useState(0);
   const [refreshing, setRefreshing] = useState(false);
   const [feeSettings, setFeeSettings] = useState({
      platformFeePercentage: 5,
      processingFeePercentage: 2.9,
      fixedProcessingFee: 0.3
   });

   // Fetch fee settings from admin settings
   const fetchFeeSettings = useCallback(async () => {
      try {
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/admin/settings/public`
         );
         setFeeSettings(response.data.data);
      } catch (error) {
         console.error("Error fetching fee settings:", error);
         // Keep default values if API fails
         toast.error("Failed to fetch fee settings, using defaults");
      }
   }, []);

   // // Calculate total payment amount
   // const calculatePaymentAmount = (estimatedAmount) => {
   //    const platformFee = (estimatedAmount * feeSettings.platformFeePercentage) / 100;
   //    const stripeFee =
   //       ((estimatedAmount + platformFee) * feeSettings.processingFeePercentage) / 100 +
   //       feeSettings.fixedProcessingFee;
   //    const totalAmount = estimatedAmount + platformFee +stripeFee;

   //    return {
   //       baseAmount: estimatedAmount,
   //       platformFee: platformFee,
   //       processingFee: stripeFee,
   //       totalAmount: totalAmount,
   //    };
   // };
   // Calculate total payment amount
const calculatePaymentAmount = (estimatedAmount) => {
   const platformFee = (estimatedAmount * feeSettings.platformFeePercentage) / 100;

   // Stripe fee is calculated on (baseAmount + platformFee + stripeFee itself)
   // To ensure provider gets full baseAmount, we "gross up" the payment.
   const stripeFee =
      ((estimatedAmount + platformFee) * feeSettings.processingFeePercentage) / (100 - feeSettings.processingFeePercentage) +
      feeSettings.fixedProcessingFee;

   const totalAmount = estimatedAmount + platformFee + stripeFee;

   return {
      baseAmount: estimatedAmount,   // Provider always receives this
      platformFee: platformFee,      // Platform commission
      processingFee: stripeFee,      // Stripe fee added on top
      totalAmount: totalAmount,      // Final amount customer pays
   };
};



   // Fetch closed jobs
   const fetchClosedJobs = useCallback(async () => {
      try {
         setLoading(true);
         const token = localStorage.getItem("accessToken");

         if (!token) {
            toast.error("Please login to view reports");
            return;
         }

         // Build query parameters
         const params = {
            status: "closed",
            ...filters,
         };

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests`,
            {
               headers: { Authorization: `Bearer ${token}` },
               params,
            }
         );

         setJobs(response.data.data.jobRequests || []);
      } catch (error) {
         console.error("Error fetching jobs:", error);
         if (error.response?.status === 401) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("accessToken");
         } else {
            toast.error("Failed to fetch jobs");
         }
      } finally {
         setLoading(false);
      }
   }, [filters]);

   // Refresh jobs
   const refreshJobs = async () => {
      setRefreshing(true);
      await fetchClosedJobs();
      setRefreshing(false);
      toast.success("Jobs refreshed successfully");
   }; // Download PDF report
   const downloadPDFReport = async (job) => {
      try {
         const token = localStorage.getItem("accessToken");

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests/${job._id}/report`,
            {
               headers: { Authorization: `Bearer ${token}` },
               responseType: "blob",
            }
         );

         // Create blob URL and download
         const blob = new Blob([response.data], { type: "application/pdf" });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = `job-report-${job._id}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);

         toast.success("Report downloaded successfully");
      } catch (error) {
         console.error("Error downloading report:", error);
         toast.error("Failed to download report");
      }
   };

   // Download attachment
   const downloadAttachment = async (attachment) => {
      try {
         // Open attachment URL in new tab
         window.open(attachment.fileUrl, "_blank");
         toast.success("Attachment opened successfully");
      } catch (error) {
         console.error("Error downloading attachment:", error);
         toast.error("Failed to download attachment");
      }
   };

   // Submit rating
   const submitRating = async () => {
      if (!selectedJob || rating === 0) {
         toast.error("Please provide a rating");
         return;
      }

      try {
         const token = localStorage.getItem("accessToken");

         await axios.post(
            `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/rating`,
            {
               rating: rating,
               review: review.trim(),
            },
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         toast.success("Rating submitted successfully");
         setRatingDialogOpen(false);
         setRating(0);
         setReview("");
         fetchClosedJobs(); // Refresh to update rating status
      } catch (error) {
         console.error("Error submitting rating:", error);
         toast.error(
            error.response?.data?.message || "Failed to submit rating"
         );
      }
   };

   // Filter jobs
   const filteredJobs = jobs.filter((job) => {
      const matchesSearch =
         !filters.search ||
         job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
         job.description.toLowerCase().includes(filters.search.toLowerCase()) ||
         job.clientName.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSearch;
   });

   // Format date
   const formatDate = (date) => {
      if (!date) return "Not set";
      return new Date(date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   // Format currency
   // const formatCurrency = (amount) => {
   //    if (!amount) return "$0.00";
   //    return new Intl.NumberFormat("en-US", {
   //       style: "currency",
   //       currency: "USD",
   //    }).format(amount);
   // };
  const formatCurrency = (amount,currency="USD") => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

   // Star rating component
   const StarRating = ({ value, onRate, readonly = false }) => {
      return (
         <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
               <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                     star <= (hoveredStar || value)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                  }`}
                  onClick={() => !readonly && onRate(star)}
                  onMouseEnter={() => !readonly && setHoveredStar(star)}
                  onMouseLeave={() => !readonly && setHoveredStar(0)}
               />
            ))}
         </div>
      );
   };

   useEffect(() => {
      fetchFeeSettings();
      fetchClosedJobs();
   }, [fetchFeeSettings, fetchClosedJobs]);

   return (
      <>
         <NavbarSection />
         <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h1 className="text-3xl font-bold text-[#004aad]">
                        Download Reports
                     </h1>
                     <p className="text-gray-600 mt-1">
                        Access your completed job reports and attachments
                     </p>
                  </div>
                  <div className="flex gap-2">
                     <Button
                        onClick={refreshJobs}
                        disabled={refreshing}
                        variant="outline"
                        className="flex items-center gap-2"
                     >
                        <RefreshCw
                           className={`h-4 w-4 ${
                              refreshing ? "animate-spin" : ""
                           }`}
                        />
                        Refresh
                     </Button>
                  </div>
               </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Filter className="h-5 w-5" />
                     Filters
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                     <div>
                        {" "}
                        <Label>Search</Label>
                        <div className="relative">
                           <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                           <Input
                              placeholder="Search jobs..."
                              value={filters.search}
                              onChange={(e) =>
                                 setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                 }))
                              }
                              className="pl-10"
                           />
                        </div>
                     </div>
                     <div>
                        <Label>From Date</Label>
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
                     <div>
                        <Label>To Date</Label>
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
                     <Button
                        onClick={() =>
                           setFilters({ search: "", dateFrom: "", dateTo: "" })
                        }
                        variant="outline"
                        className="mt-4"
                     >
                        Clear Filters
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Jobs Grid */}
            {loading ? (
               <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
               </div>
            ) : filteredJobs.length === 0 ? (
               <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64">
                     <FileText className="h-12 w-12 text-gray-400 mb-4" />
                     <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No Completed Jobs Found
                     </h3>
                     <p className="text-gray-500 text-center">
                        You don't have any completed jobs yet or no jobs match
                        your filters.
                     </p>
                  </CardContent>
               </Card>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => {
                     const paymentDetails = calculatePaymentAmount(
                        job.estimatedTotal
                     );
                     const isPaid = job.paymentStatus === "paid";
                     const hasRating =
                        job.clientRating && job.clientRating.rating > 0;

                     return (
                        <Card
                           key={job._id}
                           className="hover:shadow-lg transition-shadow duration-200"
                        >
                           <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                 <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate">
                                       {job.title}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                       Job ID: {job._id.slice(-8)}
                                    </CardDescription>
                                 </div>
                                 <div className="flex flex-col gap-2 ml-2">
                                    <Badge className="bg-green-100 text-green-800">
                                       <CheckCircle className="h-3 w-3 mr-1" />
                                       Completed
                                    </Badge>
                                    {isPaid && (
                                       <Badge className="bg-blue-100 text-[#004aad]">
                                          <Shield className="h-3 w-3 mr-1" />
                                          Paid
                                       </Badge>
                                    )}
                                 </div>
                              </div>
                           </CardHeader>

                           <CardContent className="space-y-4">
                              {/* Job Info */}
                              <div className="space-y-2 text-sm">
                                 <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">
                                       Provider:
                                    </span>
                                    <span className="font-medium">
                                       {job.providerName}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">
                                       Location:
                                    </span>
                                    <span className="truncate">
                                       {job.location}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">
                                       Completed:
                                    </span>
                                    <span>
                                       {formatDate(job.actualCompletionDate)}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">
                                       Attachments:
                                    </span>
                                    <span>
                                       {job.attachments?.length || 0} file(s)
                                    </span>
                                 </div>
                              </div>

                              {/* Payment Info */}
                              <div className="bg-gray-50 p-3 rounded-lg">
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">
                                       Payment Details
                                    </span>
                                    <DollarSign className="h-4 w-4 text-gray-500" />
                                 </div>
                                 <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                       <span>Base Amount:</span>
                                       <span>
                                          {formatCurrency(
                                             paymentDetails.baseAmount,
                                             job.costDetails.currency
                                          )}
                                       </span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span>Platform Fee ({feeSettings.platformFeePercentage}%):</span>
                                       <span>
                                          {formatCurrency(
                                             paymentDetails.platformFee, job.costDetails.currency
                                          )}
                                       </span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span>Processing Fee:</span>
                                       <span>
                                          {formatCurrency(
                                             paymentDetails.processingFee, job.costDetails.currency
                                          )}
                                       </span>
                                    </div>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-semibold">
                                       <span>Total:</span>
                                       <span>
                                          {formatCurrency(
                                             paymentDetails.totalAmount
                                             , job.costDetails.currency
                                          )}
                                       </span>
                                    </div>
                                 </div>
                              </div>

                              {/* Rating Section */}
                              {hasRating && (
                                 <div className="bg-yellow-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                       <Award className="h-4 w-4 text-yellow-600" />
                                       <span className="text-sm font-medium">
                                          Your Rating
                                       </span>
                                    </div>
                                    <StarRating
                                       value={job.clientRating.rating}
                                       readonly
                                    />
                                    {job.clientRating.review && (
                                       <p className="text-sm text-gray-600 mt-2">
                                          {job.clientRating.review}
                                       </p>
                                    )}
                                 </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 pt-2">
                                 {!isPaid ? (
                                    <Button
                                       onClick={() => {
                                          setSelectedJob(job);
                                          setPaymentDialogOpen(true);
                                       }}
                                       className="w-full"
                                    >
                                       <CreditCard className="h-4 w-4 mr-2" />
                                       Pay & Download (
                                       {formatCurrency(
                                          paymentDetails.totalAmount
                                          , job.costDetails.currency
                                       )}
                                       )
                                    </Button>
                                 ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                       <Button
                                          onClick={() => downloadPDFReport(job)}
                                          variant="outline"
                                          className="w-full"
                                       >
                                          <Download className="h-4 w-4 mr-2" />
                                          Download Report
                                       </Button>

                                       <Dialog>
                                          <DialogTrigger asChild>
                                             <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() =>
                                                   setSelectedJob(job)
                                                }
                                             >
                                                <Paperclip className="h-4 w-4 mr-2" />
                                                View Attachments (
                                                {job.attachments?.length || 0})
                                             </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-2xl">
                                             <DialogHeader>
                                                <DialogTitle>
                                                   Job Attachments
                                                </DialogTitle>
                                                <DialogDescription>
                                                   Download attachments for:{" "}
                                                   {job.title}
                                                </DialogDescription>
                                             </DialogHeader>
                                             <AttachmentsModal
                                                job={job}
                                                onDownload={downloadAttachment}
                                             />
                                          </DialogContent>
                                       </Dialog>

                                       {!hasRating && (
                                          <Button
                                             onClick={() => {
                                                setSelectedJob(job);
                                                setRatingDialogOpen(true);
                                             }}
                                             variant="outline"
                                             className="w-full"
                                          >
                                             <Star className="h-4 w-4 mr-2" />
                                             Rate Job
                                          </Button>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </CardContent>
                        </Card>
                     );
                  })}
               </div>
            )}

            {/* Payment Dialog */}
            <Dialog
               open={paymentDialogOpen}
               onOpenChange={setPaymentDialogOpen}
            >
               <DialogContent className="w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle className="flex items-center justify-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Complete Payment
                     </DialogTitle>
                     <DialogDescription className="text-center">
                        Pay to access reports and attachments for:{" "}
                        {selectedJob?.title}
                     </DialogDescription>
                  </DialogHeader>
                  {selectedJob && (
                     <StripePaymentForm
                        job={selectedJob}
                        paymentDetails={calculatePaymentAmount(
                           selectedJob.estimatedTotal
                        ) }
                        onSuccess={() => {
                           setPaymentDialogOpen(false);
                           fetchClosedJobs();
                        }}
                        onCancel={() => setPaymentDialogOpen(false)}
                     />
                  )}
               </DialogContent>
            </Dialog>

            {/* Rating Dialog */}
            <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
               <DialogContent className="max-w-md">
                  <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Rate This Job
                     </DialogTitle>
                     <DialogDescription>
                        Share your experience for: {selectedJob?.title}
                     </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                     <div>
                        <Label>Rating</Label>
                        <div className="mt-2">
                           <StarRating value={rating} onRate={setRating} />
                        </div>
                     </div>

                     <div>
                        <Label htmlFor="review">Review (Optional)</Label>
                        <Textarea
                           id="review"
                           placeholder="Share your experience with this job..."
                           value={review}
                           onChange={(e) => setReview(e.target.value)}
                           rows={3}
                        />
                     </div>

                     <div className="flex gap-2">
                        <Button
                           variant="outline"
                           onClick={() => setRatingDialogOpen(false)}
                           className="flex-1"
                        >
                           Cancel
                        </Button>
                        <Button
                           onClick={submitRating}
                           disabled={rating === 0}
                           className="flex-1"
                        >
                           <Star className="h-4 w-4 mr-2" />
                           Submit Rating
                        </Button>
                     </div>
                  </div>
               </DialogContent>
            </Dialog>
         </div>
      </>
   );
};

// Attachments Modal Component
const AttachmentsModal = ({ job, onDownload }) => {
   if (!job.attachments || job.attachments.length === 0) {
      return (
         <div className="text-center py-8 text-gray-500">
            <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No attachments available for this job</p>
         </div>
      );
   }

   const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
         {job.attachments.map((attachment, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
               <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                     <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                           {attachment.originalFileName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                           <span className="capitalize">
                              {attachment.category}
                           </span>
                           <span>{formatFileSize(attachment.fileSize)}</span>
                           <span>{formatDate(attachment.uploadedAt)}</span>
                        </div>
                     </div>
                     <Button
                        size="sm"
                        onClick={() => onDownload(attachment)}
                        className="ml-2"
                     >
                        <Download className="h-4 w-4" />
                     </Button>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
};

export default DownloadReport;
