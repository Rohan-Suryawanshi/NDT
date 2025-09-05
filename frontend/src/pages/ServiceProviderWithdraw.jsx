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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
   Wallet,
   TrendingUp,
   TrendingDown,
   DollarSign,
   CreditCard,
   History,
   Calendar,
   User,
   MapPin,
   CheckCircle,
   Clock,
   AlertTriangle,
   RefreshCw,
   Download,
   Eye,
   Filter,
   Search,
   Banknote,
   Building2,
   PiggyBank,
   ArrowUpRight,
   ArrowDownLeft,
   FileText,
   Receipt,
   Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

const ServiceProviderWithdraw = () => {
   const currency = JSON.parse(localStorage.getItem("user")).currency;
   const [balance, setBalance] = useState({
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
   });
   const [withdrawHistory, setWithdrawHistory] = useState([]);
   const [paymentHistory, setPaymentHistory] = useState([]);
   const [completedJobs, setCompletedJobs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
   const [withdrawAmount, setWithdrawAmount] = useState("");
   const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
   const [withdrawNotes, setWithdrawNotes] = useState("");
   const [bankDetails, setBankDetails] = useState({
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountHolderName: "",
      swiftCode: ""
   });
   const [paypalDetails, setPaypalDetails] = useState({ email: "" });
   const [cryptoDetails, setCryptoDetails] = useState({ walletAddress: "", currency: "BTC" });
   const [processing, setProcessing] = useState(false);
   const [filters, setFilters] = useState({
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      type: "all",
   });
   const [refreshing, setRefreshing] = useState(false);

   // Withdraw status configurations
   const withdrawStatusConfig = {
      pending: {
         color: "bg-yellow-100 text-yellow-800",
         icon: Clock,
         label: "Pending",
      },
      processing: {
         color: "bg-blue-100 text-blue-800",
         icon: RefreshCw,
         label: "Processing",
      },
      completed: {
         color: "bg-green-100 text-green-800",
         icon: CheckCircle,
         label: "Completed",
      },
      failed: {
         color: "bg-red-100 text-red-800",
         icon: AlertTriangle,
         label: "Failed",
      },
      cancelled: {
         color: "bg-gray-100 text-gray-800",
         icon: AlertTriangle,
         label: "Cancelled",
      },
   };

   // Job status configurations
   const jobStatusConfig = {
      closed: {
         color: "bg-green-100 text-green-800",
         icon: CheckCircle,
         label: "Completed",
      },
      delivered: {
         color: "bg-blue-100 text-blue-800",
         icon: CheckCircle,
         label: "Delivered",
      },
   };

   // Withdrawal methods
   const withdrawMethods = [
      { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
      { value: "paypal", label: "PayPal", icon: CreditCard },
      { value: "stripe", label: "Stripe Transfer", icon: CreditCard },
      { value: "crypto", label: "Cryptocurrency", icon: Banknote }
   ];

   // Fetch balance and earnings data
   const fetchBalance = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");

         if (!token) {
            toast.error("Please login to view balance");
            return;
         }

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/provider-balance`,
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         setBalance(response.data.data);
      } catch (error) {
         console.error("Error fetching balance:", error);
         if (error.response?.status === 401) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("accessToken");
         } else {
            toast.error("Failed to fetch balance");
         }
      }
   }, []);

   // Fetch withdrawal history
   const fetchWithdrawHistory = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/withdraw-history`,
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         setWithdrawHistory(response.data.data.withdrawals || []);
      } catch (error) {
         console.error("Error fetching withdraw history:", error);
         toast.error("Failed to fetch withdrawal history");
      }
   }, []);

   // Fetch payment history from completed jobs
   const fetchPaymentHistory = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/payments/provider-earnings`,
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         setPaymentHistory(response.data.data.payments || []);
      } catch (error) {
         console.error("Error fetching payment history:", error);
         toast.error("Failed to fetch payment history");
      }
   }, []);

   // Fetch completed jobs
   const fetchCompletedJobs = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");

         // Build query parameters
         const params = {
            status: "closed,delivered",
            ...filters,
         };

         const response = await axios.get(
            `${BACKEND_URL}/api/v1/job-requests`,
            {
               headers: { Authorization: `Bearer ${token}` },
               params,
            }
         );

         setCompletedJobs(response.data.data.jobRequests || []);
      } catch (error) {
         console.error("Error fetching completed jobs:", error);
         toast.error("Failed to fetch completed jobs");
      }
   }, [filters]);

   // Fetch all data
   const fetchAllData = useCallback(async () => {
      setLoading(true);
      await Promise.all([
         fetchBalance(),
         fetchWithdrawHistory(),
         fetchPaymentHistory(),
         fetchCompletedJobs(),
      ]);
      setLoading(false);
   }, [
      fetchBalance,
      fetchWithdrawHistory,
      fetchPaymentHistory,
      fetchCompletedJobs,
   ]);

   // Refresh all data
   const refreshData = async () => {
      setRefreshing(true);
      await fetchAllData();
      setRefreshing(false);
      toast.success("Data refreshed successfully");
   };

   // Submit withdrawal request
   const submitWithdrawRequest = async () => {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
         toast.error("Please enter a valid withdrawal amount");
         return;
      }

      if (parseFloat(withdrawAmount) > balance.availableBalance) {
         toast.error("Withdrawal amount cannot exceed available balance");
         return;
      }

      if (parseFloat(withdrawAmount) < 10) {
         toast.error("Minimum withdrawal amount is $10");
         return;
      }

      // Validate payment method details
      if (withdrawMethod === "bank_transfer") {
         if (!bankDetails.accountNumber || !bankDetails.routingNumber || !bankDetails.bankName || !bankDetails.accountHolderName) {
            toast.error("Please fill in all required bank details");
            return;
         }
      } else if (withdrawMethod === "paypal") {
         if (!paypalDetails.email) {
            toast.error("Please enter your PayPal email address");
            return;
         }
      } else if (withdrawMethod === "crypto") {
         if (!cryptoDetails.walletAddress || !cryptoDetails.currency) {
            toast.error("Please enter your crypto wallet details");
            return;
         }
      }

      setProcessing(true);
      try {
         const token = localStorage.getItem("accessToken");
         const requestData = {
            amount: parseFloat(withdrawAmount),
            withdrawalMethod: withdrawMethod,
            metadata: { notes: withdrawNotes.trim(), role: "provider" }
         };
         if (withdrawMethod === "bank_transfer") {
            requestData.bankDetails = bankDetails;
         } else if (withdrawMethod === "paypal") {
            requestData.paypalDetails = paypalDetails;
         } else if (withdrawMethod === "crypto") {
            requestData.cryptoDetails = cryptoDetails;
         }
         await axios.post(
            `${BACKEND_URL}/api/v1/payments/request-withdrawal`,
            requestData,
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );
         toast.success("Withdrawal request submitted successfully");
         setWithdrawDialogOpen(false);
         setWithdrawAmount("");
         setWithdrawNotes("");
         setBankDetails({ accountNumber: "", routingNumber: "", bankName: "", accountHolderName: "", swiftCode: "" });
         setPaypalDetails({ email: "" });
         setCryptoDetails({ walletAddress: "", currency: "BTC" });
         fetchAllData(); // Refresh data
      } catch (error) {
         console.error("Error submitting withdrawal:", error);
         toast.error(error.response?.data?.message || "Failed to submit withdrawal request");
      } finally {
         setProcessing(false);
      }
   };

   // Filter functions
   const filteredWithdrawals = withdrawHistory.filter((withdrawal) => {
      const matchesStatus =
         filters.status === "all" || withdrawal.status === filters.status;
      const matchesSearch =
         !filters.search ||
         withdrawal.amount.toString().includes(filters.search) ||
         withdrawal.method.toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesSearch;
   });

   const filteredPayments = paymentHistory.filter((payment) => {
      const matchesSearch =
         !filters.search ||
         payment.jobTitle
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
         payment.amount.toString().includes(filters.search);

      return matchesSearch;
   });

   const filteredJobs = completedJobs.filter((job) => {
      const matchesSearch =
         !filters.search ||
         job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
         job.clientName.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSearch;
   });

   // Format currency
   // const formatCurrency = (amount) => {
   //    if (!amount) return "$0.00";
   //    return new Intl.NumberFormat("en-US", {
   //       style: "currency",
   //       currency: "USD",
   //    }).format(amount);
   // };

   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`
   };

   // Format date
   const formatDate = (date) => {
      if (!date) return "Not set";
      return new Date(date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   useEffect(() => {
      fetchAllData();
   }, [fetchAllData]);

   return (
      <>
         <NavbarSection />
         <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="mb-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h1 className="text-3xl font-bold text-gray-900">
                        Earnings & Withdrawals
                     </h1>
                     <p className="text-gray-600 mt-1">
                        Manage your earnings, withdrawals, and payment history
                     </p>
                  </div>
                  <div className="flex gap-2">
                     <Button
                        onClick={refreshData}
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

            {loading ? (
               <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
               </div>
            ) : (
               <>
                  {/* Balance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                     <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardContent className="pt-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-green-100 text-sm font-medium">
                                    Available Balance
                                 </p>
                                 <div className="text-2xl font-bold">
                                    {formatCurrency(balance.availableBalance)}
                                 </div>
                              </div>
                              <Wallet className="h-8 w-8 text-green-100" />
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardContent className="pt-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-blue-100 text-sm font-medium">
                                    Total Earnings
                                 </p>
                                 <div className="text-2xl font-bold">
                                    {formatCurrency(balance.totalEarnings)}
                                 </div>
                              </div>
                              <TrendingUp className="h-8 w-8 text-blue-100" />
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                        <CardContent className="pt-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-yellow-100 text-sm font-medium">
                                    Pending Balance
                                 </p>
                                 <div className="text-2xl font-bold">
                                    {formatCurrency(balance.pendingBalance)}
                                 </div>
                              </div>
                              <Clock className="h-8 w-8 text-yellow-100" />
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardContent className="pt-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-purple-100 text-sm font-medium">
                                    Total Withdrawn
                                 </p>
                                 <div className="text-2xl font-bold">
                                    {formatCurrency(balance.totalWithdrawn)}
                                 </div>
                              </div>
                              <ArrowDownLeft className="h-8 w-8 text-purple-100" />
                           </div>
                        </CardContent>
                     </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="mb-8">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <PiggyBank className="h-5 w-5" />
                           Quick Actions
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                           <Dialog
                              open={withdrawDialogOpen}
                              onOpenChange={setWithdrawDialogOpen}
                           >
                              <DialogTrigger asChild>
                                 <Button
                                    className="flex items-center gap-2"
                                    disabled={balance.availableBalance < 10}
                                 >
                                    <ArrowDownLeft className="h-4 w-4" />
                                    Request Withdrawal
                                 </Button>
                              </DialogTrigger>
                              <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                                 <DialogHeader>
                                    <DialogTitle>
                                       Request Withdrawal
                                    </DialogTitle>
                                    <DialogDescription>
                                       Withdraw funds from your available
                                       balance
                                    </DialogDescription>
                                 </DialogHeader>
                                 <WithdrawForm
                                    amount={withdrawAmount}
                                    setAmount={setWithdrawAmount}
                                    method={withdrawMethod}
                                    setMethod={setWithdrawMethod}
                                    notes={withdrawNotes}
                                    setNotes={setWithdrawNotes}
                                    bankDetails={bankDetails}
                                    setBankDetails={setBankDetails}
                                    paypalDetails={paypalDetails}
                                    setPaypalDetails={setPaypalDetails}
                                    cryptoDetails={cryptoDetails}
                                    setCryptoDetails={setCryptoDetails}
                                    processing={processing}
                                    availableBalance={balance.availableBalance}
                                    onSubmit={submitWithdrawRequest}
                                    onCancel={() => {
                                       setWithdrawDialogOpen(false);
                                       setBankDetails({ accountNumber: "", routingNumber: "", bankName: "", accountHolderName: "", swiftCode: "" });
                                       setPaypalDetails({ email: "" });
                                       setCryptoDetails({ walletAddress: "", currency: "BTC" });
                                    } }
                                    withdrawMethods={withdrawMethods}
                                    currency={currency}
                                 />
                              </DialogContent>
                           </Dialog>
                        </div>

                        {balance.availableBalance < 10 && (
                           <p className="text-sm text-gray-500 mt-2">
                              Minimum withdrawal amount is 10 {currency}. Complete more
                              jobs to increase your balance.
                           </p>
                        )}
                     </CardContent>
                  </Card>

                  {/* Main Content Tabs */}
                  <Tabs defaultValue="withdrawals" className="space-y-6">
                     <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="withdrawals"  className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">
                           Withdrawals
                        </TabsTrigger>
                        <TabsTrigger value="earnings"  className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">
                           Earnings History
                        </TabsTrigger>
                        <TabsTrigger value="analytics"  className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">Analytics</TabsTrigger>
                     </TabsList>

                     {/* Withdrawals Tab */}
                     <TabsContent value="withdrawals">
                        <Card>
                           <CardHeader>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                 <div>
                                    <CardTitle>Withdrawal History</CardTitle>
                                    <CardDescription>
                                       Track all your withdrawal requests and
                                       their status
                                    </CardDescription>
                                 </div>
                                 <div className="flex gap-2">
                                    <div className="relative">
                                       <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                       <Input
                                          placeholder="Search withdrawals..."
                                          value={filters.search}
                                          onChange={(e) =>
                                             setFilters((prev) => ({
                                                ...prev,
                                                search: e.target.value,
                                             }))
                                          }
                                          className="pl-10 w-64"
                                       />
                                    </div>
                                    <Select
                                       value={filters.status}
                                       onValueChange={(value) =>
                                          setFilters((prev) => ({
                                             ...prev,
                                             status: value,
                                          }))
                                       }
                                    >
                                       <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Status" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="all">
                                             All Status
                                          </SelectItem>
                                          <SelectItem value="pending">
                                             Pending
                                          </SelectItem>
                                          <SelectItem value="processing">
                                             Processing
                                          </SelectItem>
                                          <SelectItem value="completed">
                                             Completed
                                          </SelectItem>
                                          <SelectItem value="failed">
                                             Failed
                                          </SelectItem>
                                          <SelectItem value="cancelled">
                                             Cancelled
                                          </SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              </div>
                           </CardHeader>
                           <CardContent>
                              <WithdrawHistoryTable
                                 withdrawals={filteredWithdrawals}
                                 withdrawStatusConfig={withdrawStatusConfig}
                                 formatCurrency={formatCurrency}
                                 formatDate={formatDate}
                              />
                           </CardContent>
                        </Card>
                     </TabsContent>

                     {/* Earnings Tab */}
                     <TabsContent value="earnings">
                        <Card>
                           <CardHeader>
                              <CardTitle>Earnings History</CardTitle>
                              <CardDescription>
                                 Detailed payment history from completed jobs
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <EarningsHistoryTable
                                 payments={filteredPayments}
                                 formatCurrency={formatCurrency}
                                 formatDate={formatDate}
                              />
                           </CardContent>
                        </Card>
                     </TabsContent>

                     {/* Completed Jobs Tab */}
                     <TabsContent value="jobs">
                        <Card>
                           <CardHeader>
                              <CardTitle>Completed Jobs</CardTitle>
                              <CardDescription>
                                 All your completed jobs and their payment
                                 status
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <CompletedJobsTable
                                 jobs={filteredJobs}
                                 jobStatusConfig={jobStatusConfig}
                                 formatCurrency={formatCurrency}
                                 formatDate={formatDate}
                              />
                           </CardContent>
                        </Card>
                     </TabsContent>

                     {/* Analytics Tab */}
                     <TabsContent value="analytics">
                        <EarningsAnalytics
                           balance={balance}
                           withdrawHistory={withdrawHistory}
                           paymentHistory={paymentHistory}
                           formatCurrency={formatCurrency}
                        />
                     </TabsContent>
                  </Tabs>
               </>
            )}
         </div>
      </>
   );
};

// Withdraw Form Component
const WithdrawForm = ({
   amount,
   setAmount,
   method,
   setMethod,
   notes,
   setNotes,
   bankDetails,
   setBankDetails,
   paypalDetails,
   setPaypalDetails,
   cryptoDetails,
   setCryptoDetails,
   processing,
   availableBalance,
   onSubmit,
   onCancel,
   withdrawMethods,
   currency
}) => {
   // const formatCurrency = (amount) => {
   //    return new Intl.NumberFormat("en-US", {
   //       style: "currency",
   //       currency: "USD",
   //    }).format(amount);
   // };
   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`
   };
   const cryptoCurrencies = [
      { value: "BTC", label: "Bitcoin (BTC)" },
      { value: "ETH", label: "Ethereum (ETH)" },
      { value: "USDT", label: "Tether (USDT)" },
      { value: "USDC", label: "USD Coin (USDC)" }
   ];
   return (
      <div className="space-y-2">
         <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
               <span className="text-sm font-medium">Available Balance:</span>
               <span className="text-lg font-bold text-green-600">
                  {formatCurrency(availableBalance)}
               </span>
            </div>
         </div>
         <div>
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
               id="amount"
               type="number"
               placeholder="Enter amount..."
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               min="10"
               max={availableBalance}
               step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
               Minimum: 10.00 {currency} | Maximum: {formatCurrency(availableBalance)}
            </p>
         </div>
         <div>
            <Label htmlFor="method">Withdrawal Method</Label>
            <Select value={method} onValueChange={setMethod}>
               <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal method" />
               </SelectTrigger>
               <SelectContent>
                  {withdrawMethods.map((methodOption) => {
                     const Icon = methodOption.icon;
                     return (
                        <SelectItem key={methodOption.value} value={methodOption.value}>
                           <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {methodOption.label}
                           </div>
                        </SelectItem>
                     );
                  })}
               </SelectContent>
            </Select>
         </div>
         {/* Bank Transfer Details */}
         {method === "bank_transfer" && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
               <h4 className="font-medium text-gray-900">Bank Account Details</h4>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                     <Label htmlFor="accountNumber">Account Number *</Label>
                     <Input
                        id="accountNumber"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="Enter account number"
                        required
                     />
                  </div>
                  <div>
                     <Label htmlFor="routingNumber">Routing Number *</Label>
                     <Input
                        id="routingNumber"
                        value={bankDetails.routingNumber}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                        placeholder="Enter routing number"
                        required
                     />
                  </div>
               </div>
               <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                     id="bankName"
                     value={bankDetails.bankName}
                     onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                     placeholder="Enter bank name"
                     required
                  />
               </div>
               <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                     id="accountHolderName"
                     value={bankDetails.accountHolderName}
                     onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                     placeholder="Enter account holder name"
                     required
                  />
               </div>
               <div>
                  <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                  <Input
                     id="swiftCode"
                     value={bankDetails.swiftCode}
                     onChange={(e) => setBankDetails(prev => ({ ...prev, swiftCode: e.target.value }))}
                     placeholder="Enter SWIFT code (for international transfers)"
                  />
               </div>
            </div>
         )}
         {/* PayPal Details */}
         {method === "paypal" && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
               <h4 className="font-medium text-gray-900">PayPal Details</h4>
               <div>
                  <Label htmlFor="paypalEmail">PayPal Email Address *</Label>
                  <Input
                     id="paypalEmail"
                     type="email"
                     value={paypalDetails.email}
                     onChange={(e) => setPaypalDetails(prev => ({ ...prev, email: e.target.value }))}
                     placeholder="Enter your PayPal email address"
                     required
                  />
               </div>
            </div>
         )}
         {/* Crypto Details */}
         {method === "crypto" && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
               <h4 className="font-medium text-gray-900">Cryptocurrency Details</h4>
               <div>
                  <Label htmlFor="cryptoCurrency">Currency *</Label>
                  <Select
                     value={cryptoDetails.currency}
                     onValueChange={(value) => setCryptoDetails(prev => ({ ...prev, currency: value }))}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Select cryptocurrency" />
                     </SelectTrigger>
                     <SelectContent>
                        {cryptoCurrencies.map(crypto => (
                           <SelectItem key={crypto.value} value={crypto.value}>
                              {crypto.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div>
                  <Label htmlFor="walletAddress">Wallet Address *</Label>
                  <Input
                     id="walletAddress"
                     value={cryptoDetails.walletAddress}
                     onChange={(e) => setCryptoDetails(prev => ({ ...prev, walletAddress: e.target.value }))}
                     placeholder="Enter your wallet address"
                     required
                  />
               </div>
            </div>
         )}
         <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
               id="notes"
               placeholder="Add any notes for this withdrawal..."
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
            />
         </div>
         <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
               <AlertTriangle className="h-5 w-5 text-[#004aad] mt-0.5" />
               <div>
                  <p className="text-sm font-medium text-[#004aad]">Processing Information</p>
                  <p className="text-xs text-[#004aad] mt-1">Withdrawals typically take 3-5 business days to process. You'll receive an email confirmation once your withdrawal has been initiated.</p>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={processing}>Cancel</Button>
            <Button onClick={onSubmit} disabled={processing || !amount || parseFloat(amount) < 10} className="flex-1">
               {processing ? (
                  <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Processing...
                  </>
               ) : (
                  <>
                     <ArrowDownLeft className="h-4 w-4 mr-2" />
                     Request Withdrawal
                  </>
               )}
            </Button>
         </div>
      </div>
   );
};

// Withdrawal History Table Component
const WithdrawHistoryTable = ({
   withdrawals,
   withdrawStatusConfig,
   formatCurrency,
   formatDate,
}) => {
   if (withdrawals.length === 0) {
      return (
         <div className="text-center py-8 text-gray-500">
            <ArrowDownLeft className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No withdrawal history found</p>
            <p className="text-sm mt-1">
               Your withdrawal requests will appear here
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {withdrawals.map((withdrawal, index) => {
            const StatusIcon = withdrawStatusConfig[withdrawal.status]?.icon || Clock;
            return (
               <Card key={index} className="border-l-4 border-l-[#004aad]">
                  <CardContent className="pt-4">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-gray-100 rounded-full">
                              <ArrowDownLeft className="h-4 w-4" />
                           </div>
                           <div>
                              <p className="font-semibold">{formatCurrency(withdrawal.amount)}</p>
                              <p className="text-sm text-gray-500 capitalize">{withdrawal.withdrawalMethod?.replace("_", " ") || withdrawal.method?.replace("_", " ")}</p>
                              {withdrawal.processingFee > 0 && (
                                 <p className="text-xs text-gray-500">Net Amount: {formatCurrency(withdrawal.netAmount || (withdrawal.amount - withdrawal.processingFee))}</p>
                              )}
                           </div>
                        </div>
                        <div className="text-right">
                           <Badge className={withdrawStatusConfig[withdrawal.status]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {withdrawStatusConfig[withdrawal.status]?.label}
                           </Badge>
                           {withdrawal.transactionId && (
                              <p className="text-xs text-gray-500 mt-1">ID: {withdrawal.transactionId.slice(-8)}</p>
                           )}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                           <span className="text-gray-500">Requested:</span>
                           <p>{formatDate(withdrawal.requestedAt)}</p>
                        </div>
                        <div>
                           <span className="text-gray-500">{withdrawal.status === "completed" ? "Completed:" : withdrawal.status === "failed" ? "Failed:" : withdrawal.status === "processing" ? "Processing Since:" : "Status Updated:"}</span>
                           <p>{formatDate(withdrawal.completedAt || withdrawal.failedAt || withdrawal.processedAt || withdrawal.updatedAt)}</p>
                        </div>
                     </div>
                     {/* Payment Method Details */}
                     {withdrawal.bankDetails && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                           <p className="font-medium text-gray-700 mb-2">Bank Details:</p>
                           <div className="grid grid-cols-2 gap-2">
                              <p><span className="text-gray-500">Bank:</span> {withdrawal.bankDetails.bankName}</p>
                              <p><span className="text-gray-500">Account:</span> ****{withdrawal.bankDetails.accountNumber?.slice(-4)}</p>
                              <p><span className="text-gray-500">Holder:</span> {withdrawal.bankDetails.accountHolderName}</p>
                              {withdrawal.bankDetails.swiftCode && (
                                 <p><span className="text-gray-500">SWIFT:</span> {withdrawal.bankDetails.swiftCode}</p>
                              )}
                           </div>
                        </div>
                     )}
                     {withdrawal.paypalDetails && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                           <p className="font-medium text-gray-700 mb-1">PayPal Details:</p>
                           <p><span className="text-gray-500">Email:</span> {withdrawal.paypalDetails.email}</p>
                        </div>
                     )}
                     {withdrawal.cryptoDetails && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                           <p className="font-medium text-gray-700 mb-2">Crypto Details:</p>
                           <p><span className="text-gray-500">Currency:</span> {withdrawal.cryptoDetails.currency}</p>
                           <p><span className="text-gray-500">Wallet:</span> {withdrawal.cryptoDetails.walletAddress?.slice(0, 8)}...{withdrawal.cryptoDetails.walletAddress?.slice(-8)}</p>
                        </div>
                     )}
                     {(withdrawal.metadata?.notes || withdrawal.notes) && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                           <span className="text-gray-500">Notes:</span>
                           <p>{withdrawal.metadata?.notes || withdrawal.notes}</p>
                        </div>
                     )}
                     {withdrawal.adminNotes && withdrawal.adminNotes.length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded text-sm border border-yellow-200">
                           <p className="font-medium text-yellow-800 mb-2">Admin Notes:</p>
                           {withdrawal.adminNotes.map((note, noteIndex) => (
                              <div key={noteIndex} className="mb-2 last:mb-0">
                                 <p className="text-yellow-700">{note.note}</p>
                                 <p className="text-xs text-yellow-600">{formatDate(note.addedAt)}</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </CardContent>
               </Card>
            );
         })}
      </div>
   );
};

// Earnings History Table Component
const EarningsHistoryTable = ({ payments, formatCurrency, formatDate }) => {
   if (payments.length === 0) {
      return (
         <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No earnings history found</p>
            <p className="text-sm mt-1">Complete jobs to start earning</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {payments.map((payment, index) => (
            <Card key={index} className="border-l-4 border-l-green-500">
               <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                           <ArrowUpRight className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                           <p className="font-semibold">{payment.jobTitle}</p>
                           <p className="text-sm text-gray-500">
                              Job ID: {payment.jobId?.slice(-8)}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-green-600">
                           {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                           {formatDate(payment.paidAt)}
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                        <span className="text-gray-500">Client:</span>
                        <p>{payment.clientName}</p>
                     </div>
                     <div>
                        <span className="text-gray-500">Payment Method:</span>
                        <p className="capitalize">
                           {payment.paymentMethod?.replace("_", " ")}
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
};

// Completed Jobs Table Component
const CompletedJobsTable = ({
   jobs,
   jobStatusConfig,
   formatCurrency,
   formatDate,
}) => {
   if (jobs.length === 0) {
      return (
         <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No completed jobs found</p>
            <p className="text-sm mt-1">Completed jobs will appear here</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {jobs.map((job, index) => {
            const StatusIcon = jobStatusConfig[job.status]?.icon || CheckCircle;
            const isPaid = job.paymentStatus === "paid";

            return (
               <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                     <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                           <h3 className="font-semibold">{job.title}</h3>
                           <p className="text-sm text-gray-600 mt-1">
                              {job.description}
                           </p>
                           <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                 <User className="h-3 w-3" />
                                 {job.clientName}
                              </span>
                              <span className="flex items-center gap-1">
                                 <MapPin className="h-3 w-3" />
                                 {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 {formatDate(job.actualCompletionDate)}
                              </span>
                           </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                           <Badge
                              className={jobStatusConfig[job.status]?.color}
                           >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {jobStatusConfig[job.status]?.label}
                           </Badge>

                           {isPaid ? (
                              <Badge className="bg-green-100 text-green-800">
                                 <CheckCircle className="h-3 w-3 mr-1" />
                                 Paid
                              </Badge>
                           ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                 <Clock className="h-3 w-3 mr-1" />
                                 Pending Payment
                              </Badge>
                           )}
                        </div>
                     </div>

                     <Separator className="my-3" />

                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                           <span>
                              Job Amount:{" "}
                              <strong>
                                 {formatCurrency(
                                    job.finalQuotedAmount || job.estimatedTotal
                                 )}
                              </strong>
                           </span>
                           {isPaid && (
                              <span className="text-green-600">
                                 Earned:{" "}
                                 <strong>
                                    {formatCurrency(job.paymentAmount)}
                                 </strong>
                              </span>
                           )}
                        </div>

                        <div className="flex gap-2">
                           <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                           </Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            );
         })}
      </div>
   );
};

// Analytics Component
const EarningsAnalytics = ({
   balance,
   withdrawHistory,
   paymentHistory,
   formatCurrency,
}) => {
   // Calculate analytics data
   const totalJobs = paymentHistory.length;
   const averageJobValue =
      totalJobs > 0 ? balance.totalEarnings / totalJobs : 0;
   const totalWithdrawals = withdrawHistory.length;
   const averageWithdrawal =
      totalWithdrawals > 0 ? balance.totalWithdrawn / totalWithdrawals : 0;

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
               <CardTitle>Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between">
                  <span>Total Jobs Completed:</span>
                  <span className="font-semibold">{totalJobs}</span>
               </div>
               <div className="flex justify-between">
                  <span>Average Job Value:</span>
                  <span className="font-semibold">
                     {formatCurrency(averageJobValue)}
                  </span>
               </div>
               <div className="flex justify-between">
                  <span>Total Earnings:</span>
                  <span className="font-semibold text-green-600">
                     {formatCurrency(balance.totalEarnings)}
                  </span>
               </div>
               <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="font-semibold text-blue-600">
                     {formatCurrency(balance.availableBalance)}
                  </span>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Withdrawal Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between">
                  <span>Total Withdrawals:</span>
                  <span className="font-semibold">{totalWithdrawals}</span>
               </div>
               <div className="flex justify-between">
                  <span>Average Withdrawal:</span>
                  <span className="font-semibold">
                     {formatCurrency(averageWithdrawal)}
                  </span>
               </div>
               <div className="flex justify-between">
                  <span>Total Withdrawn:</span>
                  <span className="font-semibold text-purple-600">
                     {formatCurrency(balance.totalWithdrawn)}
                  </span>
               </div>
               <div className="flex justify-between">
                  <span>Pending Balance:</span>
                  <span className="font-semibold text-yellow-600">
                     {formatCurrency(balance.pendingBalance)}
                  </span>
               </div>
            </CardContent>
         </Card>
      </div>
   );
};

export default ServiceProviderWithdraw;
