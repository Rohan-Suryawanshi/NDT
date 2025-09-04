import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import VerifyEmail from "./pages/verify-email";
import Login from "./pages/Login";
import DashboardClient from "./pages/DashbordClient";
import FindProviders from "./pages/FindProvider";
import ClientAccountSettings from "./pages/ClientAccountSettings";
import DashboardProvider from "./pages/DashbordProvider";
import CertificateManager from "./features/CertificateManager/CertificateManager";
import EquipmentManager from "./features/EquipmentManager/EquipmentManager";
import SkillMatrixManager from "./features/SkillMatrixManager/SkillMatrixManager";
import ServiceProviderProfileManage from "./pages/ServiceProviderProfileManage";
import OfferedServicesManager from "./pages/OfferedServicesManager";
import GeminiForm from "./features/Gemini/GeminiForm";
import DashboardInspector from "./pages/DashbordInspector";
import ManageInspectorProfile from "./pages/ManageInspectorProfile";
import EnhancedJobRequestForm from "./features/JobRequest/EnhancedJobRequestForm";
import JobRequestsDashboard from "./pages/JobRequestsDashboard";
import NotFound from "./pages/NotFound";
import ClientServiceRequest from "./pages/ClientServiceRequest";
import ClientProviderSelection from "./pages/ClientProviderSelection";
import InspectorJobDashboard from "./pages/InspectorJobDashboard";
import DownloadReportWrapper from "./pages/DownloadReportWrapper";
import ServiceProviderWithdraw from "./pages/ServiceProviderWithdraw";
import InspectorWithdraw from "./pages/InspectorWithdraw";
import InspectorFeedback from "./pages/InspectorFeedback";
import ServiceProviderFeedback from "./pages/ServiceProviderFeedback";
import Loader from "./components/common/Loader";
import AdminSettings from "./pages/AdminSettings";
import ServiceManager from "./pages/ServiceManager";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminWithdrawManagement from "./pages/AdminWithdrawManagement";
import AdminRevenue from "./pages/AdminRevenue";
import AdminJobManagement from "./pages/AdminJobManagement";
import GetRecommendations from "./pages/GetRecommendations";
import ProtectedRoute from "./ProtectedRoute";
import AvailableRegions from "./pages/AvailableRegions";
import FindInspector from "./pages/FindInspector";
export default function App() {
   return (
         <Router>
            <Routes>
               <Route path="/" element={<LandingPage />} />
               <Route path="/available-regions" element={<AvailableRegions/>}/>
               <Route path="/register" element={<Register />} />
               <Route path="/verify-email" element={<VerifyEmail />} />
               <Route path="/login" element={<Login />} />
               <Route
                  path="/dashboard-client"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <DashboardClient />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/dashboard-inspector"
                  element={
                     <ProtectedRoute allowedRoles={["inspector", "admin"]}>
                        <DashboardInspector />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/find-providers"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <FindProviders />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/account-settings"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <ClientAccountSettings />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/dashboard-provider"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <DashboardProvider />
                     </ProtectedRoute>
                  }
               />
               {/* <Route
               path="/provider-profile"
               element={<ServiceProviderProfile />}
            /> */}
               <Route
                  path="/certificate"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <CertificateManager />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/equipment"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <EquipmentManager />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/skill-matrix"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <SkillMatrixManager />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/provider-profile"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <ServiceProviderProfileManage />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/offered-services-manager"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <OfferedServicesManager />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/gemini"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <GeminiForm />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/inspector-profile"
                  element={
                     <ProtectedRoute allowedRoles={["inspector", "admin"]}>
                        <ManageInspectorProfile />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/request-service/:providerId"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <EnhancedJobRequestForm />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/service-request"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <JobRequestsDashboard />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/client-requests"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <ClientServiceRequest />
                     </ProtectedRoute>
                  }
               />

               <Route
                  path="/find-inspectors"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        {/* <ClientProviderSelection /> */}
                        <FindInspector/>
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/get-recommendations"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <GetRecommendations />
                     </ProtectedRoute>
                  }
               />

               <Route
                  path="/inspector/assigned-jobs"
                  element={
                     <ProtectedRoute allowedRoles={["inspector", "admin"]}>
                        <InspectorJobDashboard />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/download-reports"
                  element={
                     <ProtectedRoute allowedRoles={["client", "admin"]}>
                        <DownloadReportWrapper />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/provider/withdraw"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <ServiceProviderWithdraw />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/inspector/withdraw"
                  element={
                     <ProtectedRoute allowedRoles={["inspector", "admin"]}>
                        <InspectorWithdraw />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/inspector/feedback"
                  element={
                     <ProtectedRoute allowedRoles={["inspector", "admin"]}>
                        <InspectorFeedback />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/provider/feedback"
                  element={
                     <ProtectedRoute allowedRoles={["provider", "admin"]}>
                        <ServiceProviderFeedback />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/settings"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminSettings />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/service-manager"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <ServiceManager />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/user-management"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminUserManagement />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/dashboard-admin"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/dashboard"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                     </ProtectedRoute>
                  }
               />
               <Route path="/loader" element={<Loader />} />
               <Route
                  path="/admin/payments"
                  element={
                     <ProtectedRoute allowedRoles={["finance", "admin"]}>
                        <AdminWithdrawManagement />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/revenue"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminRevenue />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/admin/job-management"
                  element={
                     <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminJobManagement />
                     </ProtectedRoute>
                  }
               />
               <Route path="*" element={<NotFound />} />
            </Routes>
         </Router>
   );
}
