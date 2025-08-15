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

export default function App() {
   return (
      <Router>
         <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard-client" element={<DashboardClient />} />
             <Route path="/dashboard-inspector" element={<DashboardInspector />} />
            <Route path="/find-providers" element={<FindProviders />} />
            <Route
               path="/account-settings"
               element={<ClientAccountSettings />}
            />
            <Route path="/dashboard-provider" element={<DashboardProvider />} />
            {/* <Route
               path="/provider-profile"
               element={<ServiceProviderProfile />}
            /> */}
            <Route path="/certificate" element={<CertificateManager />} />
            <Route path="/equipment" element={<EquipmentManager />} />
            <Route path="/skill-matrix" element={<SkillMatrixManager />} />
            <Route path="/provider-profile" element={<ServiceProviderProfileManage />} />
            <Route path="/offered-services-manager" element={<OfferedServicesManager />} />
            <Route path="/gemini" element={<GeminiForm/>} />
            <Route path="/inspector-profile" element={<ManageInspectorProfile/>} />
            <Route path="/request-service/:providerId" element={<EnhancedJobRequestForm />} />
            <Route path="/service-request" element={<JobRequestsDashboard/>} />
            <Route path="/client-requests" element={<ClientServiceRequest/>} />

            <Route path="/find-inspectors" element={<ClientProviderSelection/>} />
            <Route path="/get-recommendations" element={<GetRecommendations/>}/>
            
            <Route path="/inspector/assigned-jobs" element={<InspectorJobDashboard/>} />
            <Route path="/download-reports" element={<DownloadReportWrapper/>} />
            <Route path="/provider/withdraw" element={<ServiceProviderWithdraw/>} />
            <Route path="/inspector/withdraw" element={<InspectorWithdraw/>} />
            <Route path="/inspector/feedback" element={<InspectorFeedback/>} />
            <Route path="/provider/feedback" element={<ServiceProviderFeedback/>} />
            <Route path="/admin/settings" element={<AdminSettings/>}/>
            <Route path="/admin/service-manager" element={<ServiceManager/>}/>
            <Route path="/admin/user-management" element={<AdminUserManagement/>}/>
            <Route path="/dashboard-admin" element={<AdminDashboard/>}/>
            <Route path="/admin/dashboard" element={<AdminDashboard/>}/>
            <Route path="/loader" element={<Loader />} />
             <Route path="/admin/payments" element={<AdminWithdrawManagement/>}/>
             <Route path="/admin/revenue" element={<AdminRevenue/>} />
             <Route path="/admin/job-management" element={<AdminJobManagement/>}/>
            <Route path="*" element={<NotFound />} />            
           


         </Routes>
      </Router>
   );
}
