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

export default function App() {
   return (
      <Router>
         <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard-client" element={<DashboardClient />} />
            <Route path="/find-providers" element={<FindProviders />} />
            <Route
               path="/account-settings"
               element={<ClientAccountSettings />}
            />
            <Route path="/dashboard-provider" element={<DashboardProvider />} />
            <Route
               path="/provider-profile"
               element={<ServiceProviderProfile />}
            />
         </Routes>
      </Router>
   );
}
