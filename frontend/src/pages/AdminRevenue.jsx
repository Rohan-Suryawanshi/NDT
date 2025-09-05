import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
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
   AreaChart,
   Area,
} from "recharts";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";
import {
   TrendingUp,
   TrendingDown,
   DollarSign,
   Users,
   CreditCard,
   Wallet,
   PieChart as PieChartIcon,
   BarChart3,
   Calendar,
   CalendarDays,
   Download,
   Filter,
   RefreshCw,
   Settings,
} from "lucide-react";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const AdminRevenue = () => {
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [revenueData, setRevenueData] = useState({
      totalRevenue: 0,
      totalPayments: 0,
      totalWithdrawals: 0,
      totalUsers: 0,
      activeUsers: 0,
      pendingWithdrawals: 0,
      monthlyTrends: {
         payments: [],
         withdrawals: [],
      },
      withdrawalStatusCounts: [],
      totalWithdrawalsCount: 0,
   });
   const [platformSettings, setPlatformSettings] = useState({
      platformFeePercentage: 5,
      processingFeePercentage: 2.9,
      fixedProcessingFee: 0.3,
      providerCommissionPercentage: 85,
      inspectorCommissionPercentage: 80,
      minimumWithdrawalAmount: 10,
      withdrawalProcessingDays: 7,
      withdrawalFees: {
         bank_transfer: { percentage: 0, fixed: 0 },
         paypal: { percentage: 1, fixed: 0 },
         stripe: { percentage: 0.5, fixed: 0 },
         crypto: { percentage: 2, fixed: 0 },
      },
   });
   const [paymentsHistory, setPaymentsHistory] = useState([]);
   const [withdrawalsHistory, setWithdrawalsHistory] = useState([]);
   const [selectedPeriod, setSelectedPeriod] = useState("6months");
   const [selectedTab, setSelectedTab] = useState("overview");
   const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
   const [customDateRange, setCustomDateRange] = useState({ startDate: "", endDate: "" });
   const [exportLoading, setExportLoading] = useState(false);

   // Create axios instance with auth
   const createAxiosInstance = useCallback(() => {
      const token = localStorage.getItem("accessToken");
      return axios.create({
         baseURL: BACKEND_URL,
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });
   }, []);

   // Fetch revenue statistics
   const fetchRevenueStats = useCallback(async () => {
      try {
         const axiosInstance = createAxiosInstance();
         let params = {};
         
         if (selectedPeriod === "custom" && customDateRange.startDate && customDateRange.endDate) {
            params = {
               startDate: customDateRange.startDate,
               endDate: customDateRange.endDate,
               dateRange: "custom"
            };
         } else if (selectedPeriod !== "all") {
            params = { dateRange: selectedPeriod };
         }
         
         const response = await axiosInstance.get(
            "/api/v1/payments/admin/stats",
            { params }
         );

         if (response.data.success) {
            const data = response.data.data;
            setRevenueData({
               totalRevenue: data.totalPayments || 0,
               totalPayments: data.totalPayments || 0,
               totalWithdrawals: data.totalWithdrawals || 0,
               totalUsers: data.totalUsers || 0,
               activeUsers: data.activeUsers || 0,
               pendingWithdrawals: data.pendingWithdrawals || 0,
               monthlyTrends: data.monthlyTrends || {
                  payments: [],
                  withdrawals: [],
               },
               withdrawalStatusCounts: data.withdrawalStatusCounts || [],
               totalWithdrawalsCount: data.totalWithdrawalsCount || 0,
            });
         }
      } catch (error) {
         console.error("Error fetching revenue stats:", error);
         toast.error("Failed to fetch revenue statistics");
      }
   }, [createAxiosInstance, selectedPeriod, customDateRange]);

   // CSV Export Functions
   const convertToCSV = (data, type) => {
      if (!data || data.length === 0) return "";

      let headers, rows;

      if (type === "revenue") {
         headers = [
            "Period",
            "Month",
            "Year", 
            "Total Payments",
            "Total Withdrawals",
            "Net Revenue",
            "Payment Count",
            "Withdrawal Count"
         ];

         rows = data.map(item => [
            `${item.month} ${item.year}`,
            item.month,
            item.year,
            item.payments || 0,
            item.withdrawals || 0,
            item.revenue || 0,
            item.paymentCount || 0,
            item.withdrawalCount || 0
         ]);
      } else if (type === "payments") {
         headers = [
            "Payment ID",
            "Client Name",
            "Amount",
            "Status",
            "Payment Method",
            "Created Date",
            "Transaction ID"
         ];

         rows = paymentsHistory.map(payment => [
            payment._id || "",
            payment.clientId?.name || payment.clientId?.fullName || "",
            payment.totalAmount || 0,
            payment.status || "",
            payment.paymentMethod || "",
            new Date(payment.createdAt).toLocaleDateString(),
            payment.transactionId || ""
         ]);
      } else if (type === "withdrawals") {
         headers = [
            "Withdrawal ID",
            "User Name",
            "Amount",
            "Status",
            "Method",
            "Requested Date",
            "Processing Fee",
            "Net Amount"
         ];

         rows = withdrawalsHistory.map(withdrawal => [
            withdrawal._id || "",
            withdrawal.userId?.name || withdrawal.userId?.fullName || "",
            withdrawal.amount || 0,
            withdrawal.status || "",
            withdrawal.withdrawalMethod || "",
            new Date(withdrawal.requestedAt || withdrawal.createdAt).toLocaleDateString(),
            withdrawal.processingFee || 0,
            withdrawal.netAmount || (withdrawal.amount - (withdrawal.processingFee || 0))
         ]);
      }

      // Escape CSV values
      const escapeCSV = (value) => {
         if (value === null || value === undefined) return "";
         const stringValue = String(value);
         if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
         }
         return stringValue;
      };

      return [
         headers.join(","),
         ...rows.map(row => row.map(escapeCSV).join(","))
      ].join("\n");
   };

   const downloadCSV = (csvContent, filename) => {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      
      if (link.download !== undefined) {
         const url = URL.createObjectURL(blob);
         link.setAttribute("href", url);
         link.setAttribute("download", filename);
         link.style.visibility = "hidden";
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      }
   };

   const exportRevenueData = async () => {
      try {
         setExportLoading(true);
         const csvContent = convertToCSV(monthlyData, "revenue");
         const timestamp = new Date().toISOString().split("T")[0];
         const periodText = selectedPeriod === "custom" 
            ? `_${customDateRange.startDate}_to_${customDateRange.endDate}`
            : `_${selectedPeriod}`;
         
         downloadCSV(csvContent, `revenue_report${periodText}_${timestamp}.csv`);
         toast.success("Revenue data exported successfully");
      } catch (error) {
         console.error("Error exporting revenue data:", error);
         toast.error("Failed to export revenue data");
      } finally {
         setExportLoading(false);
      }
   };

   // Fetch payments history
   const fetchPaymentsHistory = useCallback(async () => {
      try {
         const axiosInstance = createAxiosInstance();
         const response = await axiosInstance.get(
            "/api/v1/payments/history?limit=10"
         );

         if (response.data.success) {
            setPaymentsHistory(response.data.data.payments || []);
         }
      } catch (error) {
         console.error("Error fetching payments history:", error);
      }
   }, [createAxiosInstance]);

   // Fetch withdrawals data
   const fetchWithdrawalsHistory = useCallback(async () => {
      try {
         const axiosInstance = createAxiosInstance();
         const response = await axiosInstance.get(
            "/api/v1/payments/admin/withdrawals?limit=10"
         );

         if (response.data.success) {
            setWithdrawalsHistory(response.data.data.withdrawals || []);
         }
      } catch (error) {
         console.error("Error fetching withdrawals history:", error);
      }
   }, [createAxiosInstance]);

   // Fetch platform settings
   const fetchPlatformSettings = useCallback(async () => {
      try {
         const axiosInstance = createAxiosInstance();
         const response = await axiosInstance.get("/api/v1/admin/settings");

         if (response.data.success) {
            setPlatformSettings(response.data.data);
         }
      } catch (error) {
         console.error("Error fetching platform settings:", error);
         toast.error("Failed to fetch platform settings");
      }
   }, [createAxiosInstance]);

   // Initialize data
   useEffect(() => {
      const initializeData = async () => {
         setLoading(true);
         await Promise.all([
            fetchRevenueStats(),
            fetchPaymentsHistory(),
            fetchWithdrawalsHistory(),
            fetchPlatformSettings(),
         ]);
         setLoading(false);
      };

      initializeData();
   }, [
      fetchRevenueStats,
      fetchPaymentsHistory,
      fetchWithdrawalsHistory,
      fetchPlatformSettings,
   ]);

   // Refetch data when period changes
   useEffect(() => {
      if (selectedPeriod !== "custom") {
         fetchRevenueStats();
      }
   }, [selectedPeriod, fetchRevenueStats]);

   // Refresh data
   const handleRefresh = useCallback(async () => {
      setRefreshing(true);
      await Promise.all([
         fetchRevenueStats(),
         fetchPaymentsHistory(),
         fetchWithdrawalsHistory(),
         fetchPlatformSettings(),
      ]);
      setRefreshing(false);
      toast.success("Data refreshed successfully");
   }, [
      fetchRevenueStats,
      fetchPaymentsHistory,
      fetchWithdrawalsHistory,
      fetchPlatformSettings,
   ]);

   // Format currency
   const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: "USD",
      }).format(amount || 0);
   };

   // Format percentage
   const formatPercentage = (value) => {
      return `${(value || 0).toFixed(1)}%`;
   };

   // Calculate revenue metrics
   const calculateMetrics = () => {
      const platformRevenue =
         revenueData.totalPayments - revenueData.totalWithdrawals;
      const conversionRate =
         revenueData.totalUsers > 0
            ? (revenueData.activeUsers / revenueData.totalUsers) * 100
            : 0;

      // Calculate processing fees using real platform settings
      const processingFees =
         revenueData.totalPayments *
         (platformSettings.processingFeePercentage / 100);
      const netPlatformRevenue = platformRevenue - processingFees;

      return {
         platformRevenue,
         netPlatformRevenue,
         conversionRate,
         processingFees,
         avgPaymentValue:
            paymentsHistory.length > 0
               ? revenueData.totalPayments / paymentsHistory.length
               : 0,
         pendingWithdrawalRate:
            revenueData.totalWithdrawalsCount > 0
               ? (revenueData.pendingWithdrawals /
                    revenueData.totalWithdrawalsCount) *
                 100
               : 0,
         platformFeePercentage: platformSettings.platformFeePercentage,
         providerCommission: platformSettings.providerCommissionPercentage,
         inspectorCommission: platformSettings.inspectorCommissionPercentage,
      };
   };

   const metrics = calculateMetrics();

   // Prepare chart data with filtering
   const monthlyData = useMemo(() => {
      const monthNames = [
         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      const combinedData = {};

      // Process payments
      revenueData.monthlyTrends.payments?.forEach((item) => {
         const key = `${item._id.year}-${item._id.month}`;
         combinedData[key] = {
            ...combinedData[key],
            month: monthNames[item._id.month - 1],
            year: item._id.year,
            payments: item.total,
            paymentCount: item.count,
         };
      });

      // Process withdrawals
      revenueData.monthlyTrends.withdrawals?.forEach((item) => {
         const key = `${item._id.year}-${item._id.month}`;
         combinedData[key] = {
            ...combinedData[key],
            month: monthNames[item._id.month - 1],
            year: item._id.year,
            withdrawals: item.total,
            withdrawalCount: item.count,
         };
      });

      let filteredData = Object.values(combinedData)
         .map((item) => ({
            ...item,
            revenue: (item.payments || 0) - (item.withdrawals || 0),
            payments: item.payments || 0,
            withdrawals: item.withdrawals || 0,
         }))
         .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
         });

      // Frontend filtering is not needed since backend handles it
      // But we can add additional client-side filtering if needed
      return filteredData;
   }, [revenueData]);

   // Prepare withdrawal status pie chart data
   const withdrawalStatusData = revenueData.withdrawalStatusCounts.map(
      (item) => ({
         name: item._id,
         value: item.count,
         color:
            {
               pending: "#f59e0b",
               processing: "#3b82f6",
               completed: "#10b981",
               rejected: "#ef4444",
               cancelled: "#6b7280",
            }[item._id] || "#6b7280",
      })
   );

   // Colors for charts
   const COLORS = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
   ];

   if (loading) {
      return (
         <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
               <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded"></div>
                     ))}
                  </div>
                  <div className="h-96 bg-gray-200 rounded"></div>
               </div>
            </div>
         </div>
      );
   }

   return (
    <>
    <NavbarSection/>
      <div className="min-h-screen bg-gray-50 p-6 mt-3">
         <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h1 className="text-2xl font-bold text-[#004aad]">
                     Revenue Analytics
                  </h1>
               </div>
               <div className="flex gap-3">
                  <Select
                     value={selectedPeriod}
                     onValueChange={(value) => {
                        setSelectedPeriod(value);
                        if (value === "custom") {
                           setShowCustomDatePicker(true);
                        } else {
                           setShowCustomDatePicker(false);
                           setCustomDateRange({ startDate: "", endDate: "" });
                        }
                     }}
                  >
                     <SelectTrigger className="w-40">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="1month">Last Month</SelectItem>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="1year">Last Year</SelectItem>
                        <SelectItem value="custom">
                           <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              Custom Range
                           </div>
                        </SelectItem>
                     </SelectContent>
                  </Select>
                  <Button
                     onClick={handleRefresh}
                     disabled={refreshing}
                     variant="outline"
                     className="gap-2"
                  >
                     <RefreshCw
                        className={`h-4 w-4 ${
                           refreshing ? "animate-spin" : ""
                        }`}
                     />
                     Refresh
                  </Button>
                  <Button 
                     onClick={exportRevenueData}
                     disabled={exportLoading}
                     className="gap-2 bg-[#004aad] hover:bg-[#003a8c]"
                  >
                     <Download className={`h-4 w-4 ${exportLoading ? "animate-spin" : ""}`} />
                     {exportLoading ? "Exporting..." : "Export CSV"}
                  </Button>
               </div>
            </div>

            {/* Custom Date Range Picker */}
            {showCustomDatePicker && (
               <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[#004aad]" />
                        <Label className="text-sm font-semibold text-[#004aad]">
                           Select Custom Date Range
                        </Label>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                           <Label htmlFor="startDate" className="text-sm text-gray-600">
                              Start Date
                           </Label>
                           <Input
                              id="startDate"
                              type="date"
                              value={customDateRange.startDate}
                              onChange={(e) => setCustomDateRange(prev => ({
                                 ...prev,
                                 startDate: e.target.value
                              }))}
                              max={new Date().toISOString().split('T')[0]}
                              className="mt-1"
                           />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                           <Label htmlFor="endDate" className="text-sm text-gray-600">
                              End Date
                           </Label>
                           <Input
                              id="endDate"
                              type="date"
                              value={customDateRange.endDate}
                              onChange={(e) => setCustomDateRange(prev => ({
                                 ...prev,
                                 endDate: e.target.value
                              }))}
                              min={customDateRange.startDate}
                              max={new Date().toISOString().split('T')[0]}
                              className="mt-1"
                           />
                        </div>
                        <div className="flex gap-2">
                           <Button
                              onClick={() => {
                                 setSelectedPeriod("custom");
                                 setShowCustomDatePicker(false);
                                 fetchRevenueStats();
                              }}
                              className="bg-[#004aad] hover:bg-[#003a8c] text-white px-6"
                              disabled={!customDateRange.startDate || !customDateRange.endDate}
                           >
                              <Calendar className="h-4 w-4 mr-2" />
                              Apply
                           </Button>
                           <Button
                              onClick={() => {
                                 setCustomDateRange({ startDate: "", endDate: "" });
                                 setSelectedPeriod("6months");
                                 setShowCustomDatePicker(false);
                                 fetchRevenueStats();
                              }}
                              variant="outline"
                              className="border-gray-300 text-gray-600 hover:bg-gray-50 px-6"
                           >
                              Clear
                           </Button>
                        </div>
                     </div>
                     {selectedPeriod === "custom" && customDateRange.startDate && customDateRange.endDate && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200">
                           <p className="text-sm text-gray-600">
                              <span className="font-medium">Selected Range:</span>{" "}
                              {new Date(customDateRange.startDate).toLocaleDateString()} to {new Date(customDateRange.endDate).toLocaleDateString()}
                           </p>
                        </div>
                     )}
                  </div>
               </Card>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">
                        Total Revenue
                     </CardTitle>
                     <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(metrics.platformRevenue)}
                     </div>
                     <p className="text-xs text-gray-600 mt-1">
                        Platform net revenue
                     </p>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">
                        Total Payments
                     </CardTitle>
                     <CreditCard className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(revenueData.totalPayments)}
                     </div>
                     <p className="text-xs text-gray-600 mt-1">
                        Gross payment volume
                     </p>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">
                        Total Withdrawals
                     </CardTitle>
                     <Wallet className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(revenueData.totalWithdrawals)}
                     </div>
                     <p className="text-xs text-gray-600 mt-1">
                        Provider payouts
                     </p>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">
                        Active Users
                     </CardTitle>
                     <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-bold text-purple-600">
                        {revenueData.activeUsers}
                     </div>
                     <p className="text-xs text-gray-600 mt-1">
                        {formatPercentage(metrics.conversionRate)} conversion
                        rate
                     </p>
                  </CardContent>
               </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">
                        Average Payment Value
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-blue-600">
                        {formatCurrency(metrics.avgPaymentValue)}
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">
                        Pending Withdrawals
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-orange-600">
                        {revenueData.pendingWithdrawals}
                     </div>
                     <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600">
                           {formatPercentage(metrics.pendingWithdrawalRate)} of
                           total requests
                        </span>
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">
                        Platform Commission
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-green-600">
                        {formatPercentage(metrics.platformFeePercentage)}
                     </div>
                     <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600">
                           Current platform fee rate
                        </span>
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader>
                     <CardTitle className="text-lg">Processing Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(metrics.processingFees)}
                     </div>
                     <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600">
                           {formatPercentage(
                              platformSettings.processingFeePercentage
                           )}{" "}
                           + ${platformSettings.fixedProcessingFee}
                        </span>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Charts and Analytics */}
            <Tabs
               value={selectedTab}
               onValueChange={setSelectedTab}
               className="space-y-6"
            >
               <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white gap-2">
                     <BarChart3 className="h-4 w-4" />
                     Overview
                  </TabsTrigger>
                  {/* <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger> */}
                  <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white gap-2">
                     <PieChartIcon className="h-4 w-4" />
                     Withdrawals
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white gap-2">
                     <Settings className="h-4 w-4" />
                     Platform
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white gap-2">
                     <Calendar className="h-4 w-4" />
                     Details
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Revenue Overview Bar Chart */}
                     {/* <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Comparison</CardTitle>
                  <CardDescription>
                    Payments vs Withdrawals over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="payments" fill="#3b82f6" name="Payments" />
                      <Bar dataKey="withdrawals" fill="#f59e0b" name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card> */}

                     {/* Withdrawal Status Pie Chart */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Withdrawal Status Distribution</CardTitle>
                           <CardDescription>
                              Current status of all withdrawal requests
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                 <Pie
                                    data={withdrawalStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                       `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                 >
                                    {withdrawalStatusData.map(
                                       (entry, index) => (
                                          <Cell
                                             key={`cell-${index}`}
                                             fill={entry.color}
                                          />
                                       )
                                    )}
                                 </Pie>
                                 <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                        </CardContent>
                     </Card>
                  </div>
               </TabsContent>

               <TabsContent value="trends" className="space-y-6">
                  {/* Revenue Trend Line Chart */}
                  <Card>
                     <CardHeader>
                        <CardTitle>Revenue Trend Analysis</CardTitle>
                        <CardDescription>
                           Net revenue trend over the selected period
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                           <AreaChart data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip
                                 formatter={(value) => formatCurrency(value)}
                              />
                              <Legend />
                              <Area
                                 type="monotone"
                                 dataKey="revenue"
                                 stroke="#10b981"
                                 fill="#10b981"
                                 fillOpacity={0.3}
                                 name="Net Revenue"
                              />
                              <Line
                                 type="monotone"
                                 dataKey="payments"
                                 stroke="#3b82f6"
                                 name="Gross Payments"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </CardContent>
                  </Card>
               </TabsContent>

               <TabsContent value="withdrawals" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Withdrawal Trends */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Withdrawal Trends</CardTitle>
                           <CardDescription>
                              Monthly withdrawal patterns
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={monthlyData}>
                                 <CartesianGrid strokeDasharray="3 3" />
                                 <XAxis dataKey="month" />
                                 <YAxis />
                                 <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                 />
                                 <Legend />
                                 <Line
                                    type="monotone"
                                    dataKey="withdrawals"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Withdrawals"
                                 />
                              </LineChart>
                           </ResponsiveContainer>
                        </CardContent>
                     </Card>

                     {/* Recent Withdrawals */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Recent Withdrawal Requests</CardTitle>
                           <CardDescription>
                              Latest withdrawal requests and their status
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-3">
                              {withdrawalsHistory
                                 .slice(0, 5)
                                 .map((withdrawal, index) => (
                                    <div
                                       key={index}
                                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                       <div>
                                          <p className="font-medium">
                                             {formatCurrency(withdrawal.amount)}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                             {withdrawal.withdrawalMethod}
                                          </p>
                                       </div>
                                       <Badge
                                          className={
                                             withdrawal.status === "completed"
                                                ? "bg-green-100 text-green-700 border border-green-400"
                                                : withdrawal.status ===
                                                  "pending"
                                                ? "bg-yellow-100 text-yellow-700 border border-yellow-400"
                                                : withdrawal.status ===
                                                  "processing"
                                                ? "bg-blue-100 text-blue-700 border border-blue-400"
                                                : "bg-red-100 text-red-700 border border-red-400"
                                          }
                                       >
                                          {withdrawal.status}
                                       </Badge>
                                    </div>
                                 ))}
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               </TabsContent>

               <TabsContent value="settings" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Platform Fee Settings */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Platform Fee Configuration</CardTitle>
                           <CardDescription>
                              Current platform fee and commission settings
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                 <div>
                                    <p className="font-medium text-blue-900">
                                       Platform Fee
                                    </p>
                                    <p className="text-sm text-blue-700">
                                       Per transaction
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold text-blue-600">
                                    {formatPercentage(
                                       platformSettings.platformFeePercentage
                                    )}
                                 </span>
                              </div>

                              {/* <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                 <div>
                                    <p className="font-medium text-green-900">
                                       Provider Commission
                                    </p>
                                    <p className="text-sm text-green-700">
                                       Provider keeps
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold text-green-600">
                                    {formatPercentage(
                                       platformSettings.providerCommissionPercentage
                                    )}
                                 </span>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                 <div>
                                    <p className="font-medium text-purple-900">
                                       Inspector Commission
                                    </p>
                                    <p className="text-sm text-purple-700">
                                       Inspector keeps
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold text-purple-600">
                                    {formatPercentage(
                                       platformSettings.inspectorCommissionPercentage
                                    )}
                                 </span>
                              </div> */}

                              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                 <div>
                                    <p className="font-medium text-red-900">
                                       Processing Fee
                                    </p>
                                    <p className="text-sm text-red-700">
                                       Stripe processing
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold text-red-600">
                                    {formatPercentage(
                                       platformSettings.processingFeePercentage
                                    )}{" "}
                                    + ${platformSettings.fixedProcessingFee}
                                 </span>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Withdrawal Settings */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Withdrawal Configuration</CardTitle>
                           <CardDescription>
                              Withdrawal limits and processing settings
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                 <div>
                                    <p className="font-medium">
                                       Minimum Withdrawal
                                    </p>
                                    <p className="text-sm text-gray-600">
                                       Minimum amount allowed
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold">
                                    {formatCurrency(
                                       platformSettings.minimumWithdrawalAmount
                                    )}
                                 </span>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                 <div>
                                    <p className="font-medium">
                                       Processing Time
                                    </p>
                                    <p className="text-sm text-gray-600">
                                       Business days
                                    </p>
                                 </div>
                                 <span className="text-xl font-bold">
                                    {platformSettings.withdrawalProcessingDays}{" "}
                                    days
                                 </span>
                              </div>

                              <div className="mt-4">
                                 <h4 className="font-medium mb-2">
                                    Withdrawal Method Fees
                                 </h4>
                                 <div className="space-y-2">
                                    {Object.entries(
                                       platformSettings.withdrawalFees || {}
                                    ).map(([method, fees]) => (
                                       <div
                                          key={method}
                                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                       >
                                          <span className="capitalize font-medium">
                                             {method.replace("_", " ")}
                                          </span>
                                          <span className="text-sm">
                                             {fees.percentage > 0
                                                ? `${formatPercentage(
                                                     fees.percentage
                                                  )}`
                                                : ""}
                                             {fees.percentage > 0 &&
                                             fees.fixed > 0
                                                ? " + "
                                                : ""}
                                             {fees.fixed > 0
                                                ? `$${fees.fixed}`
                                                : ""}
                                             {fees.percentage === 0 &&
                                             fees.fixed === 0
                                                ? "Free"
                                                : ""}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </div>

                  {/* Revenue Calculations Based on Settings */}
                  <Card>
                     <CardHeader>
                        <CardTitle>Revenue Impact Analysis</CardTitle>
                        <CardDescription>
                           How current platform settings affect revenue
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-bold text-blue-900 mb-2">
                                 Gross Revenue
                              </h4>
                              <p className="text-2xl font-bold text-blue-600">
                                 {formatCurrency(revenueData.totalPayments)}
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                 Total payments received
                              </p>
                           </div>

                           <div className="text-center p-4 bg-red-50 rounded-lg">
                              <h4 className="font-bold text-red-900 mb-2">
                                 Total Costs
                              </h4>
                              <p className="text-2xl font-bold text-red-600">
                                 {formatCurrency(
                                    revenueData.totalWithdrawals +
                                       metrics.processingFees
                                 )}
                              </p>
                              <p className="text-sm text-red-700 mt-1">
                                 Payouts + processing fees
                              </p>
                           </div>

                           <div className="text-center p-4 bg-green-50 rounded-lg">
                              <h4 className="font-bold text-green-900 mb-2">
                                 Net Platform Revenue
                              </h4>
                              <p className="text-2xl font-bold text-green-600">
                                 {formatCurrency(metrics.netPlatformRevenue)}
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                 {formatPercentage(
                                    (metrics.netPlatformRevenue /
                                       revenueData.totalPayments) *
                                       100
                                 )}{" "}
                                 margin
                              </p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>

               <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Recent Payments Table */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Recent Payments</CardTitle>
                           <CardDescription>
                              Latest payment transactions
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {paymentsHistory
                                    .slice(0, 5)
                                    .map((payment, index) => (
                                       <TableRow key={index}>
                                          <TableCell className="font-medium">
                                             {formatCurrency(
                                                payment.totalAmount
                                             )}
                                          </TableCell>
                                          <TableCell>
                                             <Badge
                                                className={
                                                   payment.status ===
                                                   "succeeded"
                                                      ? "bg-green-100 text-green-700 border border-green-400"
                                                      : "bg-red-100 text-red-700 border border-red-400"
                                                }
                                             >
                                                {payment.status}
                                             </Badge>
                                          </TableCell>
                                          <TableCell>
                                             {new Date(
                                                payment.createdAt
                                             ).toLocaleDateString()}
                                          </TableCell>
                                       </TableRow>
                                    ))}
                              </TableBody>
                           </Table>
                        </CardContent>
                     </Card>

                     {/* Revenue Breakdown */}
                     <Card>
                        <CardHeader>
                           <CardTitle>Revenue Breakdown</CardTitle>
                           <CardDescription>
                              Detailed revenue analysis with platform settings
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium">
                                    Gross Revenue
                                 </span>
                                 <span className="text-sm">
                                    {formatCurrency(revenueData.totalPayments)}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium">
                                    Provider Payouts
                                 </span>
                                 <span className="text-sm text-red-600">
                                    -
                                    {formatCurrency(
                                       revenueData.totalWithdrawals
                                    )}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium">
                                    Processing Fees (
                                    {formatPercentage(
                                       platformSettings.processingFeePercentage
                                    )}{" "}
                                    + ${platformSettings.fixedProcessingFee})
                                 </span>
                                 <span className="text-sm text-red-600">
                                    -{formatCurrency(metrics.processingFees)}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium">
                                    Platform Fee (
                                    {formatPercentage(
                                       platformSettings.platformFeePercentage
                                    )}
                                    )
                                 </span>
                                 <span className="text-sm text-green-600">
                                    +
                                    {formatCurrency(
                                       revenueData.totalPayments *
                                          (platformSettings.platformFeePercentage /
                                             100)
                                    )}
                                 </span>
                              </div>
                              <hr />
                              <div className="flex justify-between items-center font-bold">
                                 <span>Net Platform Revenue</span>
                                 <span className="text-green-600">
                                    {formatCurrency(metrics.netPlatformRevenue)}
                                 </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                 Profit Margin:{" "}
                                 {formatPercentage(
                                    (metrics.netPlatformRevenue /
                                       revenueData.totalPayments) *
                                       100
                                 )}
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               </TabsContent>
            </Tabs>
         </div>
      </div>
      </>
   );
};

export default AdminRevenue;
