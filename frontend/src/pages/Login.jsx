import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/constant/Global";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import axios from "axios";

export default function Login() {
   const navigate = useNavigate();
   const { login } = useAuth();

   const [form, setForm] = useState({
      email: "",
      password: "",
   });

   const [loading, setLoading] = useState(false);

   // Profile check function
   const checkUserProfile = async (userRole, token) => {
      try {
         let endpoint;
         
         switch (userRole) {
            case "client":
               endpoint = `${BACKEND_URL}/api/v1/client-routes/profile`;
               break;
            case "provider":
               endpoint = `${BACKEND_URL}/api/v1/service-provider/profile`;
               break;
            case "inspector":
               endpoint = `${BACKEND_URL}/api/v1/inspectors/profile`;
               break;
            default:
               throw new Error("Invalid user role");
         }

         const response = await axios.get(endpoint, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });
         
         // If we get here without error, profile exists
         return {
            hasProfile: true,
            profile: response.data.data || response.data
         };
      } catch (error) {
         // If 404 or any error, profile doesn't exist
         console.log(`Profile check for ${userRole}:`, error.response?.status);
         return {
            hasProfile: false,
            profile: null,
            userRole
         };
      }
   };

   // Get profile setup page path
   const getProfileSetupPath = (userRole) => {
      switch (userRole) {
         case "client":
            return "/account-settings";
         case "provider":
            return "/provider-profile";
         case "inspector":
            return "/inspector-profile";
         default:
            return "/login";
      }
   };

   // Get dashboard path
   const getDashboardPath = (userRole) => {
      switch (userRole) {
         case "client":
            return "/dashboard-client";
         case "provider":
            return "/dashboard-provider";
         case "inspector":
            return "/dashboard-inspector";
         case "admin":
            return "/admin/dashboard";
         case "finance":
            return "/admin/payments";
         default:
            return "/dashboard";
      }
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
   };

   const handleLogin = async (e) => {
      e.preventDefault();

      if (!form.email || !form.password) {
         toast.error("Email and Password are required");
         return;
      }

      setLoading(true);
      try {
         const res = await fetch(`${BACKEND_URL}/api/v1/users/login`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
         });

         const data = await res.json();

         if (!res.ok) {
            toast.error(data.message || "Login failed");
         } else {
            toast.success("Login successful!");
            
            const user = data.data.user;
            const token = data.data.accessToken;

            // Use the login function from useAuth hook
            login(user, token);

            // Check if profile exists for non-admin users
            if (user.role === "admin" || user.role === "finance") {
               // Admin and finance users don't need profile setup
               navigate(getDashboardPath(user.role),{replace:true});
            } else {
               // Check profile for client, provider, inspector
               const profileCheck = await checkUserProfile(user.role, token);
               
               if (!profileCheck.hasProfile) {
                  // No profile found - redirect to profile setup
                  toast.error("Please create your profile to get started");
                  if(user.role=="provider")
                  {
                     localStorage.setItem("firstLogin",true);
                  }
                  const profilePath = getProfileSetupPath(user.role);
                  navigate(profilePath,{replace:true});
               } else {
                  // Profile exists - redirect to dashboard
                  toast.success("Welcome back!");
                  const dashboardPath = getDashboardPath(user.role);
                  navigate(dashboardPath);
               }
            }
         }
      } catch (err) {
         console.error("Login error:", err);
         toast.error("Something went wrong");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
         <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-white p-8 rounded-lg shadow space-y-6"
         >
            <h2 className="text-3xl font-bold text-center text-[#004aad]">
               Login
            </h2>

            <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">
                  Email
               </label>
               <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
               />
            </div>

            <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">
                  Password
               </label>
               <Input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
               />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
               {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-sm text-center text-gray-600 mt-4">
               Don’t have an account?{" "}
               <span
                  onClick={() => navigate("/register")}
                  className="text-[#004aad] hover:underline cursor-pointer"
               >
                  Register
               </span>
            </p>
         </form>
      </div>
   );
}
