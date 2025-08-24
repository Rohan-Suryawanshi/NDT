import React, { useState, useEffect } from "react";
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   Legend,
   ResponsiveContainer,
   LineChart,
   Line,
   PieChart,
   Pie,
   Cell,
   Area,
   AreaChart,
} from "recharts";
import {
   DollarSign,
   TrendingUp,
   TrendingDown,
   Users,
   CreditCard,
   Clock,
   CheckCircle,
   XCircle,
   Eye,
   FileText,
   Search,
   Calendar,
   Filter,
   Download,
   RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import toast from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

// Utility functions
const formatCurrency = (amount, currency = "USD") => {
   return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   }).format(amount)} ${currency}`;
};

const formatDate = (date) => {
   return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
   });
};

const getStatusColor = (status) => {
   const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      succeeded: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
   };
   return colors[status] || "bg-gray-100 text-gray-800";
};

const AdminWithdrawManagement = () => {
   // State management
   const [isGraphicalView, setIsGraphicalView] = useState(false);
   const [loading, setLoading] = useState(false);
   const [withdrawals, setWithdrawals] = useState([]);
   const [stats, setStats] = useState({});
   const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
   const [adminNote, setAdminNote] = useState("");
   const [isModalOpen, setIsModalOpen] = useState(false);

   // Filter states
   const [statusFilter, setStatusFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");
   const [dateRange, setDateRange] = useState("all");
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   // Chart colors
   const COLORS = ["#004aad", "#e0eaff", "#c1d6ff", "#ff6b6b", "#ffd93d"];

   // Generate chart data from real stats
   const getChartData = () => {
      if (
         !stats.monthlyTrends ||
         !stats.monthlyTrends.withdrawals ||
         !stats.monthlyTrends.payments
      ) {
         // Return empty data instead of mock data
         return [];
      }

      // Convert backend data to chart format
      const months = [
         "Jan",
         "Feb",
         "Mar",
         "Apr",
         "May",
         "Jun",
         "Jul",
         "Aug",
         "Sep",
         "Oct",
         "Nov",
         "Dec",
      ];
      const chartData = [];

      // Create a map of existing data
      const withdrawalData = {};
      const paymentData = {};

      stats.monthlyTrends.withdrawals?.forEach((item) => {
         const key = `${item._id.year}-${item._id.month}`;
         withdrawalData[key] = item.total;
      });

      stats.monthlyTrends.payments?.forEach((item) => {
         const key = `${item._id.year}-${item._id.month}`;
         paymentData[key] = item.total;
      });

      // Generate last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
         const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

         chartData.push({
            month: months[date.getMonth()],
            withdrawals: withdrawalData[key] || 0,
            payments: paymentData[key] || 0,
            users: stats.activeUsers || 0,
         });
      }

      return chartData;
   };
   const getStatusDistribution = () => {
      if (
         !stats.withdrawalStatusCounts ||
         stats.withdrawalStatusCounts.length === 0
      ) {
         // Return empty data instead of mock data
         return [];
      }

      const statusColors = {
         completed: "#10b981",
         pending: "#f59e0b",
         processing: "#3b82f6",
         rejected: "#ef4444",
         cancelled: "#6b7280",
      };

      return stats.withdrawalStatusCounts.map((item) => ({
         name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
         value: item.count,
         color: statusColors[item._id] || "#6b7280",
      }));
   }; // Fetch data functions
   const fetchWithdrawals = React.useCallback(async () => {
      try {
         setLoading(true);
         const token = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/admin/withdrawals`,
            {
               headers: { Authorization: `Bearer ${token}` },
               params: {
                  page: currentPage,
                  limit: 10,
                  status: statusFilter !== "all" ? statusFilter : undefined,
                  search: searchTerm || undefined,
                  dateRange: dateRange !== "all" ? dateRange : undefined,
               },
            }
         );

         setWithdrawals(response.data.data.withdrawals || []);
         setTotalPages(response.data.data.pagination?.totalPages || 1);
      } catch (error) {
         console.error("Error fetching withdrawals:", error);
         console.error("Error response:", error.response?.data);
         toast.error(
            `Failed to fetch withdrawals: ${
               error.response?.data?.message || error.message
            }`
         );
         // If unauthorized, redirect to login or show appropriate message
         if (error.response?.status === 403) {
            toast.error("Admin access required");
         }
      } finally {
         setLoading(false);
      }
   }, [currentPage, statusFilter, searchTerm, dateRange]);

   const fetchPaymentStats = async () => {
      try {
         const token = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/admin/stats`,
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         setStats(response.data.data || {});
      } catch (error) {
         console.error("Error fetching payment stats:", error);
         console.error("Error response:", error.response?.data);
         if (error.response?.status === 403) {
            toast.error("Admin access required");
         } else {
            toast.error(
               `Failed to fetch payment stats: ${
                  error.response?.data?.message || error.message
               }`
            );
         }
      }
   };
   const updateWithdrawalStatus = async (withdrawalId, status) => {
      try {
         const token = localStorage.getItem("accessToken");
         await axios.patch(
            `${BACKEND_URL}/api/v1/payments/withdraw/${withdrawalId}/status`,
            {
               status,
               adminNote: adminNote || undefined,
            },
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         toast.success(`Withdrawal ${status} successfully`);
         setSelectedWithdrawal(null);
         setAdminNote("");
         setIsModalOpen(false);
         fetchWithdrawals();
      } catch (error) {
         console.error("Error updating withdrawal status:", error);
         toast.error("Failed to update withdrawal status");
      }
   };
   // Effects
   useEffect(() => {
      fetchPaymentStats();
   }, []);

   useEffect(() => {
      fetchWithdrawals();
   }, [fetchWithdrawals]);

   // Search debounce effect
   useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
         if (searchTerm !== "") {
            setCurrentPage(1); // Reset to first page when searching
            fetchWithdrawals();
         }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
   }, [searchTerm, fetchWithdrawals]);

   // Handle search on enter
   const handleSearchKeyPress = (e) => {
      if (e.key === "Enter") {
         setCurrentPage(1);
         fetchWithdrawals();
      }
   };

   // Utility functions
   const formatCurrency = (amount, currency = "USD") => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   const getStatusColor = (status) => {
      const colors = {
         pending: "bg-yellow-100 text-yellow-800",
         processing: "bg-blue-100 text-blue-800",
         completed: "bg-green-100 text-green-800",
         rejected: "bg-red-100 text-red-800",
         cancelled: "bg-gray-100 text-gray-800",
      };
      return colors[status] || "bg-gray-100 text-gray-800";
   };
   // Stats Cards Component
   const StatsCards = React.memo(() => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-blue-100 text-sm font-medium">
                     Total Withdrawals
                  </p>
                  <p className="text-3xl font-bold text-white">
                     {formatCurrency(stats.totalWithdrawals || 0)}
                  </p>
               </div>
               <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <DollarSign className="h-8 w-8 text-black" />
               </div>
            </div>
         </Card>

         <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-yellow-100 text-sm font-medium">
                     Pending Requests
                  </p>
                  <p className="text-3xl font-bold text-white">
                     {stats.pendingWithdrawals || 0}
                  </p>
               </div>
               <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <Clock className="h-8 w-8 text-black" />
               </div>
            </div>
         </Card>

         <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-green-100 text-sm font-medium">
                     Total Payments
                  </p>
                  <p className="text-3xl font-bold text-white">
                     {formatCurrency(stats.totalPayments || 0)}
                  </p>
               </div>
               <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <CreditCard className="h-8 w-8 text-black" />
               </div>
            </div>
         </Card>

         <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-purple-100 text-sm font-medium">
                     Active Users
                  </p>
                  <p className="text-3xl font-bold text-white">
                     {stats.activeUsers || 0}
                  </p>
               </div>
               <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <Users className="h-8 w-8 text-black" />
               </div>
            </div>
         </Card>
      </div>
   ));
   // Charts Component
   const ChartsView = () => {
      const chartData = getChartData();
      const statusData = getStatusDistribution();

      return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trends */}
            <Card className="p-6">
               <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
               {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                     <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Area
                           type="monotone"
                           dataKey="payments"
                           stackId="1"
                           stroke="#004aad"
                           fill="#004aad"
                        />
                        <Area
                           type="monotone"
                           dataKey="withdrawals"
                           stackId="1"
                           stroke="#e0eaff"
                           fill="#e0eaff"
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                     <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No data available for monthly trends</p>
                     </div>
                  </div>
               )}
            </Card>

            {/* Status Distribution */}
            <Card className="p-6">
               <h3 className="text-lg font-semibold mb-4">
                  Withdrawal Status Distribution
               </h3>
               {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                     <PieChart>
                        <Pie
                           data={statusData}
                           cx="50%"
                           cy="50%"
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                           label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                           }
                        >
                           {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                     <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No withdrawal status data available</p>
                     </div>
                  </div>
               )}
            </Card>

            {/* Payment Volume */}
            <Card className="p-6">
               <h3 className="text-lg font-semibold mb-4">Payment Volume</h3>
               {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="payments" fill="#004aad" />
                        <Bar dataKey="withdrawals" fill="#e0eaff" />
                     </BarChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                     <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No payment volume data available</p>
                     </div>
                  </div>
               )}
            </Card>

            {/* User Growth */}
            {/* <Card className="p-6">
               <h3 className="text-lg font-semibold mb-4">User Growth</h3>
               {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                           type="monotone"
                           dataKey="users"
                           stroke="#004aad"
                           strokeWidth={2}
                        />
                     </LineChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                     <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No user growth data available</p>
                     </div>
                  </div>
               )}
            </Card> */}
         </div>
      );
   };

   // Table View Component
   const TableView = () => (
      <Card className="p-6">
         {/* Filters */}
         <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 min-w-[250px]">
               <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                     placeholder="Search by user, amount, or transaction ID..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onKeyPress={handleSearchKeyPress}
                     className="pl-10 w-full"
                  />
               </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-[200px]">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                     <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Status</SelectItem>
                     <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-yellow-500" /> Pending
                        </div>
                     </SelectItem>
                     <SelectItem value="processing">
                        <div className="flex items-center gap-2">
                           <RefreshCw className="h-4 w-4 text-[#004aad]" />{" "}
                           Processing
                        </div>
                     </SelectItem>
                     <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                           <CheckCircle className="h-4 w-4 text-green-500" />{" "}
                           Completed
                        </div>
                     </SelectItem>
                     <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                           <XCircle className="h-4 w-4 text-red-500" /> Rejected
                        </div>
                     </SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Date Range Filter */}
            <div className="w-full sm:w-[200px]">
               <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full">
                     <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-gray-500" /> All
                           Time
                        </div>
                     </SelectItem>
                     <SelectItem value="today">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-[#004aad]" /> Today
                        </div>
                     </SelectItem>
                     <SelectItem value="week">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-green-500" /> This
                           Week
                        </div>
                     </SelectItem>
                     <SelectItem value="month">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-purple-500" /> This
                           Month
                        </div>
                     </SelectItem>
                     <SelectItem value="quarter">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-orange-500" /> This
                           Quarter
                        </div>
                     </SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Refresh Button */}
            <div className="w-full sm:w-auto flex justify-start sm:justify-end">
               <Button
                  onClick={() => {
                     setCurrentPage(1);
                     fetchWithdrawals();
                  }}
                  disabled={loading}
                  className="min-w-[120px]"
               >
                  <RefreshCw
                     className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Loading..." : "Refresh"}
               </Button>
            </div>
         </div>
         {/* Table */}
         <div className="overflow-x-auto">
            <table className="w-full table-auto">
               <thead>
                  <tr className="border-b">
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        User
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Amount
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Method
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Status
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Date
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Actions
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                     <tr>
                        <td colSpan="6" className="py-8 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Loading withdrawals...
                           </div>
                        </td>
                     </tr>
                  ) : withdrawals.length === 0 ? (
                     <tr>
                        <td
                           colSpan="6"
                           className="py-8 text-center text-gray-500"
                        >
                           <div className="flex flex-col items-center gap-2">
                              <FileText className="h-8 w-8 text-gray-300" />
                              No withdrawals found
                           </div>
                        </td>
                     </tr>
                  ) : (
                     withdrawals.map((withdrawal) => (
                        <tr
                           key={withdrawal._id}
                           className="border-b hover:bg-gray-50"
                        >
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {withdrawal.userId?.name ||
                                       withdrawal.userId?.fullName ||
                                       "Unknown User"}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                    {withdrawal.userId?.email ||
                                       "No email provided"}
                                 </p>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {formatCurrency(
                                       withdrawal.amount || 0,
                                       withdrawal.currency
                                    )}
                                 </p>
                                 {withdrawal.processingFee > 0 && (
                                    <p className="text-sm text-gray-500">
                                       Fee:{" "}
                                       {formatCurrency(
                                          withdrawal.processingFee,
                                          withdrawal.currency
                                       )}
                                    </p>
                                 )}
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                 <CreditCard className="h-4 w-4 text-gray-500" />
                                 <span className="capitalize">
                                    {withdrawal.withdrawalMethod?.replace(
                                       "_",
                                       " "
                                    ) || "Bank Transfer"}
                                 </span>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <Badge
                                 className={`${getStatusColor(
                                    withdrawal.status
                                 )} flex items-center gap-1`}
                              >
                                 {withdrawal.status === "pending" && (
                                    <Clock className="h-3 w-3" />
                                 )}
                                 {withdrawal.status === "processing" && (
                                    <RefreshCw className="h-3 w-3" />
                                 )}
                                 {withdrawal.status === "completed" && (
                                    <CheckCircle className="h-3 w-3" />
                                 )}
                                 {withdrawal.status === "rejected" && (
                                    <XCircle className="h-3 w-3" />
                                 )}
                                 {withdrawal.status || "Pending"}
                              </Badge>
                           </td>
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {formatDate(
                                       withdrawal.requestedAt ||
                                          withdrawal.createdAt
                                    )}
                                 </p>
                                 {withdrawal.completedAt && (
                                    <p className="text-sm text-gray-500">
                                       Completed:{" "}
                                       {formatDate(withdrawal.completedAt)}
                                    </p>
                                 )}
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex gap-2">
                                 <Dialog
                                    open={isModalOpen}
                                    onOpenChange={setIsModalOpen}
                                    className=""
                                 >
                                    <DialogTrigger asChild>
                                       <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                             setSelectedWithdrawal(withdrawal);
                                             setAdminNote("");
                                             setIsModalOpen(true);
                                          }}
                                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                                          title="View withdrawal details"
                                       >
                                          <Eye className="h-4 w-4" />
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto ">
                                       <DialogHeader className="pb-4 border-b ">
                                          <DialogTitle className="text-xl font-bold text-gray-900">
                                             Withdrawal Request Details
                                          </DialogTitle>
                                       </DialogHeader>
                                       {selectedWithdrawal && (
                                          <WithdrawalDetailsModal
                                             withdrawal={selectedWithdrawal}
                                             onUpdateStatus={
                                                updateWithdrawalStatus
                                             }
                                             adminNote={adminNote}
                                             setAdminNote={setAdminNote}
                                          />
                                       )}
                                    </DialogContent>
                                 </Dialog>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>{" "}
         {/* Pagination */}
         {!loading && withdrawals.length > 0 && (
            <div className="flex items-center justify-between mt-6">
               <p className="text-sm text-gray-600">
                  Showing {withdrawals.length} of{" "}
                  {stats.totalWithdrawalsCount || 0} withdrawals
               </p>
               <div className="flex gap-2">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                     }
                     disabled={currentPage === 1}
                  >
                     Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                     Page {currentPage} of {totalPages}
                  </span>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                     }
                     disabled={currentPage === totalPages}
                  >
                     Next
                  </Button>
               </div>
            </div>
         )}
      </Card>
   );
   // Withdrawal Details Modal Component
   const WithdrawalDetailsModal = ({
      withdrawal,
      onUpdateStatus,
      adminNote,
      setAdminNote,
   }) => (
      <div className="space-y-6 ">
         {/* Withdrawal Info */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <Label className="text-sm font-semibold text-gray-700">
                     User Information
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                     <p className="font-semibold text-gray-900">
                        {withdrawal.userId?.name ||
                           withdrawal.userId?.fullName ||
                           "Unknown User"}
                     </p>
                     <p className="text-sm text-gray-600">
                        {withdrawal.userId?.email || "No email provided"}
                     </p>
                     {withdrawal.userId?.phone && (
                        <p className="text-sm text-gray-600">
                           Phone: {withdrawal.userId.phone}
                        </p>
                     )}
                  </div>
               </div>

               <div>
                  <Label className="text-sm font-semibold text-gray-700">
                     Withdrawal Method
                  </Label>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                     <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#004aad]" />
                        <p className="capitalize font-medium text-[#004aad]">
                           {withdrawal.withdrawalMethod?.replace("_", " ") ||
                              "Bank Transfer"}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <Label className="text-sm font-semibold text-gray-700">
                     Amount
                  </Label>
                  <div className="mt-2 p-4 bg-green-50 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <p className="text-2xl font-bold text-green-900">
                           {formatCurrency(
                              withdrawal.amount || 0,
                              withdrawal.currency
                           )}
                        </p>
                     </div>
                     {withdrawal.processingFee > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                           Processing Fee:{" "}
                           {formatCurrency(
                              withdrawal.processingFee,
                              withdrawal.currency
                           )}
                        </p>
                     )}
                     {withdrawal.netAmount && (
                        <p className="text-sm text-green-700 mt-1 font-semibold">
                           Net Amount:{" "}
                           {formatCurrency(
                              withdrawal.netAmount,
                              withdrawal.currency
                           )}
                        </p>
                     )}
                  </div>
               </div>

               <div>
                  <Label className="text-sm font-semibold text-gray-700">
                     Status
                  </Label>
                  <div className="mt-2">
                     <Badge
                        className={`${getStatusColor(
                           withdrawal.status
                        )} px-3 py-1 text-sm font-medium flex items-center gap-2 w-fit`}
                     >
                        {withdrawal.status === "pending" && (
                           <Clock className="h-3 w-3" />
                        )}
                        {withdrawal.status === "processing" && (
                           <RefreshCw className="h-3 w-3" />
                        )}
                        {withdrawal.status === "completed" && (
                           <CheckCircle className="h-3 w-3" />
                        )}
                        {withdrawal.status === "rejected" && (
                           <XCircle className="h-3 w-3" />
                        )}
                        {(withdrawal.status || "Pending").toUpperCase()}
                     </Badge>
                  </div>
               </div>
            </div>
         </div>

         {/* Request Details */}
         <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-semibold text-gray-700">
               Request Details
            </Label>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
               <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Requested:</span>
                  <span className="ml-2 font-medium">
                     {formatDate(
                        withdrawal.requestedAt || withdrawal.createdAt
                     )}
                  </span>
               </div>
               {withdrawal.processedAt && (
                  <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-[#004aad]" />
                     <span className="text-gray-600">Processed:</span>
                     <span className="ml-2 font-medium">
                        {formatDate(withdrawal.processedAt)}
                     </span>
                  </div>
               )}
               {withdrawal.completedAt && (
                  <div className="flex items-center gap-2">
                     <CheckCircle className="h-4 w-4 text-green-500" />
                     <span className="text-gray-600">Completed:</span>
                     <span className="ml-2 font-medium">
                        {formatDate(withdrawal.completedAt)}
                     </span>
                  </div>
               )}
               {withdrawal.transactionId && (
                  <div className="flex items-center gap-2">
                     <FileText className="h-4 w-4 text-purple-500" />
                     <span className="text-gray-600">Transaction ID:</span>
                     <span className="ml-2 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                        {withdrawal.transactionId}
                     </span>
                  </div>
               )}
            </div>
         </div>

         {/* Bank Details */}
         {withdrawal.bankDetails && (
            <div>
               <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Details
               </Label>
               <div className="mt-2 bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                     <span className="text-gray-600">Bank Name:</span>
                     <span className="font-medium">
                        {withdrawal.bankDetails.bankName || "Not specified"}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-600">Account:</span>
                     <span className="font-mono">
                        {withdrawal.bankDetails.accountNumber}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-600">Account Holder:</span>
                     <span className="font-medium">
                        {withdrawal.bankDetails.accountHolderName ||
                           "Not specified"}
                     </span>
                  </div>
                  {withdrawal.bankDetails.routingNumber && (
                     <div className="flex justify-between">
                        <span className="text-gray-600">Routing Number:</span>
                        <span className="font-mono">
                           {withdrawal.bankDetails.routingNumber}
                        </span>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* PayPal Details */}
         {withdrawal.paypalDetails && (
            <div>
               <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PayPal Details
               </Label>
               <div className="mt-2 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                     <span className="text-gray-600">PayPal Email:</span>
                     <span className="font-medium">
                        {withdrawal.paypalDetails.email || "Not specified"}
                     </span>
                  </div>
               </div>
            </div>
         )}

         {/* Crypto Details */}
         {withdrawal.cryptoDetails && (
            <div>
               <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Crypto Details
               </Label>
               <div className="mt-2 bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                     <span className="text-gray-600">Currency:</span>
                     <span className="font-medium uppercase">
                        {withdrawal.cryptoDetails.currency || "BTC"}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-600">Wallet Address:</span>
                     <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded break-all">
                        {withdrawal.cryptoDetails.walletAddress ||
                           "Not specified"}
                     </span>
                  </div>
               </div>
            </div>
         )}

         {/* Admin Actions */}
         {withdrawal.status === "pending" && (
            <div className="border-t pt-6">
               <Label className="text-sm font-semibold text-gray-700">
                  Admin Actions
               </Label>
               <div className="mt-4 space-y-4">
                  <div>
                     <Label
                        htmlFor="adminNote"
                        className="text-sm text-gray-600"
                     >
                        Add Note (Optional)
                     </Label>
                     <Textarea
                        id="adminNote"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add a note about this withdrawal decision..."
                        className="mt-2"
                        rows={3}
                     />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                     {/* <Button
                        onClick={() =>
                           onUpdateStatus(withdrawal._id, "processing")
                        }
                        className="bg-[#004aad] text-white px-6 py-2"
                     >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                     </Button> */}
                     <Button
                        onClick={() =>
                           onUpdateStatus(withdrawal._id, "completed")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                     >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                     </Button>
                     <Button
                        onClick={() =>
                           onUpdateStatus(withdrawal._id, "rejected")
                        }
                        variant="destructive"
                        className="px-6 py-2"
                     >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Admin Notes History */}
         {withdrawal.adminNotes?.length > 0 && (
            <div className="border-t pt-6">
               <Label className="text-sm font-semibold text-gray-700">
                  Admin Notes History
               </Label>
               <div className="mt-3 space-y-3">
                  {withdrawal.adminNotes.map((note, index) => (
                     <div
                        key={index}
                        className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
                     >
                        <p className="text-sm text-gray-800">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                           {formatDate(note.addedAt)} by{" "}
                           {note.addedBy?.fullName || "Admin"}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
   return (
      <>
      <NavbarSection/>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6 mt-2">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200 gap-6">
               {/* Left Section */}
               <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#004aad]">
                     Withdrawal Management
                  </h1>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg">
                     Manage payment withdrawals and view analytics
                  </p>
               </div>

               {/* Right Section */}
               <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg w-full sm:w-auto">
                  {/* Toggle */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                     <Label
                        htmlFor="graphical-view"
                        className="text-sm font-semibold text-gray-700"
                     >
                        Graphical View
                     </Label>
                     <Switch
                        id="graphical-view"
                        checked={isGraphicalView}
                        onCheckedChange={setIsGraphicalView}
                        className="data-[state=checked]:bg-[#004aad]"
                     />
                  </div>

                  {/* Export Button (optional) */}
                  {/* <Button
      variant="outline"
      onClick={() => window.print()}
      className="w-full sm:w-auto px-6 py-2 border-[#004aad] text-[#004aad] hover:bg-blue-50 hover:border-[#004aad]"
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button> */}
               </div>
            </div>
            {/* Stats Cards */}
            <StatsCards /> {/* Main Content */}
            <Tabs defaultValue="withdrawals" className="space-y-8">
               <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                  <TabsTrigger
                     value="withdrawals"
                     className="px-6 py-3 text-sm font-semibold data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                     Withdrawals
                  </TabsTrigger>
                  <TabsTrigger
                     value="payments"
                     className="px-6 py-3 text-sm font-semibold data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                     Payment History
                  </TabsTrigger>
                  <TabsTrigger
                     value="analytics"
                     className="px-6 py-3 text-sm font-semibold data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                     Analytics
                  </TabsTrigger>
               </TabsList>
               <TabsContent value="withdrawals">
                  {isGraphicalView ? <ChartsView /> : <TableView />}
               </TabsContent>{" "}
               <TabsContent value="payments">
                  <PaymentHistoryView />
               </TabsContent>
               <TabsContent value="analytics">
                  <ChartsView />
               </TabsContent>
            </Tabs>{" "}
         </div>
      </div>
      </>
   );
};
// Payment History View Component
const PaymentHistoryView = () => {
   const [payments, setPayments] = useState([]);
   const [loadingPayments, setLoadingPayments] = useState(false);
   const [paymentPage, setPaymentPage] = useState(1);
   const [paymentTotalPages, setPaymentTotalPages] = useState(1);

   const fetchPayments = React.useCallback(async () => {
      try {
         setLoadingPayments(true);
         const token = localStorage.getItem("accessToken");
         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/history`,
            {
               headers: { Authorization: `Bearer ${token}` },
               params: {
                  page: paymentPage,
                  limit: 10,
               },
            }
         );

         setPayments(response.data.data.payments || []);
         setPaymentTotalPages(response.data.data.pagination?.totalPages || 1);
      } catch (error) {
         console.error("Error fetching payments:", error);
         toast.error("Failed to fetch payment history");
      } finally {
         setLoadingPayments(false);
      }
   }, [paymentPage]);

   React.useEffect(() => {
      fetchPayments();
   }, [fetchPayments]);

   return (
      <Card className="p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <Button onClick={fetchPayments} disabled={loadingPayments}>
               <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                     loadingPayments ? "animate-spin" : ""
                  }`}
               />
               Refresh
            </Button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full table-auto">
               <thead>
                  <tr className="border-b">
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Client
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Job
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Amount
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Fees
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Status
                     </th>
                     <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Date
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {loadingPayments ? (
                     <tr>
                        <td colSpan="6" className="py-8 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Loading payments...
                           </div>
                        </td>
                     </tr>
                  ) : payments.length === 0 ? (
                     <tr>
                        <td
                           colSpan="6"
                           className="py-8 text-center text-gray-500"
                        >
                           <div className="flex flex-col items-center gap-2">
                              <FileText className="h-8 w-8 text-gray-300" />
                              No payments found
                           </div>
                        </td>
                     </tr>
                  ) : (
                     payments.map((payment) => (
                        <tr
                           key={payment._id}
                           className="border-b hover:bg-gray-50"
                        >
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {payment.clientId?.fullName ||
                                       payment.clientId?.name ||
                                       "Unknown Client"}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                    {payment.clientId?.email ||
                                       "No email provided"}
                                 </p>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {payment.jobId?.title || "Job Title"}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                    ID: {payment.jobId?._id?.slice(-8) || "N/A"}
                                 </p>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div>
                                 <p className="font-medium">
                                    {formatCurrency(payment.baseAmount || 0)}
                                 </p>
                                 <p className="text-sm text-gray-500">
                                    Total:{" "}
                                    {formatCurrency(payment.totalAmount || 0)}
                                 </p>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <div>
                                 <p className="text-sm">
                                    Platform:{" "}
                                    {formatCurrency(payment.platformFee || 0)}
                                 </p>
                                 <p className="text-sm">
                                    Processing:{" "}
                                    {formatCurrency(payment.processingFee || 0)}
                                 </p>
                              </div>
                           </td>
                           <td className="py-3 px-4">
                              <Badge
                                 className={`${getStatusColor(
                                    payment.status
                                 )} flex items-center gap-1`}
                              >
                                 {payment.status === "pending" && (
                                    <Clock className="h-3 w-3" />
                                 )}
                                 {payment.status === "processing" && (
                                    <RefreshCw className="h-3 w-3" />
                                 )}
                                 {payment.status === "completed" && (
                                    <CheckCircle className="h-3 w-3" />
                                 )}
                                 {payment.status === "succeeded" && (
                                    <CheckCircle className="h-3 w-3" />
                                 )}
                                 {payment.status === "failed" && (
                                    <XCircle className="h-3 w-3" />
                                 )}
                                 {payment.status || "Pending"}
                              </Badge>
                           </td>
                           <td className="py-3 px-4">
                              <p>{formatDate(payment.createdAt)}</p>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* Payment Pagination */}
         <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
               Showing {payments.length} payments
            </p>
            <div className="flex gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                     setPaymentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paymentPage === 1}
               >
                  Previous
               </Button>
               <span className="px-3 py-1 text-sm">
                  Page {paymentPage} of {paymentTotalPages}
               </span>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                     setPaymentPage((prev) =>
                        Math.min(paymentTotalPages, prev + 1)
                     )
                  }
                  disabled={paymentPage === paymentTotalPages}
               >
                  Next
               </Button>
            </div>
         </div>
      </Card>
   );
};

export default AdminWithdrawManagement;
