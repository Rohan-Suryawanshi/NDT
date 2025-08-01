import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import VerifyEmail from "./pages/verify-email";
import Login from "./pages/Login";
import DashboardClient from "./pages/DashbordClient";
import FindProviders from "./pages/FindProvider";
import ClientAccountSettings from "./pages/ClientAccountSettings";
import DashboardProvider from "./pages/DashbordProvider";
import ServiceProviderProfile from "./pages/ServiceProviderProfile";
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

            <Route path="/client" element={<ClientProviderSelection/>} />
            <Route path="/inspector/assigned-jobs" element={<InspectorJobDashboard/>} />
            <Route path="*" element={<NotFound />} />


         </Routes>
      </Router>
   );
}
